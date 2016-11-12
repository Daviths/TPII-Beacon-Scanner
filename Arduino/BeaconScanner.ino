#include <SoftwareSerial.h>

SoftwareSerial mySerial(7, 8); // RX, TX
// Connect HM10      Arduino Uno
//   Pin 1/TXD        Pin 7
//   Pin 2/RXD        Pin 8

int contador, estado;
const int SEG = 1000;
const int S_VERDE = 2;
const int S_ROJO = 5;

void setup() {
  Serial.begin(9600);
  // If the baudrate od the HM-10 module has been updated you may need to change 9600 by another value
  // Once you have found the correct baudrate you can update it using AT+BAUDx command (AT+BAUD0 for 9600 bauds)
  mySerial.begin(9600);
  contador = 0;
  estado = 0;
}

void loop() {
  char c;
  if (Serial.available()) {
    c = Serial.read();
    mySerial.print(c);
  }
  if (mySerial.available()) {
    c = mySerial.read();
    Serial.print(c);  
  }
  if(contador == 0){
    if(estado == 1){
      //mySerial.print("AT+FLAG0");
      estado = 0;
      contador = SEG * S_VERDE;
    }else{
      //mySerial.print("AT+FLAG1");
      estado = 1;
      contador = SEG * S_ROJO;
    }    
    //contador = SEG * 1;
  }else{
    contador--;
  }
  delay(1);
}
