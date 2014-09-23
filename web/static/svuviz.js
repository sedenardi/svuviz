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
    .classed('clickable', true)
    .on('mouseenter', function(d) {
      if (d3.select(this).classed('clickable')) {
        var actor = d3.selectAll('rect[data-actorid="' + d.ActorID + '"]');
        if (!d3.select('#actor1').classed('active')) {
          actor.classed('hover1', true);
        } else if (!d3.select('#actor2').classed('active')) {
          actor.classed('hover2', true);
        }

        var xPosition = parseFloat(d3.select(this).attr("x")) + 25;
        if (xPosition > (width - (200 - 25))) xPosition -= (200 + 50);
        var yPosition = height - 100;
        //Update the tooltip position and value
        var tooltip = d3.select('#appearanceTooltip')
          .style('left', xPosition + 'px')
          .style('top', yPosition + 'px');
        tooltip.select('#name').text(d.ActorName);
        tooltip.select('#character').text(d.Character);
        var appearances = d3.selectAll('rect[data-actorid="' + d.ActorID + '"]')[0].length;
        tooltip.select('#appearances').text(appearances);
        tooltip.select('#commonalities').text(d.Commonalities);
        //Show the tooltip
        tooltip.classed('hidden', false);
      }
    })
    .on('mouseleave', function(d) {
      var actor = d3.selectAll('rect[data-actorid="' + d.ActorID + '"]');
      actor.classed('hover1', false)
        .classed('hover2', false);
        /*.style('fill', 'rgb(0, 0, ' + Math.floor(colorScale(d.Commonalities)) + ')');*/
      d3.select('#appearanceTooltip').classed('hidden', true);
    })
    .on('click', function(d) {
      if (d3.select(this).classed('clickable')) {
        var actor = d3.selectAll('rect[data-actorid="' + d.ActorID + '"]');
        if (!d3.select('#actor1').classed('active')) {
          d3.select('#actor1')
            .attr('data-actorid', d.ActorID)
            .classed('active', true);
          d3.select('#actor1 .actorName').text(d.ActorName);
          actor.classed('active1', true);
        } else if (!d3.select('#actor2').classed('active')) {
          d3.select('#actor2')
            .attr('data-actorid', d.ActorID)
            .classed('active', true);
          d3.select('#actor2 .actorName').text(d.ActorName);
          actor.classed('active2', true);
        }
        setCommonalities();
      }
    });

  d3.selectAll('.actorClose')
    .on('click', function(d) {
      var parent = d3.select(this)[0][0].parentNode;
      parent.className = parent.className.replace(' active', '')
        .replace('active ', '').replace('active', '');
      if (parent.id === 'actor1') {
        rects.classed('active1', false);
      } else if (parent.id === 'actor2') {
        rects.classed('active2', false);
      }
      setCommonalities();
    });

  var setCommonalities = function() {
    var both = d3.select('#actor1').classed('active') &&
      d3.select('#actor2').classed('active');
    var neither = !d3.select('#actor1').classed('active') &&
      !d3.select('#actor2').classed('active');
    rects.classed('common', false);
    if (both) {
      rects.classed('clickable', false);
      var actorId1 = d3.select('#actor1').attr('data-actorid');
      var actorName1 = d3.select('#actor1 .actorName').text();
      var actorId2 = d3.select('#actor2').attr('data-actorid');
      var actorName2 = d3.select('#actor2 .actorName').text();
      $.ajax({
        url: '/getCommonTitles.json',
        type: 'GET',
        dataType: 'json',
        data: { ActorID1: actorId1, ActorID2: actorId2 },
        success: function(response) {
          var commonTitlesString = getCommonTitlesString({
            data: response,
            actorId1: actorId1,
            actorName1: actorName1,
            actorId2: actorId2,
            actorName2: actorName2
          });
          d3.select('#commonModalBody').html(commonTitlesString);
        }
      });
      d3.select('#modalActor1').text(actorName1);
      d3.select('#modalActor2').text(actorName2);
      $('#commonModal').modal('show');
    } else if (neither) {
      rects.classed('clickable', true);
    } else {
      rects.classed('clickable', false);
      var actorId = d3.select('#actor1').classed('active') ? 
        d3.select('#actor1').attr('data-actorid') :
        d3.select('#actor2').attr('data-actorid');
      $.ajax({
        url: '/getCommonActors.json',
        type: 'GET',
        dataType: 'json',
        data: { ActorID: actorId },
        success: function(response) {
          for (var i = 0; i < response.length; i++) {
            d3.selectAll('rect[data-actorid="' + response[i] + '"]')
              .classed('common', true)
              .classed('clickable', true);
          }
        }
      });
    }
  };
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

