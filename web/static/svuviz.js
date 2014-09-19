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
  height = $(window).height() - 2*margin - 4 - $('#main').offset().top;
  episodeHeight = Math.floor(height / 8);

  xScale = d3.scale.ordinal()
    .domain(d3.range(dataset.length))
    .rangeBands([0, width], 0.1);

  yScale = d3.scale.linear()
    .domain([0, d3.max(dataset, function(d) {
      return d.Appearances.length;
    })])
    .range([episodeHeight, height]);

  yHeight = (height - episodeHeight) / 
    d3.max(dataset, function(d) {
      return d.Appearances.length;
    });

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

  var epGroups = svg.append('g')
    .selectAll('g')
    .data(dataset)
    .enter()
    .append('g');
    /*.attr('data-titleid', function(d) { return d.TitleID; })
    .attr('data-season', function(d) { return d.Season; })
    .attr('data-number', function(d) { return d.Number; })
    .attr('data-title', function(d) { return d.Title; })
    .attr('data-synopsis', function(d) { return d.Synopsis; })
    .attr('data-airaate', function(d) { return d.AirDate; });*/

  // NEED IN OWN GROUP (for )
  var episodes = epGroups.append('rect')
    .classed('episode', true)
    .attr('x', function(d, i) { return xScale(i); })
    .attr('y', (height - episodeHeight))
    .attr('height', episodeHeight)
    .attr('width', xScale.rangeBand())
    .style('fill', function(d) { return colors(d.Season); })
    .on('mouseenter', function(d) {
      d3.select(this).style('fill', 'rgb(255, 0, 0)');

      var xPosition = parseFloat(d3.select(this).attr("x")) + 25;
      if (xPosition > (width - (200 - 20))) xPosition -= (200 + 50);
      var yPosition = height - episodeHeight - 200;
      //Update the tooltip position and value
      var tooltip = d3.select("#episodeTooltip")
        .style("left", xPosition + "px")
        .style("top", yPosition + "px");
      tooltip.select("#title").text(d.Title);
      tooltip.select("#season").text(d.Season);
      tooltip.select("#number").text(d.Number);
      tooltip.select("#synopsis").text(d.Synopsis);
      tooltip.select("#airdate").text(moment(d.AirDate).format("MMMM Do, YYYY"));
      //Show the tooltip
      tooltip.classed("hidden", false);
    })
    .on('mouseleave', function(d) {
      d3.select(this).style('fill', colors(d.Season));
      d3.select("#episodeTooltip").classed("hidden", true);
    });

  var appGroups = svg.append('g')
    .selectAll('g')
    .data(dataset)
    .enter()
    .append('g');

  var rects = appGroups.selectAll('rect')
    .data(function(d) { return d.Appearances; })
    .enter()
    .append('rect')
    .classed('appearance', true)
    .attr('x', function(d) { return xScale(d.x); })
    .attr('y', function(d,i) { return height - yScale(i + 1); })
    .attr('height', function(d) { return yHeight; })
    .attr('width', xScale.rangeBand())
    .style('fill', function(d) {
      var s = Math.floor(colorScale(d.Commonalities));
      return 'rgb(0, 0, ' + s + ')';
    })
    .attr('data-actorid', function(d) { return d.ActorID; })
    .attr('data-character', function(d) { return d.Character; })
    .attr('data-characterid', function(d) { return d.CharacterID; })
    .attr('data-commonalities', function(d) { return d.Commonalities; })
    .on('mouseenter', function(d) {
      d3.selectAll('rect[data-actorid="' + d.ActorID + '"]')
        .style('fill', 'rgb(255, 0, 0)');

      var xPosition = parseFloat(d3.select(this).attr("x")) + 25;
      if (xPosition > (width - (200 - 25))) xPosition -= (200 + 50);
      var yPosition = height - 100;
      //Update the tooltip position and value
      var tooltip = d3.select("#appearanceTooltip")
        .style("left", xPosition + "px")
        .style("top", yPosition + "px");
      tooltip.select("#name").text(d.ActorName);
      tooltip.select("#character").text(d.Character);
      var appearances = d3.selectAll('rect[data-actorid="' + d.ActorID + '"]')[0].length;
      tooltip.select("#appearances").text(appearances);
      tooltip.select("#commonalities").text(d.Commonalities);
      //Show the tooltip
      tooltip.classed("hidden", false);
    })
    .on('mouseleave', function(d) {
      d3.selectAll('rect[data-actorid="' + d.ActorID + '"]')
        .style('fill', 'rgb(0, 0, ' + Math.floor(colorScale(d.Commonalities)) + ')');
      d3.select("#appearanceTooltip").classed("hidden", true);
    })
    .on('click', function(d) {
      
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