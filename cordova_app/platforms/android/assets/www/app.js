// JavaScript para escanear dispositivos BLE.

// Application object.
var app = {};

// Listado de dispositivos.
app.devices = {};

var funciones_servidor = {};
var funciones_by_id = {}

//app.veces = {};
app.distanciatotal = {} ;
// UI methods.
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


// Start the scan. Call the callback function when a device is found.
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
			// Report success. Sometimes an RSSI of +127 is reported.
			// We filter out these values here.
			if (device.rssi <= 0)
			{
				callbackFun(device, null);
			}
		},
		function(errorCode)
		{
			// Report error.
			callbackFun(null, errorCode);
		}
	);
};

// Dejar de escanear.
app.stopScan = function()
{
	evothings.ble.stopScan();
};

// Se llama cuando se presiona el boton de escanear.
app.ui.onStartScanButton = function()
{
	app.startScan(app.ui.deviceFound);
	app.ui.displayStatus('Escaneando');
	app.ui.updateTimer = setInterval(app.ui.displayDeviceList, 50);
};

// Se llama cuando se presiona el boton de detener.
app.ui.onStopScanButton = function()
{
	app.stopScan();
	app.devices = {};
	app.ui.displayStatus('Escaneo Pausado.');
	app.ui.displayDeviceList();
	clearInterval(app.ui.updateTimer);
};

//Recuperar JSON con info del server
var getJSON = function(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open("get", url, true);
    xhr.responseType = "json";
    xhr.onload = function() {
      var status = xhr.status;
      if (status == 200) {
        callback(null, xhr.response);
      } else {
        callback(status);
      }
    };
    xhr.send();
};
var json_obj;
var funcionId;
// Se llama cuando se encuentra un dispositivo.
app.ui.deviceFound = function(device, errorCode)
{
	if (device)
	{
		// Se añade la hora para ver que dispositivo es reciente
		device.timeStamp = Date.now();
		
		var tx = device.advertisementData.kCBAdvDataTxPowerLevel;
		var rssi = device.rssi;
		var temp = Math.pow(10, (tx - rssi) / (20)) ;
		device.dist = Math.round(temp);
		var tmp = device.dist;
		
		/* veces se utilizaba como indice para ir guardando los ultimos 10 y sacar promedio, pero no funciona
		if(app.devices[device.address] != null){
			
			if(app.veces[device.address] < 10){
				app.veces[device.address] += 1;
			}else{
				app.veces[device.address] = 0;
				
			}
			//app.distanciatotal[device.address][app.veces[device.address]] = device.dist;
		}else{
			//Inicializacion
			app.veces[device.address] = 0;
			app.distanciatotal[device.address] = 0;
			//device.arreglo = [11];
		}
		
		var v = app.veces[device.address];
		//device.arreglo[v] = device.dist; //Por alguna razon esta linea hace que deje de Actualizar las distancias, quedan la primera fija, acá y en la otra funcion que la calcula 		
		*/
		
		//Buscamos el dispositivo y almacenamos la funcion en un arreglo
		//alert(device.name);
		getJSON('https://murmuring-tundra-13303.herokuapp.com/beacons/'+device.name+'.json',
		function(err, data) {
		  if (err != null) {
			alert("Something went wrong: " + err);
			//json_obj = null;
		  } else {
			//json_obj = JSON.parse(data);
			//alert("Your query count: " + JSON.parse(data).function_id);
			
			funciones_servidor[device.address] = JSON.parse(data).function_id;
			//alert('Dentro'+funciones_servidor[device.address]);
			var id = funciones_servidor[device.address];
			//alert('ID SOLO:'+id);
			//Si esa funcion nunca se cargo antes, se busca en el server y se carga en otro arreglo
			if(funciones_by_id[id] == null){
				getJSON('https://murmuring-tundra-13303.herokuapp.com/functions/'+id+'.json',
				function(err, data) {
				  if (err != null) {
					alert("Something went wrong: " + err);
					//json_obj = null;
				  } else {
					//json_obj = JSON.parse(data);
					//alert("Your query count: " + json_obj.estado);
					funciones_by_id[id] = JSON.parse(data).nombre;
					//alert(funciones_by_id[id]);
					//alert(funciones_by_id[funciones_servidor[device.address]]);
				  }
				});
			}
		  }
		});
		
		/*
		*/		
		app.devices[device.address] = device;
		// Agregar/actualizar el dispositivo .
		
	}
	else if (errorCode)
	{
		app.ui.displayStatus('Scan Error: ' + errorCode);
	}
};