var getCommonTitlesString = function(param) {
  var common = '<div class="row commonHeader">' +
    '<div class="col-xs-4"><h4>' + getActorLink(param.actorId1,param.actorName1) + 
    '</h4></div><div class="col-xs-4"><h4>Title</h4></div>' + 
    '<div class="col-xs-4"><h4>' + getActorLink(param.actorId2,param.actorName2) + '</h4></div></div>';
  var tv = '', movies = '';
  var processed = processCommonResults(param.data);
  for (var i = 0; i < processed.svu.length; i++) {
    tv += '<div class="row commonRow">' +
      '<div class="col-xs-4">' + getCharacterLink(processed.svu[i].CharacterID1,processed.svu[i].Character1) + 
      '</div><div class="col-xs-4">' + getTitleLink('tt0203259','SVU') + ' (' + processed.svu[i].Episodes + ' episodes)</div>' + 
      '<div class="col-xs-4">' + getCharacterLink(processed.svu[i].CharacterID2,processed.svu[i].Character2) + '</div></div>';
  }
  for (var i = 0; i < processed.tv.length; i++) {
    tv += '<div class="row commonRow">' +
      '<div class="col-xs-4">' + getCharacterLink(processed.tv[i].CharacterID1,processed.tv[i].Character1) + 
      '</div><div class="col-xs-4">' + getTitleLink(processed.tv[i].TitleID,processed.tv[i].Title) + 
      ' (' + processed.tv[i].Episodes + ' episodes)</div>' + 
      '<div class="col-xs-4">' + getCharacterLink(processed.tv[i].CharacterID2,processed.tv[i].Character2) + '</div></div>';
  }
  for (var i = 0; i < processed.movies.length; i++) {
    movies += '<div class="row commonRow">' +
      '<div class="col-xs-4">' + getCharacterLink(processed.movies[i].CharacterID1,processed.movies[i].Character1) + 
      '</div><div class="col-xs-4">' + getTitleLink(processed.movies[i].TitleID,processed.movies[i].Title) + '</div>' + 
      '<div class="col-xs-4">' + getCharacterLink(processed.movies[i].CharacterID2,processed.movies[i].Character2) + '</div></div>';
  }
  if (tv) {
    common += '<h4>TV Shows</h4>' + tv;
  }
  if (movies) {
    common += '<h4>Movies</h4>' + movies;
  }
  return common;
};

var processCommonResults = function(data) {
  var svu = [], movies = [], tv = [];
  for (var i = 0; i < data.length; i++) {
    if (data[i].TitleID === 'tt0203259') {
      svu.push(data[i]);
    } else if (data[i].TV) {
      tv.push(data[i]);
    } else {
      movies.push(data[i]);
    }
  }
  return {
    svu: svu,
    movies: movies,
    tv: tv
  };
};

var getActorLink = function(id, name) {
  if (typeof id === 'string') {
    return '<a class="actorLink" href="http://www.imdb.com/name/' + 
      id + '/" target="_blank">' + name + '</a>';
  } else {
    return name;
  }
};

var getTitleLink = function(id, name) {
  if (typeof id === 'string') {
    return '<a class="titleLink" href="http://www.imdb.com/title/' + 
      id + '/" target="_blank">' + name + '</a>';
  } else {
    return name;
  }
};

var getCharacterLink = function(id, name) {
  if (typeof id === 'string') {
    return '<a class="characterLink" href="http://www.imdb.com/character/' + 
      id + '/" target="_blank">' + name + '</a>';
  } else {
    return name;
  }
};