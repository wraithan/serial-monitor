var serialport = require('serialport');

var listeners = [];

function listenTo (port) {
  var sp = new serialport.SerialPort(port, {
    parser: serialport.parsers.readline('\n')
  });
  sp.open(function () {
    sp.on('data', function (data) {
      console.log(port + ': ' + data);
    });
  });
  return sp;
}

serialport.list(function (err, devices) {
  devices.forEach(function (device) {
    if (device.comName.indexOf('/dev/cu.usbmodem') === 0) {
      listeners.push(listenTo(device.comName));
    }
  });
});