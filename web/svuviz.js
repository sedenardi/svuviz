var data = [];

var margin = 20;

var initData = function(){
  for (var i = 0; i < 300; i++) {
    var v = Math.floor(Math.random() * (600 - 300) + 300);
    data.push({
      name: 'name',
      value: v
    });
  }
};

$(document).ready(function(){
  width = $(window).width() - 2*margin;
  height = $(window).height() - 2*margin - 4;
  initData();

  colors = d3.scale.category20();

  var x = d3.scale.ordinal()
    .rangeBands([0, width], .4);

  var y = d3.scale.linear()
    .range([height, 0]);

  var chart = d3.select('.chart')
    .attr('width', width)
    .attr('height', height)
    .append('g');
    //.attr('transform', 'translate(' + margin + ',' + margin + ')');

  x.domain(data.map(function(d,i) { return i; }));
  y.domain([0, d3.max(data, function(d) { return d.value; })]);

  chart.selectAll(".bar")
      .data(data)
    .enter().append("rect")
      .attr("class", "bar")
      .style("fill", function(d,i) { return colors(i); })
      .attr("x", function(d,i) { return x(i); })
      .attr("y", function(d) { return y(d.value); })
      .attr("height", function(d) { return height - y(d.value); })
      .attr("width", x.rangeBand());
});