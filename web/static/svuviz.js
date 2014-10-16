$(document).ready(function(){
  $.ajax({
    url: 'showInfo.json',
    cache: true,
    success: function(data) {
      $.ajax({
        url: 'filterTitles.json',
        cache: true,
        success: function(tData) {
          prepareDataset(data, tData);
          initGraph();
          setupTitleSearch();
          setupActorSearch();
        }
      });
    }
  });

  // jQuery -> D3 click (from http://stackoverflow.com/a/11180172/3311526)
  jQuery.fn.d3Click = function () {
    this.each(function (i, e) {
      var evt = document.createEvent("MouseEvents");
      evt.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);

      e.dispatchEvent(evt);
    });
  };

  registerHelpers();
});

var prepareDataset = function(obj, tData) {
  var searchObj = {};
  for (var i = 0; i < obj.length; i++) {
    for (var j = 0; j < obj[i].Appearances.length; j++) {
      obj[i].Appearances[j].x = i;
      var actorId = obj[i].Appearances[j].ActorID;
      var character = obj[i].Appearances[j].Character;
      if (typeof searchObj[actorId] === 'undefined') {
        searchObj[actorId] = {
          ActorID: actorId,
          ActorName: obj[i].Appearances[j].ActorName,
          Characters: {}
        };
        searchObj[actorId].Characters[character] = '';
      } else {
        if (typeof searchObj[actorId].Characters[character] === 'undefined') {
          searchObj[actorId].Characters[character] = '';
        }
      }
    }
  }
  var searchArray = [];
  for (var actorId in searchObj) {
    var characters = [];
    for (var character in searchObj[actorId].Characters) {
      characters.push(character);
    }
    var charStr = characters.join(', ');
    searchArray.push({
      ActorID: actorId,
      ActorName: searchObj[actorId].ActorName,
      Characters: charStr
    });
    searchObj[actorId].Characters = charStr;
  }
  dataset = {
    showTitles: obj,
    searchTitles: tData,
    searchObj: searchObj,
    searchArray: searchArray
  };
};

var setupTitleSearch = function() {
  searchTitleSource = new Bloodhound({
    datumTokenizer: Bloodhound.tokenizers.obj.whitespace('Title'),
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    limit: 10,
    local: dataset.searchTitles
  });
  searchTitleSource.initialize();
  
  $('#titleSearch').typeahead({
    highlight: true
  }, {
    name: 'titleSearch',
    source: searchTitleSource.ttAdapter(),
    displayKey: 'Title',
    templates: {
      suggestion: function(d) {
        return '<div class="searchActorName">' + 
          d.Title + '</div>' + 
          '<div class="searchCharacterName">' + 
          (d.TV ? 'TV Show' : '') + '</div>';
      }
    }
  }).bind('typeahead:selected', function (obj, datum){
    console.log(datum);
  })
};

var setupActorSearch = function() {
  var actorSearch = function(actorId) {
    $('.appearance[data-actorid="' + actorId + '"]:first').d3Click();
  };

  searchActorSource = new Bloodhound({
    datumTokenizer: Bloodhound.tokenizers.obj.whitespace('ActorName', 'Characters'),
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    limit: 10,
    local: dataset.searchArray
  });   
  searchActorSource.initialize();
  var typeaheadOptions = {
    opt1: {
      highlight: true
    },
    opt2: {
      name: 'search',
      source: searchActorSource.ttAdapter(),
      displayKey: 'ActorName',
      templates: {
        suggestion: function(d) {
          return '<div class="searchActorName">' + 
            d.ActorName + '</div>' + 
            '<div class="searchCharacterName">' + 
            d.Characters + '</div>';
        }
      }
    }
  };

  $('#searchInput1').typeahead(typeaheadOptions.opt1, typeaheadOptions.opt2)
    .bind('typeahead:selected', function (obj, datum){
      actorSearch(datum.ActorID);
  });

  $('#searchInput2').typeahead(typeaheadOptions.opt1, typeaheadOptions.opt2)
    .bind('typeahead:selected', function (obj, datum){
      actorSearch(datum.ActorID);
  });
};

var setActorSearch = function(selector, actorId, actorName) {
  $(selector).parents('.actor').addClass('active', true);
  $(selector).parents('.actor').attr('data-actorid', actorId);
  $(selector).parents('.actor').attr('data-actorname', actorName);
  $(selector).typeahead('val', actorName);
};

