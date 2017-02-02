// JavaScript para escanear dispositivos BLE.

// Application object.
var app2 = {};

//Servidor de los beacons
var APIbeacon = 'https://murmuring-tundra-13303.herokuapp.com/';
// Listado de dispositivos.
app2.devices = {};
//Variables usadas para almacenar las funciones levantadas desde el servidor
var funciones_servidor = {};
var funciones_by_id = {};
var nombres_largos = {};
//Variable utilizada para que solo comienze a leer los beacons al encontrar el primero y no cada uno
var primera_adicion = true;
//Enumerativo para distingir si se escanea solo semaforos o solo locales.
var Escanear_por = {
	SEMAFORO 	: 'semáforos',
	LOCAL			: 'locales'
};

app2.distanciatotal = {} ;

// Timer that updates the device list and removes inactive
// devices in case no devices are found by scan.
updateTimer = null;

//Inicializa la funcion
app2.initialize = function()
{
	document.addEventListener(
		'deviceready',
		function() { evothings.scriptsLoaded(app2.onDeviceReady) },
		false);
};

app2.onDeviceReady = function()
{

};


// Start the scan. Call the callback function when a device is found.
// Format:
//   callbackFun(deviceInfo, errorCode)
//   deviceInfo: address, rssi, name
//   errorCode: String
app2.startScan = function(callbackFun)
{
	primera_adicion = true;
	app2.stopScan();
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
app2.stopScan = function()
{
	evothings.ble.stopScan();
};
//Variable para intercambiar el estado de escaneo
var estadoScan = false;
// Se llama cuando se presiona el boton de escanear.
onStartScanButton = function()
{
	estadoScan = true;
	app2.startScan(deviceFound);
	displayStatus('Escaneando');
	updateTimer = setInterval(displayDeviceList, 50);

};

// Se llama cuando se presiona el boton de detener.
onStopScanButton = function()
{
	estadoScan = false;
	app2.stopScan();
	app2.devices = {};
	displayStatus('Escaneo Pausado.');
	displayDeviceList();
	clearInterval(updateTimer);
};
// Se llama  a estas funciones cuando se presiona los boton de escanear Semaforos/Locales
var busca_por = Escanear_por.SEMAFORO;

var ToggleEscanear = function(escaneapor){
	if(busca_por == escaneapor){
		if(estadoScan){
			onStopScanButton();
			TTS.speak({
						 text: 'Escaneo Pausado.',
						 locale: 'es-AR',
						 rate: 1.5
				 },
			 function () {
				 //Do Something after success
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
				 onStartScanButton();
			 },
			 function (reason) {
				 //Handle the error case
				 alert('Falló el TTS: '+reason);
			 }
		 );
		}
	}else{
		onStopScanButton();
		busca_por = escaneapor;
		TTS.speak({
					 text: 'Escaneando ' + escaneapor,
					 locale: 'es-AR',
					 rate: 1.5
			 },
		 function () {
			 //Do Something after success
			 onStartScanButton();
		 },
		 function (reason) {
			 //Handle the error case
			 alert('Falló el TTS: '+reason);
		 }
	 );
	}
}

onToggleSemaforoButton = function(){
	 ToggleEscanear(Escanear_por.SEMAFORO);
};

onToggleLocalButton = function(){
	 ToggleEscanear(Escanear_por.LOCAL);
};

var funcionId;
// Se llama cuando se encuentra un dispositivo.
deviceFound = function(device, errorCode)
{
	if (device)
	{
		// Se añade la hora para ver que dispositivo es reciente
		device.timeStamp = Date.now();

		//Buscamos el dispositivo y almacenamos la funcion en un arreglo
		if(device.name != null){
			//Primero recuperamos la direccion Mac
			window.MacAddress.getMacAddress(
				function(macAddress) {
					console.log(macAddress);
					//Luego buscamos el beacon en el servidor por su nombre (identificador)
					cordovaHTTP.get(APIbeacon+'beacons/'+device.name+'.json', {
						mac_address: macAddress,		//Enviamos la direccion de mac como parametro del GET
					 }, { }, function(response) {
							console.log(JSON.parse(response.data).nombre_largo);
							//Almacenamos el id de funcion
							funciones_servidor[device.address] = JSON.parse(response.data).function_id;
			 				nombres_largos[device.address] = JSON.parse(response.data).nombre_largo;
			 				var id = funciones_servidor[device.address];
			 				//Si esa funcion nunca se cargo antes, se busca en el server y se carga en otro arreglo
			 				if(funciones_by_id[id] == null){
								cordovaHTTP.get(APIbeacon+'functions/'+id+'.json', {
								 }, { }, function(response) {
										 funciones_by_id[id] = JSON.parse(response.data).nombre;
								 }, function(response) {
										 // prints 403
										 console.log(response.status);
										 //prints Permission denied
										 console.log(response.error);
								 });
							}
					 }, function(response) {
							 // prints 403
							 if(response.status == 404){
								 	nombres_largos[device.address] = "Bicon no registrado";
							 }
							 console.log(response.status);
							 //prints Permission denied
							 console.log(response.error);
					 });
					//alert(macAddress);
				},
				function(fail) {
					alert(fail);
				}
			);
			// Agregar/actualizar el dispositivo .
			app2.devices[device.address] = device;
		}
	}
	else if (errorCode)
	{
		displayStatus('Scan Error: ' + errorCode);
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
displayDeviceList = function()
{
	// Vaciar el listado de dispositivos.
	$('#found-devices').empty();

	var timeNow = Date.now();//Hora actual

	$.each(app2.devices, function(key, device)
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
		for (var i = 0; i < len; i++){
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
		var menor = ((bytes[27] % 256) * 0x100  ) + (bytes[28] % 256) ;
		//Buscamos la funcion del beacon en nuestro arreglo
		var funcion = "Procesando...."; //Valor para leer mientras busca la funcion real
		if( funciones_by_id[funciones_servidor[device.address]] != null){
			funcion = funciones_by_id[funciones_servidor[device.address]];
		}
		//Buscamos el nombre largo del beacon
		var nlargo = 'Esperando nombre';
		if(nombres_largos[device.address] != null){
			nlargo = nombres_largos[device.address];
		}
		//Cargamos todo en el elemento a leer
		var element = $(
			'<li>'
			//+ 'Informacion proporcionada por el servidor: <br>'

			+ '<hr>'
			//Informacion proporcionada por el dispositivo
			//+	'<strong>' + device.name + '</strong><br />'
			// Si es semaforo imprime el estado
			+	(device.name[0]=='s' ? 'Semáforo: ' + semaforo + '.<br />' : funcion + '.<br>' + nlargo + '.<br />')
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
displayStatus = function(message)
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
	if(lis[indiceTTS] != null){
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
 }
};

app2.initialize();
