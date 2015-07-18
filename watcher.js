var fs = require('fs')
var http = require('http')
var tail = require('file-tail')
var SseChannel = require('sse-channel')
var through = require('through')
var split = require('split')

var tempChannel = new SseChannel({
  retryTimeout: 250,
  historySize: 300,
  pingInterval: 15000,
  cors: {
    origins: ['*']
  }
})

var multiplier = 1000*60

var server = http.createServer(function requestHandler (req, res) {
  switch (req.url) {
    case '/':
      fs.createReadStream('./static/index.html').pipe(res)
      break
    case '/js/bundle.js':
      fs.createReadStream('./js/bundle.js').pipe(res)
      break
    case '/data/history':
      fs.createReadStream('./log.json').pipe(res)
      break
    case '/data/history/minute':
      var minute = 0
      var total = 0
      var points = 0

      fs.createReadStream('./log.json')
        .pipe(split())
        .pipe(through(function (line) {
          var data
          try {
            data = JSON.parse(line)
          } catch (e) {
            return console.log(e)
          }

          var currentMinute = Math.floor(data.when/multiplier)
          if (minute && currentMinute > minute) {
            var payload = JSON.stringify({
              when: minute*multiplier,
              temperature: total/points
            })
            this.queue(payload + '\n')
            total = points = 0
          }
          minute = currentMinute
          total += data.temperature
          points++
        }))
        .pipe(res)
      break
    case '/data/stream':
      tempChannel.addClient(req, res)
      break
    default:
      res.writeHead(404)
      res.end()
  }
})

server.listen(3000, function () {
  console.log('http://localhost:3000/')
})


var ft = tail.startTailing('./log.json')

ft.on('line', function (line) {
  // tempChannel.send(line)
})