var clearActorSearch = function(selector) {
  $(selector).parents('.actor').removeClass('active', true);
  $(selector).parents('.actor').attr('data-actorid', '');
  $(selector).parents('.actor').attr('data-actorname', '');
  $(selector).typeahead('val', '');
};

var changeSearch = function(actors) {
  var searchData = [];
  if (actors) {
    for (var i = 0; i < actors.length; i++) {
      if (typeof dataset.searchObj[actors[i]] === 'undefined') {
        console.log(actors[i]);
      }
      searchData.push(dataset.searchObj[actors[i]]);
    }
  } else {
    searchData = dataset.searchArray;
  }
  searchActorSource.clear();
  searchActorSource.local = searchData;
  searchActorSource.initialize(true);
}

var initGraph = function() {
  margin = 8;
  width = $(window).width() - 2*margin;
  height = $(window).height() - 2*margin - $('#main').offset().top;
  episodeHeight = Math.floor(height / 8);

  xScale = d3.scale.ordinal()
    .domain(d3.range(dataset.showTitles.length))
    .rangeBands([0, width], 0.1);

  yScale = d3.scale.linear()
    .domain([0, d3.max(dataset.showTitles, function(d) {
      return d.Appearances.length;
    })])
    .range([episodeHeight, height]);

  yHeight = (height - episodeHeight) / 
    d3.max(dataset.showTitles, function(d) {
      return d.Appearances.length;
    });

  var colorScale = d3.scale.log()
    .domain([1, d3.max(dataset.showTitles, function(d) {
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
    .data(dataset.showTitles)
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
      if (xPosition > (width - 200)) xPosition -= (200 + 50);
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
    .data(dataset.showTitles)
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
        var actors = d3.selectAll('rect[data-actorid="' + d.ActorID + '"]');
        if (!d3.select('#actor1').classed('active')) {
          actors.classed('hover1', true);
        } else if (!d3.select('#actor2').classed('active')) {
          actors.classed('hover2', true);
        }

        if (d3.select(this).classed('common')) {
          actors.classed('wasCommon', true)
            .classed('common', false);
        }

        var xPosition = parseFloat(d3.select(this).attr("x")) + 30;
        if (xPosition > (width - 200)) xPosition -= (200 + 50);
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
      var actors = d3.selectAll('rect[data-actorid="' + d.ActorID + '"]');
      actors.classed('hover1', false)
        .classed('hover2', false);

      if (d3.select(this).classed('wasCommon')) {
        actors.classed('wasCommon', false);
        if (!(d3.select(this).classed('active1') || 
          d3.select(this).classed('active2'))) {
          actors.classed('common', true);
        }
      }

      d3.select('#appearanceTooltip').classed('hidden', true);
    })
    .on('click', function(d) {
      if (d3.select(this).classed('clickable')) {
        appearanceClicked(d);
      }
    });

  d3.selectAll('.actorClose')
    .on('click', function(d) {
      var parent = d3.select(this)[0][0].parentNode;
      if (parent.id === 'actor1') {
        rects.classed('active1', false);
      } else if (parent.id === 'actor2') {
        rects.classed('active2', false);
      }

      var actorId = d3.select(parent).attr('data-actorid');
      d3.selectAll('.clicked[data-actorid="' + actorId + '"]')
        .remove();

      var target = d3.select(this).attr('data-target');
      clearActorSearch(target);

      setCommonalities();
    });

  d3.selectAll('.actorInfo')
    .on('click', function(d) {
      var parent = d3.select(this)[0][0].parentNode;
      if (d3.select(parent).classed('active')) {
        var actorId = d3.select(parent).attr('data-actorid');
        var actorName = d3.select(parent).attr('data-actorname');
        if (!actorName.length) {
          return;
        }
        $.ajax({
          url: '/getActorInfo.json',
          type: 'GET',
          dataType: 'json',
          data: { ActorID: actorId },
          success: function(response) {
            var modalBody = getActorModalBody({
              data: response
            });
            d3.select('#actorModalBody').html(modalBody);
          }
        });
        d3.select('#modalActor').html(getActorLink(actorId, actorName));
        $('#actorModal').modal('show');
      }
    });

  var scaleFactor = 3;
  var appearanceClicked = function(d) {
    var actors = d3.selectAll('rect[data-actorid="' + d.ActorID + '"]');
    if (!d3.select('#actor1').classed('active')) {
      var target = d3.select('#actor1').attr('data-target');
      setActorSearch(target, d.ActorID, d.ActorName);
      actors.classed('active1', true);
    } else if (!d3.select('#actor2').classed('active')) {
      var target = d3.select('#actor2').attr('data-target');
      setActorSearch(target, d.ActorID, d.ActorName);
      actors.classed('active2', true);
    }
    setCommonalities();
    actors.each(function(d,i) {
      var x = parseFloat(d3.select(this).attr('x')),
          y = parseFloat(d3.select(this).attr('y')),
          w = parseFloat(d3.select(this).attr('width')),
          h = parseFloat(d3.select(this).attr('height')),
          cls = d3.select(this).classed('active1') ? 
            'active1' : 'active2';
      var clicked = svg.append('rect')
        .attr('x', x)
        .attr('y', y)
        .attr('height', h)
        .attr('width', w)
        .attr('data-actorid', d.ActorID)
        .classed('appearance', true)
        .classed('clicked', true)
        .classed(cls, true);
      clicked.transition()
        .ease('linear')
        .attr('x', x - w/scaleFactor)
        .attr('y', y - h/scaleFactor)
        .attr('height', h + h*2/scaleFactor)
        .attr('width', w + w*2/scaleFactor);
    });
  };

  var setCommonalities = function() {
    var both = d3.select('#actor1').classed('active') &&
      d3.select('#actor2').classed('active');
    var neither = !d3.select('#actor1').classed('active') &&
      !d3.select('#actor2').classed('active');
    rects.classed('common', false);
    if (both) {
      rects.classed('clickable', false);
      showCommonModal();
    } else if (neither) {
      rects.classed('clickable', true);
      changeSearch();
    } else {
      rects.classed('clickable', false);
      getCommonActors();
    }
  };
};

var getCommonActors = function() {
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
      changeSearch(response);
    }
  });
};

