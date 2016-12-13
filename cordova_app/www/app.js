// JavaScript code for the BLE Scan example app.

// Application object.
var app = {};

// Device list.
app.devices = {};

app.veces = {};
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

// Stop scanning for devices.
app.stopScan = function()
{
	evothings.ble.stopScan();
};

// Called when Start Scan button is selected.
app.ui.onStartScanButton = function()
{
	app.startScan(app.ui.deviceFound);
	app.ui.displayStatus('Escaneando');
	app.ui.updateTimer = setInterval(app.ui.displayDeviceList, 50);
};

// Called when Stop Scan button is selected.
app.ui.onStopScanButton = function()
{
	app.stopScan();
	app.devices = {};
	app.ui.displayStatus('Escaneo Pausado.');
	app.ui.displayDeviceList();
	clearInterval(app.ui.updateTimer);
};

// Called when a device is found.
app.ui.deviceFound = function(device, errorCode)
{
	if (device)
	{
		// Set timestamp for device (this is used to remove
		// inactive devices).
		device.timeStamp = Date.now();
		
		var tx = device.advertisementData.kCBAdvDataTxPowerLevel;
		var rssi = device.rssi;
		var temp = Math.pow(10, (tx - rssi) / (20)) ;
		device.dist = Math.round(temp);
		
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
			device.arreglo = [11];
		}
		
		var v = app.veces[device.address];
		//device.arreglo[v] = device.dist; //Por alguna razon esta linea hace que deje de Actualizar las distancias, quedan la primera fija, acá y en la otra funcion que la calcula 		

		app.devices[device.address] = device;
		// Insert the device into table of found devices.
		
	}
	else if (errorCode)
	{
		app.ui.displayStatus('Scan Error: ' + errorCode);
	}
};

// Display the device list.
app.ui.displayDeviceList = function()
{
	// Clear device list.
	$('#found-devices').empty();

	var timeNow = Date.now();

	$.each(app.devices, function(key, device)
	{

			// Map the RSSI value to a width in percent for the indicator.
			var rssiWidth = 100; // Used when RSSI is zero or greater.
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
			var promedio = 0;
			/*if(app.veces[device.address] <= 0){
				promedio = device.dist;
			}else{
				promedio = Math.round(app.distanciatotal[device.address] / app.veces[device.address]);
			}*/
			var element = $(
				'<li>'
				+	'<strong>' + device.name + '</strong><br />'
				// Do not show address on iOS since it can be confused
				// with an iBeacon UUID.
				+	(device.name[0]=='s' ? semaforo + '<br />' : '')
				+	'RSSI:' + device.rssi + '<br />'
				+	'Tx:' +  tx + '<br / >'
				+	'Mayor:' +  mayor + '<br / >'
				+	'Menor:' +  menor + '<br / >'
				+	'Veces:' +  app.veces[device.address] + '<br / >'
				+	'Distancia: ' + dist + ' ('+dist2+' cm). <br />'
				+	'Distancia del device: ' + device.dist + ' cm. '+' Promedio:'+ promedio +' <br />'
				//+ 	'Arrglo: ' + device.arreglo[0] + '<br />'
				+ '</li>'
			);

			$('#found-devices').append(element);
	});
};

// Display a status message
app.ui.displayStatus = function(message)
{
	$('#scan-status').html(message);
};



app.initialize();
