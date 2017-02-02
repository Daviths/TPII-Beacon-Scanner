/*Servidor y requests posibles*/
var API= "https://serverblindapp.herokuapp.com/";
// API+user/create => envío por GET la mac del usuario y lo crea
// API+smart_point/create => envío por GET los datos del beacon y la mac del usuario
var state="disconnected";
//var mensaje=document.getElementById("message");
var app = {
    macAddress: "20:15:04:17:73:66",  // get your mac address from bluetoothSerial.list
    chars: "",

/*
    Application constructor
 */
    initialize: function() {
        this.bindEvents();
        console.log("Starting SimpleSerial app");
    },
/*
    bind any events that are required on startup to listeners:
*/
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
        //window.onclick = app.manageConnection;

      },



/*
    this runs when the device is ready for user interaction:
*/
    onDeviceReady: function() {
        //mensaje.innerHTML="Desconectado";
        console.log("usuario registrado ? "+localStorage.usuarioRegistrado);
       // if(localStorage.usuarioRegistrado==false){ //Si no está registrado en el servidor, o así lo dice el LocalStorage
         cordovaHTTP.get(API+"user/create", {  //Envía por GET su macAddress, si no esta registrado lo hace sino no pasa nada
              macaddress: app.macAddress
          }, { }, function(response) {
              // prints 200
              localStorage.usuarioRegistrado=true;
              console.log(response.status);
              console.log(JSON.stringify(response));
          }, function(response) {
              // prints 403
              console.log(response.status);

              //prints Permission denied
              console.log(response.error);
          });
       // }
      /* cordovaHTTP.get(API+"smart_point/create", {  //Envía por GET su macAddress, si no esta registrado lo hace sino no pasa nada
              macaddress: app.macAddress
          }, { }, function(response) {
              // prints 200
              localStorage.usuarioRegistrado=true;
              console.log(response.status);
              console.log(JSON.stringify(response));
          }, function(response) {
              // prints 403
              console.log(response.status);

              //prints Permission denied
              console.log(response.error);
          });*/
       // }
      /* cordovaHTTP.get(API+"smart_point/create/", {
              macaddress: '000:000:000:000', //macaddress del smartpoint
              name: "value",
              lat: "2342342",
              long: "4444444",
              user_mac: app.macAddress,

          }, { }, function(response) {
              // prints 200
              console.log("smart point "+ JSON.stringify(response));
              console.log("status smart point "+response.status);
          }, function(response) {
              // prints 403
              console.log("error "+JSON.stringify(response));

              //prints Permission denied
          });*/
    /* bluetoothSerial.connect(
                    app.macAddress,  // device to connect to
                    app.openPort,    // start listening if you succeed
                    app.showError    // show the error if you fail
                );*/
    },

/*
    Connects if not connected, and disconnects if connected:
*/

manageConnection: function() {

        // connect() will get called only if isConnected() (below)
        // returns failure. In other words, if not connected, then connect:
         var connect= function() {
              TTS.speak({
                   text: "Conectando",
                   locale: 'es-AR',
                   rate: 1.5
               }, function () {
                   // Do Something after success
               }, function (reason) {
                   // Handle the error case
               });

              bluetoothSerial.connect(
                    app.macAddress,  // device to connect to
                    app.openPort,    // start listening if you succeed
                    app.showError    // show the error if you fail
                );
        };

        // disconnect() will get called only if isConnected() (below)
        // returns success  In other words, if  connected, then disconnect:
         var disconnect= function() {
          TTS.speak({
           text: "Desconectando",
           locale: 'es-AR',
           rate: 1.5
       }, function () {
           // Do Something after success
       }, function (reason) {
           // Handle the error case
       });
             bluetoothSerial.disconnect(
                app.closePort,     // stop listening to the port
                app.showError      // show the error if you fail
             );
        };

        //here's the real action of the manageConnection function:
        bluetoothSerial.isConnected(disconnect, connect);
    },

/*
    subscribes to a Bluetooth serial listener for newline
    and changes the button:
*/
     openPort: function() {
      state="connected";
      //mensaje.innerHTML="Conectado";
      //mensaje.innerHTML="Conectado";
         TTS.speak({
           text: "Conectado",
           locale: 'es-AR',
           rate: 1.5
       }, function () {
           // Do Something after success
       }, function (reason) {
           // Handle the error case
       });
      bluetoothSerial.subscribe('\n', function (data) {
             TTS.speak({
                   text: data,
                   locale: 'es-AR',
                   rate: 1.5
               }, function () {
                   // Do Something after success
               }, function (reason) {
                   // Handle the error case
               });
            });
    },
/*
    unsubscribes from any Bluetooth serial listener and changes the button:
*/
      closePort: function() {
        // if you get a good Bluetooth serial connection:
        //mensaje.innerHTML="Desconectado";
         TTS.speak({
           text: "Desconectado",
           locale: 'es-AR',
           rate: 1.5
       }, function () {
           // Do Something after success
       }, function (reason) {
           // Handle the error case
       });
         state="disconnected";
         //mensaje.innerHTML="Desconectado";
        // unsubscribe from listening:
        bluetoothSerial.unsubscribe(
                function (data) {
                },
                app.showError
        );
    },
/*
    appends @error to the message div:
*/
    ConnectionFail: function(error) {
              TTS.speak({
                   text: "Reintentando",
                   locale: 'es-AR',
                   rate: 1.5
               }, function () {
                   // Do Something after success
               }, function (reason) {
                   // Handle the error case
               });
              bluetoothSerial.connect(
                    app.macAddress,  // device to connect to
                    app.openPort,    // start listening if you succeed
                    app.ConnectionFail    // show the error if you fail
                );
    },
    showError:function(error){},
};      // end of app

            app.initialize();
