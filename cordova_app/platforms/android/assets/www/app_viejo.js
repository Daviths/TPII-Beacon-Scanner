//Variables
// Application object.
var app = {};

// Listado de dispositivos.
app.devices = {};

app.veces = {};
app.distanciatotal = {} ;

// UI (metodos).
app.ui = {};

// Timer that updates the device list and removes inactive
// devices in case no devices are found by scan.
app.ui.updateTimer = null;


app.initialize = function()
{
	document.addEventListener(
		'deviceready',
		function() { evothings.scriptsLoaded(app.onDeviceReady) },
		false);
};

app.onDeviceReady = function()
{
	// Not used.
	// Here you can update the UI to say that
	// the device (the phone/tablet) is ready
	// to use BLE and other Cordova functions.
};

// Start the scan. Llama a la funcion cuando encuentra un dispositivo
// Format:
//   callbackFun(deviceInfo, errorCode)
//   deviceInfo: address, rssi, name
//   errorCode: String
app.startScan = function(callbackFun)
{
	app.stopScan();

	evothings.ble.startScan(
		function(device)
		{
			// Filtramos si poseen un valor de RSSI invalido.
			if (device.rssi <= 0)
			{
				callbackFun(device, null);
			}
		},
		function(errorCode)
		{
			// Error.
			callbackFun(null, errorCode);
		}
	);
};

// Dejar de escanear por dispositivos.
app.stopScan = function()
{
	evothings.ble.stopScan();
};

// Llama a la funcion cuando se presiona el boton de inicio de escaneo.
app.ui.onStartScanButton = function()
{
	app.startScan(app.ui.deviceFound);
	app.ui.displayStatus('Escaneando');
	app.ui.updateTimer = setInterval(app.ui.displayDeviceList, 50);
};

// Llama a la funcion de deterner al presionar el boton.
app.ui.onStopScanButton = function()
{
	app.stopScan();
	app.devices = {};
	app.ui.displayStatus('Escaneo Pausado.');
	app.ui.displayDeviceList();
	clearInterval(app.ui.updateTimer);
};

// Cuando se encuentra  un dispositivo se llama a esta funcion.
app.ui.deviceFound = function(device, errorCode)
{
	if (device)
	{
		// Agrega la hora para descartar dispositivos viejos (no usado todabia)
		device.timeStamp = Date.now();
		
		var tx = device.advertisementData.kCBAdvDataTxPowerLevel;
		var rssi = device.rssi;
		//Calculo de la distancia
		var temp = Math.pow(10, (tx - rssi) / (20)) ;
		device.dist = Math.round(temp);
		
		if(app.devices[device.address] != null){
			
			if(app.veces[device.address] < 9){
				app.veces[device.address] += 1;
			}else{
				app.veces[device.address] = 0;
			}
			
			//app.distanciatotal[device.address][app.veces[device.address]] = device.dist;
		}else{
			//Inicializacion
			app.veces[device.address] = 0;
			app.distanciatotal[device.address] = 0;
		}
		
		//var v = app.veces[device.address];
		
		/*if(app.distancias[device.address] != null){
			app.distancias[device.address][v]= temp;
		}else{
			app.distancias[device.address] = new Array(10);
			app.distancias[device.address][0] = temp;
		}*/
		
		//device.arreglo[v] = device.dist; //Por alguna razon esta linea hace que deje de Actualizar las distancias, quedan la primera fija, acá y en la otra funcion que la calcula 		
		
		app.devices[device.address] = device;
		// Agrega/reemplaza el dispositivo en la tabla.
		
	}
	else if (errorCode)
	{
		app.ui.displayStatus('Scan Error: ' + errorCode);
	}
};

// Muestra en pantalla el listado de dispositivos.
app.ui.displayDeviceList = function()
{
	// Vacia el listado.
	$('#found-devices').empty();

	var timeNow = Date.now();

	$.each(app.devices, function(key, device)
	{

			var tx = device.advertisementData.kCBAdvDataTxPowerLevel;
			var rssi = device.rssi;
			var dist = 'Indefinida';
			var dist2 = 1.23;
			var tmp = 1.23;
			var ratio = 1.23;
			if(rssi == 0){
				dist2 = -1; 
			}else{ 
				/*Da valores incorrectos
				if(tx != 0){
					ratio = rssi/tx;
					if(ratio < 1){
						tmp = (Math.pow(ratio,10));
						dist = Math.round(tmp);
					}else{
						tmp =  ((0.89976)*Math.pow(ratio,7.7095) + 0.111);
						dist = Math.round(tmp);
					}
				}	*/			
				tmp = Math.pow(10, (tx - rssi) / (20));
				dist2 = Math.round(tmp);
				if(dist2 < 100){
					dist = 'Muy cerca';
				}else{
					if(dist2 < 400){
						dist = 'Cerca';
					}else{
						dist = 'Lejos';
					}
				}
			}
			//Decodificamos el ScanRecord del dispositivos:
			var binary_string =  window.atob(device.scanRecord);
			var len = binary_string.length;
			var bytes = new Uint8Array( len );
			for (var i = 0; i < len; i++)        {
				bytes[i] = binary_string.charCodeAt(i);
			}
			var semaforo = 'nada'; //Inciamos la variable con un valor arbitrario
			//Buscamos el valor del FLAG en el ScanRecord y actualizamos el valor del semaforo
			if(bytes[52] == 0x31){
				semaforo = 'Rojo';
			}else{
				semaforo = 'Verde';
			}
			//Buscamos los valores de Mayor y Menor
			var mayor = ((bytes[25] % 256) * 0x100  ) + (bytes[26] % 256) ;
			var menor = ((bytes[27] % 256) * 0x100  ) + (bytes[28] % 256) ;;
			var promedio = 0;
			/*if(app.veces[device.address] <= 0){
				promedio = device.dist;
			}else{
				promedio = Math.round(app.distanciatotal[device.address] / app.veces[device.address]);
			}*/
			var element = $(
				'<li>'
				+	'<strong>' + device.name + '</strong><br />'
				//Si el nombre del dispositivo comienza con 's' es un semaforo e imprime el valor del FLAG
				+	(device.name[0]=='s' ? semaforo + '<br />' : '')
				+	'RSSI:' + device.rssi + '<br />'
				+	'Tx:' +  tx + '<br / >'
				+	'Mayor:' +  mayor + '<br / >'
				+	'Menor:' +  menor + '<br / >'
				+	'Veces:' +  app.veces[device.address] + '<br / >' 
				+	'Distancia: ' + dist + ' ('+dist2+' cm). <br />'  //Distancia calculada recien, deberia ser igual
				+	'Distancia del device: ' + device.dist + ' cm. '+' Promedio:'+ promedio +' <br />' //Distancia calculada al encontrar el dispositivo
				+ 	'Arrglo: ' + device.arreglo[0] + '<br />'
				+ '</li>'
			);

			$('#found-devices').append(element);
	});
};

// Actualiza el string de estado 
app.ui.displayStatus = function(message)
{
	$('#scan-status').html(message);
};



app.initialize();
