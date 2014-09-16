$(document).ready(function(){
  $.ajax({
    url: 'showInfo.json',
    cache: true,
    success: function(data) {
      svuObj = data;
      initGraph();
    }
  });  
});

var initGraph = function() {
  dataset = prepareDataset(svuObj);
  /*var stack = d3.layout.stack();
  stack(dataset);*/

  margin = 20;
  width = $(window).width() - 2*margin;
  height = $(window).height() - 2*margin - 4;

  var xScale = d3.scale.ordinal()
    .domain(d3.range(dataset.length))
    .rangeBands([0, width], 0.2);

  var yScale = d3.scale.linear()
    .domain([0, d3.max(dataset, function(d) {
      return d.Appearances.length;
    })])
    .range([0, height]);

  var colorScale = d3.scale.log()
    .domain([1, d3.max(dataset, function(d) {
      return d.Appearances[0].Commonalities;
    })])
    .range([1, 255]);
  
  var colors = d3.scale.category20();

  var svg = d3.select('#main')
    .append('svg')
    .attr('width', width)
    .attr('height', height);

  var groups = svg.selectAll('g')
    .data(dataset)
    .enter()
    .append('g')
    .attr({
      TitleID: function(d) { return d.TitleID; },
      Season: function(d) { return d.Season; },
      Number: function(d) { return d.Number; },
      Title: function(d) { return d.Title; },
      Synopsis: function(d) { return d.Synopsis; },
      AirDate: function(d) { return d.AirDate; }
    });

  var rects = groups.selectAll('rect')
    .data(function(d) { return d.Appearances; })
    .enter()
    .append('rect')
    .attr('x', function(d) { return xScale(d.x); })
    .attr('y', function(d,i) { return height - yScale(i + 1); })
    .attr('height', function(d) { return yScale(1); })
    .attr('width', xScale.rangeBand())
    .style("fill", function(d) {
      var s = Math.floor(colorScale(d.Commonalities));
      return 'rgb(0, 0, ' + s + ')';
    })
    .attr({
      actorID: function(d) { return d.ActorID; },
      Character: function(d) { return d.Character; },
      CharacterID: function(d) { return d.CharacterID; },
      Commonalities: function(d) { return d.Commonalities; },
      Y: function(d) { return d.y; }
    })
    .on('mouseenter', function(d) {
      d3.selectAll('rect[ActorID="' + d.ActorID + '"]')
        .style('fill', 'rgb(255, 0, 0)');
    })
    .on('mouseleave', function(d) {
      d3.selectAll('rect[ActorID="' + d.ActorID + '"]')
        .style('fill', 'rgb(0, 0, ' + Math.floor(colorScale(d.Commonalities)) + ')');
    });
};

var prepareDataset = function(obj) {
  var dataset = [];
  var i = 0;
  for (var title in obj.titles) {
    for (var j = 0; j < obj.titles[title].Appearances.length; j++) {
      obj.titles[title].Appearances[j].x = i;
    }
    dataset.push(obj.titles[title]);
    i++;
  }
  return dataset;
};