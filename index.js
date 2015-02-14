var fs = require('fs')
var serialport = require('serialport')

var listeners = {}
var log = fs.createWriteStream('./log.json', {flags: 'a'})

fs.watchFile('/dev/', addDevices)

addDevices()

function addDevices (event) {
  console.log('addDevices')
  serialport.list(function (err, devices) {
    if (err) {
      console.log(err)
      return
    }

    devices.forEach(function (device) {
      if (device.comName.indexOf('/dev/cu.usbmodem') === 0) {
        if (!listeners[device.comName]) {
          listeners[device.comName] = listenTo(device.comName)
        }
      }
    })

  })
}


function listenTo (port) {
  console.log('adding ', port)
  var sp = new serialport.SerialPort(port, {
    parser: serialport.parsers.readline('\n')
  })
  sp.open(function (error) {
    if (error) {
      console.log(error)
      return
    }
    sp.on('error', handleClose)
    sp.on('close', handleClose)
    sp.on('data', function (chunk) {
      var data = JSON.parse(chunk)
      data.when = Date.now()
      data.port = port
      log.write(JSON.stringify(data))
      log.write('\n')
      console.log(data)
    })
  })

  function handleClose (error) {
    console.log('dropping ', port)
    if (error) {
      console.log(error)
    }
    listeners[port] = null
  }

  return sp
}