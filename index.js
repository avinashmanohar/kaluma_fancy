var SSD1306 = require("@niklauslee/ssd1306-i2c").SSD1306;
var I2C = require("i2c").I2C;
var font = require("@niklauslee/font-lee-sans");
// var font = require("@niklauslee/font-leros");
var Button = require("button").Button;
var GPIO = require('gpio').GPIO;

var ssd1306 = new SSD1306();
var i2c0 = new I2C(0);

var buttonStartSeqOnce = new Button(16, { mode: INPUT_PULLDOWN });
var buttonStartSeqInLoop = new Button(17, { mode: INPUT_PULLDOWN });
var buttonStopAllSeqExec = new Button(18, { mode: INPUT_PULLDOWN });
var buttonSelectRelayIndex = new Button(19, { mode: INPUT_PULLDOWN });
var buttonIncreaseVal = new Button(20, { mode: INPUT_PULLDOWN });
var buttonDecreaseVal = new Button(21, { mode: INPUT_PULLDOWN });

var gpioRelayA = new GPIO(26, OUTPUT);
var gpioRelayB = new GPIO(27, OUTPUT);

// Call this ASAP
makeRelayOutputHigh();

var timeoutVar1;
var timeoutVar2;
var timeoutVar3;
var timeoutVar4;
var timeoutVar5;
var intervalVar1;
var displayTimeoutVar;

var displayOn;

var index = 0;
var incDecBy = 50;
// Default values in Miliseconds.
var relayASeqT1 = 2000;
var relayASeqT2 = 600;
var relayASeqT3 = 900;
var relayBSeqT1 = 1000;
var loopPause = 3000;

var displayAutoOff_ms = 30000;
// Default values in Miliseconds.

var oledContext;

var options = {
  width: 128,
  height: 64,
};
ssd1306.setup(i2c0, options, () => {
  oledContext = ssd1306.getContext();
  showSplashOnDisplay();
  delay(5000);
  showTextOnDisplay();
});



buttonStartSeqOnce.on("click", function () {
  startSequence();
});

buttonStartSeqInLoop.on("click", function () {
  startSequenceInLoop();
});

buttonStopAllSeqExec.on("click", function () {
  stopAllSeqExec();
});

buttonSelectRelayIndex.on("click", function () {
  if (displayOn) {
    if (index < 4) {
      index++;
    } else {
      index = 0;
    }
  }
  showTextOnDisplay();
});
buttonDecreaseVal.on("click", function () {
  if (displayOn) {
    switch (index) {
      case 0:
        if (relayASeqT1 > 50) { relayASeqT1 -= incDecBy; } else { relayASeqT1 = 50; }
        break;
      case 1:
        if (relayASeqT2 > 50) { relayASeqT2 -= incDecBy } else { relayASeqT2 = 50; }
        break;
      case 2:
        if (relayASeqT3 > 50) { relayASeqT3 -= incDecBy; } else { relayASeqT3 = 50; }
        break;
      case 3:
        if (relayBSeqT1 > 50) { relayBSeqT1 -= incDecBy; } else { relayBSeqT1 = 50; }
        break;
      case 4:
        if (loopPause > 50) { loopPause -= incDecBy; } else { loopPause = 50; }
        break;
    }
  }
  showTextOnDisplay();
});
buttonIncreaseVal.on("click", function () {
  if (displayOn) {
    switch (index) {
      case 0:
        relayASeqT1 += incDecBy;
        break;
      case 1:
        relayASeqT2 += incDecBy;
        break;
      case 2:
        relayASeqT3 += incDecBy;
        break;
      case 3:
        relayBSeqT1 += incDecBy;
        break;
      case 4:
        loopPause += incDecBy;
        break;
    }
  }
  showTextOnDisplay();
});


function showTextOnDisplay() {
  showDisplay();
  var text = index === 0 ? "*" : " "; text += "Relay A - ON " + (relayASeqT1 / 1000).toFixed(2) + "s\n";
  text += index === 1 ? "*" : " "; text += "Relay A - OFF " + (relayASeqT2 / 1000).toFixed(2) + "s\n";
  text += index === 2 ? "*" : " "; text += "Relay A - ON " + (relayASeqT3 / 1000).toFixed(2) + "s\n";
  text += index === 3 ? "*" : " "; text += "Relay B - ON " + (relayBSeqT1 / 1000).toFixed(2) + "s\n\n";
  text += index === 4 ? "*" : " "; text += "PAUSE " + (loopPause / 1000).toFixed(2) + "s";

  displayText(text);
  displayAutoOff();
}

function showSplashOnDisplay() {
  var text = "      Powered by\n  AVINASH MANOHAR\n\n    +91-9738348208"
  displayText(text);
}

function stopAllSeqExec() {
  clearAllTimeouts();
  clearLoopInterval();
  makeRelayOutputHigh()
}

function startSequenceInLoop() {
  clearLoopInterval();
  startSequence();
  intervalVar1 = setInterval(() => {
    startSequence();
  }, relayASeqT1 + relayASeqT2 + relayASeqT3 + relayBSeqT1 + loopPause);
}

function startSequence() {
  clearAllTimeouts();
  timeoutVar1 = setTimeout(function () {
    gpioRelayA.write(LOW);
  }, 0);
  timeoutVar2 = setTimeout(function () {
    gpioRelayA.write(HIGH);
  }, relayASeqT1);
  timeoutVar3 = setTimeout(function () {
    gpioRelayA.write(LOW);
  }, relayASeqT1 + relayASeqT2);
  timeoutVar4 = setTimeout(function () {
    gpioRelayA.write(HIGH);
    gpioRelayB.write(LOW);
  }, relayASeqT1 + relayASeqT2 + relayASeqT3);
  timeoutVar5 = setTimeout(function () {
    gpioRelayB.write(HIGH);
  }, relayASeqT1 + relayASeqT2 + relayASeqT3 + relayBSeqT1);
}

function makeRelayOutputHigh() {
  // This is to turn off the relay initially
  gpioRelayA.write(HIGH);
  gpioRelayB.write(HIGH);
}

function showDisplay() {
  displayOn = true;
  ssd1306.on();
}

function displayAutoOff() {
  if (displayTimeoutVar) clearTimeout(displayTimeoutVar);
  displayTimeoutVar = setTimeout(function () {
    displayOn = false;
    ssd1306.off();
  }, displayAutoOff_ms);
}

// Display start
function displayText(text) {
  oledContext.clearScreen();
  oledContext.setFontColor(1);
  oledContext.setFont(font);
  oledContext.drawText(
    0,
    0,
    text
  );
  oledContext.display();
}
// Display ends

function clearAllTimeouts() {
  if (timeoutVar1) clearTimeout(timeoutVar1);
  if (timeoutVar2) clearTimeout(timeoutVar2);
  if (timeoutVar3) clearTimeout(timeoutVar3);
  if (timeoutVar4) clearTimeout(timeoutVar4);
  if (timeoutVar5) clearTimeout(timeoutVar5);
}

function clearLoopInterval() {
  if (intervalVar1) clearInterval(intervalVar1);
}