var showCommonModal = function() {
  var actorId1 = d3.select('#actor1').attr('data-actorid');
  var actorName1 = d3.select('#actor1').attr('data-actorname');
  var actorId2 = d3.select('#actor2').attr('data-actorid');
  var actorName2 = d3.select('#actor2').attr('data-actorname');
  $.ajax({
    url: '/getCommonTitles.json',
    type: 'GET',
    dataType: 'json',
    data: { ActorID1: actorId1, ActorID2: actorId2 },
    success: function(response) {
      var commonTitlesString = getCommonModalBody({
        data: response,
        actorId1: actorId1,
        actorName1: actorName1,
        actorId2: actorId2,
        actorName2: actorName2
      });
      d3.select('#commonModalBody').html(commonTitlesString);
    }
  });
  d3.select('#commonModalActor1').text(actorName1);
  d3.select('#commonModalActor2').text(actorName2);
  $('#commonModal').modal('show');
};

var getActorModalBody = function(param) {
  param.processed = processModalResults(param.data);
  var actorModal = Handlebars.compile($('#actorModal-template').html());
  return actorModal(param);
};

var getCommonModalBody = function(param) {
  param.processed = processModalResults(param.data);
  var commonModal = Handlebars.compile($('#commonModal-template').html());
  return commonModal(param);
};

var processModalResults = function(data) {
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

var registerHelpers = function() {
  Handlebars.registerHelper('json', function(obj) {
    return JSON.stringify(obj, null, 2);
  });
  Handlebars.registerHelper('actorLink', function(id, name) {
    if (typeof id === 'string') {
      return '<a class="actorLink" href="http://www.imdb.com/name/' + 
        id + '/" target="_blank">' + name + '</a>';
    } else {
      return name;
    }
  });
  Handlebars.registerHelper('characterLink', function(id, name) {
    if (typeof id === 'string') {
      return '<a class="characterLink" href="http://www.imdb.com/character/' + 
        id + '/" target="_blank">' + name + '</a>';
    } else {
      return name;
    }
  });
  Handlebars.registerHelper('titleLink', function(id, name) {
    if (typeof id === 'string') {
      return '<a class="titleLink" href="http://www.imdb.com/title/' + 
        id + '/" target="_blank">' + name + '</a>';
    } else {
      return name;
    }
  });
  Handlebars.registerHelper('episodes', function(row) {
    if (row.TV) {
      return ' (' + row.Episodes + ' episode' + (row.Episodes > 1 ? 's' : '') + ')';
    } else {
      return '';
    }
  });

  Handlebars.registerPartial('commonRow', $('#commonRow-partial').html());
  Handlebars.registerPartial('actorRow', $('#actorRow-partial').html());
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