var d3 = require('d3')
var moment = require('moment')

var data = []

var margin = {top: 20, right: 20, bottom: 30, left: 50},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var x = d3.time.scale()
    .range([0, width]);

var y = d3.scale.linear()
    .range([height, 0]);

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom");

var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left");

var line = d3.svg.line()
  .interpolate('basis')
  .x(function(d) {
    return x(getX(d))
  })
  .y(function(d) {
    return y(getY(d));
  });

var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

d3.text("/data/history/minute", function(err, rawData) {
  if (err) {
    return console.log(err)
  }
  var lines = rawData.split('\n')
  for (var i = 0, len = lines.length; i < len; ++i) {
    var input
    try {
      input = JSON.parse(lines[i])
    } catch (e) {
      continue
    }
    input.when = moment(input.when, 'x')
    data.push(input)
  }

  render()
});

function render () {
  console.log('rendering')
  x.domain(d3.extent(data, getX));
  y.domain(d3.extent(data, getY));

  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
    .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Temp (C)");

  svg.append("path")
      .datum(data)
      .attr("class", "line")
      .attr("d", line);
}

function update() {
  d3.selectAll('path')
    .data(data)
    .enter()
    .transition()
    .append('path')
    .attr('d', line)
}

function getX (data) {
  return data.when
}

function getY (data) {
  return data.temperature
}

var sse = new EventSource('/data/stream')

sse.addEventListener('message', function (e) {
  var reading = JSON.parse(e.data)
  reading.when = moment(reading.when, 'x')
  data.push(reading)
  //update()
})

