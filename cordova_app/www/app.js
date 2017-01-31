// JavaScript para escanear dispositivos BLE.

// Application object.
var app = {};

// Listado de dispositivos.
app.devices = {};
//Variables usadas para almacenar las funciones levantadas desde el servidor
var funciones_servidor = {};
var funciones_by_id = {}
//Variable utilizada para que solo comienze a leer los beacons al encontrar el primero y no cada uno
var primera_adicion = true;
//Enumerativo para distingir si se escanea solo semaforos o solo locales.
var Escanear_por = {
	SEMAFORO 	: 'semáforos',
	LOCAL			: 'locales'
};

app.distanciatotal = {} ;
// UI methods.
app.ui = {};

// Timer that updates the device list and removes inactive
// devices in case no devices are found by scan.
app.ui.updateTimer = null;

//Inicializa la funcion
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
	primera_adicion = true;
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
//Variable para intercambiar el estado de escaneo
var estadoScan = false;
// Se llama cuando se presiona el boton de escanear.
app.ui.onStartScanButton = function()
{
	estadoScan = true;
	app.startScan(app.ui.deviceFound);
	app.ui.displayStatus('Escaneando');
	app.ui.updateTimer = setInterval(app.ui.displayDeviceList, 50);

};

// Se llama cuando se presiona el boton de detener.
app.ui.onStopScanButton = function()
{
	estadoScan = false;
	app.stopScan();
	app.devices = {};
	app.ui.displayStatus('Escaneo Pausado.');
	app.ui.displayDeviceList();
	clearInterval(app.ui.updateTimer);
};
// Se llama  a estas funciones cuando se presiona los boton de escanear Semaforos/Locales
var busca_por = Escanear_por.SEMAFORO;

var ToggleEscanear = function(escaneapor){
	if(busca_por == escaneapor){
		if(estadoScan){
			TTS.speak({
						 text: 'Escaneo Pausado.',
						 locale: 'es-AR',
						 rate: 1.5
				 },
			 function () {
				 //Do Something after success
				 app.ui.onStopScanButton();
			 },
			 function (reason) {
				 //Handle the error case
				 alert('Falló el TTS: '+reason);
			 }
		 );

		}else{
			TTS.speak({
						 text: 'Escaneando ' + escaneapor,
						 locale: 'es-AR',
						 rate: 1.5
				 },
			 function () {
				 //Do Something after success
				 app.ui.onStartScanButton();
			 },
			 function (reason) {
				 //Handle the error case
				 alert('Falló el TTS: '+reason);
			 }
		 );
		}
	}else{
		app.ui.onStopScanButton();
		busca_por = escaneapor;
		TTS.speak({
					 text: 'Escaneando ' + escaneapor,
					 locale: 'es-AR',
					 rate: 1.5
			 },
		 function () {
			 //Do Something after success
			 app.ui.onStartScanButton();
		 },
		 function (reason) {
			 //Handle the error case
			 alert('Falló el TTS: '+reason);
		 }
	 );
	}
}

app.ui.onToggleSemaforoButton = function(){
	 ToggleEscanear(Escanear_por.SEMAFORO);
};

app.ui.onToggleLocalButton = function(){
	 ToggleEscanear(Escanear_por.LOCAL);
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

		/*var tx = device.advertisementData.kCBAdvDataTxPowerLevel;
		var rssi = device.rssi;
		var temp = Math.pow(10, (tx - rssi) / (20)) ;
		device.dist = Math.round(temp);
		var tmp = device.dist;*/

		//Buscamos el dispositivo y almacenamos la funcion en un arreglo
		if(device.name != null){
			getJSON('https://murmuring-tundra-13303.herokuapp.com/beacons/'+device.name+'.json',
			function(err, data) {
			  if (err != null) {
				alert("Something went wrong: " + err + ' | Device: ' + device.name);
			  } else {
				funciones_servidor[device.address] = JSON.parse(data).function_id;
				var id = funciones_servidor[device.address];
				//Si esa funcion nunca se cargo antes, se busca en el server y se carga en otro arreglo
				if(funciones_by_id[id] == null){
					getJSON('https://murmuring-tundra-13303.herokuapp.com/functions/'+id+'.json',
					function(err, data) {
					  if (err != null) {
						alert("Something went wrong: " + err);
					  } else {
						funciones_by_id[id] = JSON.parse(data).nombre;
					  }
					});
				}
			  }
			});
			// Agregar/actualizar el dispositivo .
			app.devices[device.address] = device;
		}
	}
	else if (errorCode)
	{
		app.ui.displayStatus('Scan Error: ' + errorCode);
	}
};