// Mostar el listado de dispositivos.
app.ui.displayDeviceList = function()
{
	// Vaciar el listado de dispositivos.
	$('#found-devices').empty();

	var timeNow = Date.now();//Hora actual

	$.each(app.devices, function(key, device)
	{
		
		var tx = device.advertisementData.kCBAdvDataTxPowerLevel;
		var rssi = device.rssi;
		var dist = 'Indefinida';
		var dist2 = 1.23;
		var tmp = 1.23;
		var ratio = 1.23; 
		
		var estadosemaforo = 'algo';
		/* Recuperar el estado de un semaforo
		getJSON("https://murmuring-tundra-13303.herokuapp.com/semaforos/1.json",
		function(err, data) {
		  if (err != null) {
			//alert("Something went wrong: " + err);
			json_obj = null;
		  } else {
			json_obj = JSON.parse(data);
			//alert("Your query count: " + json_obj.estado);
			
		  }
		});*/
		//estadosemaforo = json_obj.estado;
		
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
			if(dist2 < 0){
				dist = 'Error';
			}else{
				if(dist2 < 100){
					dist = 'Muy Cerca';
				}else{
					if(dist2 < 500){
						dist = 'Cerca';
					}else{
						dist = 'Lejos';
					}
				}
			}
		}
		
		var binary_string =  window.atob(device.scanRecord);
		var len = binary_string.length;
		var bytes = new Uint8Array( len );
		for (var i = 0; i < len; i++)        {
			bytes[i] = binary_string.charCodeAt(i);
		}
		var semaforo = 'nada';
		if(bytes[52] == 0x31){
			semaforo = 'Rojo';
		}else{
			semaforo = 'Verde';
		}
		var mayor = ((bytes[25] % 256) * 0x100  ) + (bytes[26] % 256) ;
		var menor = ((bytes[27] % 256) * 0x100  ) + (bytes[28] % 256) ;;
		//var menor2 = bytes[28] % 255;
		// Create tag for device data.
		//var promedio = 0; Este promedio se actualizaba en base a las distancias anteriores pero es menos preciso a medidas que uno se acerca
		//var id = app.funciones_servidor[device.address];
		var funcion = "Procesando....";
		if( funciones_by_id[funciones_servidor[device.address]] != null){
			funcion = funciones_by_id[funciones_servidor[device.address]];
		}
		var element = $(
			//Informacion proporcionada por el dispositivo
			'<li>'
			+	'<strong>' + device.name + '</strong><br />'
			// Si es semaforo imprime el estado
			+	(device.name[0]=='s' ? 'Estado del semáforo: ' + semaforo + '<br />' : '')
			+	'RSSI:' + device.rssi + '<br />' 	//Para referencia
			+	'Tx:' +  tx + '<br / >'				//Idem
			+	'Mayor:' +  mayor + '<br / >'
			+	'Menor:' +  menor + '<br / >'
			//+	'Veces:' +  app.veces[device.address] + '<br / >'
			+	'Distancia: ' + dist + ' ('+dist2+' cm). <br />'
			//+	'Distancia del device: ' + device.dist + ' cm. '+' Promedio:'+ promedio +' <br />'
			+ '<hr>'
			+ 'Informacion proporcionada por el servidor: <br>' 
			+ '[PH] Funcion: '+ funcion + '<br>'
			+ '</li>'
		);

		$('#found-devices').append(element);
	});
};

// Actualizar el tag de estado en el html
app.ui.displayStatus = function(message)
{
	$('#scan-status').html(message);
};



app.initialize();
