/*
Serial handshaking and multi-value strings
using p5.webserial.

Sends an 'x' out the serial port on port opening,
then waits for serial to come in. Expects
a CSV string. Separates it into three parts, 
then sends an 'x' to request another string
from the sender.

created 31 May 2022
modified 11 Jun 2022
by Tom Igoe
*/
// variable to hold an instance of the p5.webserial library:
const serial = new p5.WebSerial();

// HTML button object:
let portButton;
let inData; // for incoming serial data
let outData; // for outgoing data
// variables for the circle to be drawn:
let locH, locV;
let circleColor = 255;

function setup() {
  createCanvas(400, 300); // make the canvas
  // check to see if serial is available:
  if (!navigator.serial) {
    alert("WebSerial is not supported in this browser. Try Chrome or MS Edge.");
  }
  // if serial is available, add connect/disconnect listeners:
  navigator.serial.addEventListener("connect", portConnect);
  navigator.serial.addEventListener("disconnect", portDisconnect);
  // check for any ports that are available:
  serial.getPorts();
  // if there's no port chosen, choose one:
  serial.on("noport", makePortButton);
  // open whatever port is available:
  serial.on("portavailable", openPort);
  // handle serial errors:
  serial.on("requesterror", portError);
  // handle any incoming serial data:
  serial.on("data", serialEvent);
  serial.on("close", makePortButton);
}

function draw() {
  background(0); // black background
  fill(circleColor); // fill depends on the button
  ellipse(locH, locV, 50, 50); // draw the circle
}

// if there's no port selected,
// make a port select button appear:
function makePortButton() {
  // create and position a port chooser button:
  portButton = createButton("choose port");
  portButton.position(10, 10);
  // give the port button a mousepressed handler:
  portButton.mousePressed(choosePort);
}

// make the port selector window appear:
function choosePort() {
  serial.requestPort();
}

// open the selected port, and make the port
// button invisible:
function openPort() {
  // wait for the serial.open promise to return,
  // then call the initiateSerial function
  serial.open().then(initiateSerial);

  // once the port opens, let the user know:
  function initiateSerial() {
    console.log("port open");
    serial.print("x");
  }
  // hide the port button once a port is chosen:
  if (portButton) portButton.hide();
}

function serialEvent() {
  // read a string from the serial port
  // until you get carriage return and newline:
  var inString = serial.readStringUntil("\r\n");
  //check to see that there's actually a string there:
  if (inString) {
    if (inString !== "hello") {
      // if you get hello, ignore it
      // split the string on the commas:
      var sensors = split(inString, ",");
      if (sensors.length > 2) {
        // if there are three elements
        // element 0 is the locH:
        locH = map(sensors[0], 0, 1023, 0, width);
        // element 1 is the locV:
        locV = map(sensors[1], 0, 1023, 0, height);
        // element 2 is the button:
        circleColor = 255 - sensors[2] * 255;
        // send a byte back to prompt for more data:
        serial.print("x");
      }
    }
  }
}

// pop up an alert if there's a port error:
function portError(err) {
  alert("Serial port error: " + err);
}

// try to connect if a new serial port
// gets added (i.e. plugged in via USB):
function portConnect() {
  console.log("port connected");
  serial.getPorts();
}

// if a port is disconnected:
function portDisconnect() {
  serial.close();
  console.log("port disconnected");
}