var Agregar_elemento = function(element){
	$('#found-devices').append(element);
	if(primera_adicion){
		primera_adicion = false;
		algoTTS();
	}
}

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
		var semaforo = 'nada';

		if(rssi == 0){
			dist2 = -1;
		}else{
			/*Da valores incorrectos
			var ratio = 1.23;
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
		//Pasamos el ScanRecord a un arreglo
		var binary_string =  window.atob(device.scanRecord);
		var len = binary_string.length;
		var bytes = new Uint8Array( len );
		for (var i = 0; i < len; i++)        {
			bytes[i] = binary_string.charCodeAt(i);
		}
		//Buscamos en el arrelgo el valor del flag y asignamos el estado correspondiente
		if(bytes[52] == 0x31){
			semaforo = 'Rojo';
		}else{
			semaforo = 'Verde';
		}
		//Calculamos el mayor y menos desde el arreglo del scanRecord
		var mayor = ((bytes[25] % 256) * 0x100  ) + (bytes[26] % 256) ;
		var menor = ((bytes[27] % 256) * 0x100  ) + (bytes[28] % 256) ;;
		//Buscamos la funcion del beacon en nuestro arreglo
		var funcion = "Procesando...."; //Valor para leer mientras busca la funcion real
		if( funciones_by_id[funciones_servidor[device.address]] != null){
			funcion = funciones_by_id[funciones_servidor[device.address]];
		}
		//Cargamos todo en el elemento a leer
		var element = $(
			'<li>'
			//+ 'Informacion proporcionada por el servidor: <br>'
			//+ 'Funcion: '
			+ funcion + '.<br>'
			+ '<hr>'
			//Informacion proporcionada por el dispositivo
			//+	'<strong>' + device.name + '</strong><br />'
			// Si es semaforo imprime el estado
			+	(device.name[0]=='s' ? 'Estado: ' + semaforo + '.<br />' : '')
			//+	'RSSI:' + device.rssi + '<br />' 	//Para referencia
			//+	'Tx:' +  tx + '<br / >'				//Idem
			+	'Entre:' +  mayor + '<br / >'
			+	' y :' +  menor + ' .<br / >'
			+	'Distancia: ' + dist + '.'// + ' ('+dist2+' cm aprox.). <br />'
			+ '</li>'
		);

		//Si se buscaba por Semaforo solo se agregan a la lista los semaforos
		if(busca_por == Escanear_por.SEMAFORO){
			if(device.name[0]=='s'){
				Agregar_elemento(element);
			}
		}

		//Idem anterior pero con el resto de los locales
		if(busca_por == Escanear_por.LOCAL){
			if(device.name[0]!='s'){
				Agregar_elemento(element);
			}
		}

	});
};

// Actualizar el tag de estado en el html
app.ui.displayStatus = function(message)
{
	$('#scan-status').html(message);
};

var indiceTTS = 0;
//Lee el valor de los elementos recursivamente
var algoTTS = function(){
	var lis = document.getElementById("found-devices").getElementsByTagName("li");
	if(indiceTTS >= lis.length){
		indiceTTS = 0;
	}
	TTS.speak({
				 text: lis[indiceTTS].textContent,
				 locale: 'es-AR',
				 rate: 1.5
		 },
	 function () {
		 //Do Something after success
		 indiceTTS = indiceTTS + 1;
		 algoTTS();
	 },
	 function (reason) {
		 //Handle the error case
		 alert('Falló el TTS: '+reason);
	 }
 );
};

app.initialize();
