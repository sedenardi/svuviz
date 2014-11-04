BaseTitleID = 'tt0203259'; //svu

$(document).ready(function(){
  $.ajax({
    url: 'showInfoArray.json',
    data: { BaseTitleID: BaseTitleID },
    cache: true,
    success: function(data) {
      $.ajax({
        url: 'filterTitlesArray.json',
        data: { BaseTitleID: BaseTitleID },
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
  var showTitles = [],
      searchObj = {};
  for (var i = 0; i < obj.length; i++) {
    showTitles.push({
      TitleID: obj[i][0],
      Season: obj[i][1],
      Number: obj[i][2],
      Title: obj[i][3],
      Synopsis: obj[i][4],
      AirDate: obj[i][5],
      Appearances: []
    });
    for (var j = 0; j < obj[i][6].length; j++) {
      showTitles[i].Appearances.push({
        ActorID: obj[i][6][j][0],
        ActorName: obj[i][6][j][1],
        Commonalities: obj[i][6][j][2],
        Character: obj[i][6][j][3],
        CharacterID: obj[i][6][j][4],
        x: i,
        Season: showTitles[i].Season
      });
      var actorId = showTitles[i].Appearances[j].ActorID;
      var character = showTitles[i].Appearances[j].Character;
      if (typeof searchObj[actorId] === 'undefined') {
        searchObj[actorId] = {
          ActorID: actorId,
          ActorName: showTitles[i].Appearances[j].ActorName,
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
  var searchTitles = [];
  for (var i = 0; i < tData.length; i++) {
    searchTitles.push({
      TitleID: tData[i][0],
      Title: tData[i][1],
      TV: tData[i][2]
    });
  }
  dataset = {
    showTitles: showTitles,
    searchTitles: searchTitles,
    searchObj: searchObj,
    searchArray: searchArray
  };

  colorCutoffs = [32,85,179];
};

var searchTitleActors = [];
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
    $('#titleSearch').attr('data-titleid', datum.TitleID);
    $('#titleSearch').attr('data-title', datum.Title);
    $.ajax({
      url: 'getTitleActors.json',
      data: { BaseTitleID: BaseTitleID, TitleID: datum.TitleID },
      cache: true,
      success: function(response) {
        searchTitleActors = response;
        var mapped = d3.set(searchTitleActors);
        d3.selectAll('.clicked').remove();
        d3.selectAll('.appearance')
          .style('display', function(d) {
            if (mapped.has(d.ActorID)) {
              return 'inline';
            } else {
              return 'none';
            }
          });
        clearBothActors();
      }
    });
  }).change(function() {
    var newVal = $(this).val();
    if (newVal !== $('#titleSearch').attr('data-title')) {
      $('#titleSearch').attr('data-titleid','');
      $('#titleSearch').attr('data-title','');
      $('#titleSearch').typeahead('val', '');
      searchTitleActors = [];
      d3.selectAll('.appearance')
        .style('display','inline');
      clearBothActors();
    }
  });
};

var clearBothActors = function() {
  clearActor('actor1');
  clearActor('actor2');
  changeSearch();
};

var clearActor = function(actorNum) {
  var appearances = d3.selectAll('.appearance');

  if (actorNum === 'actor1') {
    appearances.classed('active1', false);
  } else if (actorNum === 'actor2') {
    appearances.classed('active2', false);
  }

  var actor = d3.select('#' + actorNum);

  var actorId = actor.attr('data-actorid');
  d3.selectAll('.clicked[data-actorid="' + actorId + '"]')
    .remove();

  var target = actor.attr('data-target');
  clearActorSearch(target);
};

var setupActorSearch = function() {
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
      appearanceClicked(datum,'actor1');
  }).change(function() {
    var newVal = $(this).val();
    if (newVal !== $(this).parents('.actor').attr('data-actorname')) {
      clearActor('actor1');
      setCommonalities();
    }
  });

  $('#searchInput2').typeahead(typeaheadOptions.opt1, typeaheadOptions.opt2)
    .bind('typeahead:selected', function (obj, datum){
      appearanceClicked(datum,'actor2');
  }).change(function() {
    var newVal = $(this).val();
    if (newVal !== $(this).parents('.actor').attr('data-actorname')) {
      clearActor('actor2');
      setCommonalities();
    }
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
      searchData.push(dataset.searchObj[actors[i]]);
    }
  } else if (searchTitleActors.length) {
    for (var i = 0; i < searchTitleActors.length; i++) {
      searchData.push(dataset.searchObj[searchTitleActors[i]]);
    }
  }
  else {
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

  /*var colorScale = d3.scale.log()
    .domain([1, d3.max(dataset.showTitles, function(d) {
      return d.Appearances[0].Commonalities;
    })])
    .range([1, 255]);*/

  var getEpisodeColor = function(d) {
    var i = d.Season % palette.length;
    return palette[i]['500'];
  };

  var getAppearanceColor = function(d) {
    var i = d.Season % palette.length;
    if (d.Commonalities < colorCutoffs[0]) {
      return palette[i]['200']; //'#72d572';
    } else if (d.Commonalities < colorCutoffs[1]) {
      return palette[i]['400']; //'#259b24';
    } else if (d.Commonalities < colorCutoffs[2]) {
      return palette[i]['700']; //'#259b24';
    } else {
      return palette[i]['900']; //'#0a7e07';
    }
  };
  
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
    .style('fill', getEpisodeColor)
    .on('mouseenter', function(d) {
      d3.select(this).classed('hover',true);

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
      d3.select(this).classed('hover',false);
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
    .style('fill', getAppearanceColor)
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
      var actorNum = parent.id;
      clearActor(actorNum);
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
};

var scaleFactor = 3;
var appearanceClicked = function(d, actorNum) {
  var actor1 = true;
  if (typeof actorNum !== 'undefined') {
    actor1 = (actorNum === 'actor1');
  } else if (d3.select('#actor1').classed('active')) {
    actor1 = false;
  }

  var actors = d3.selectAll('rect[data-actorid="' + d.ActorID + '"]');
  if (actor1) {
    var target = d3.select('#actor1').attr('data-target');
    setActorSearch(target, d.ActorID, d.ActorName);
    actors.classed('active1', true);
  } else {
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
    var clicked = d3.select('svg')
      .append('rect')
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
  if (both) {
    d3.selectAll('.appearance')
      .filter(function(d,i) { return !d3.select(this).classed('clicked'); })
      .style('display',function(d){
        if (d.ActorID === d3.select('#actor1').attr('data-actorid') ||
          d.ActorID === d3.select('#actor2').attr('data-actorid')) {
          return 'inline';
        } else {
          return 'none';
        }
      });
    showCommonModal();
  } else if (neither) {
    var appearances = d3.selectAll('.appearance')
      .filter(function(d,i) { return !d3.select(this).classed('clicked'); });
    if (searchTitleActors.length) {      
      var mapped = d3.set(searchTitleActors);
      appearances.style('display', function(d) {
        if (mapped.has(d.ActorID)) {
          return 'inline';
        } else {
          return 'none';
        }
      });
    } else {
      appearances.style('display','inline');
    }
    changeSearch();
  } else {
    getCommonActors();
  }
};

var getCommonActors = function() {
  var actorId = d3.select('#actor1').classed('active') ? 
    d3.select('#actor1').attr('data-actorid') :
    d3.select('#actor2').attr('data-actorid');
  var data = { BaseTitleID: BaseTitleID, ActorID: actorId };
  if ($('#titleSearch').attr('data-titleid').length) { 
    data.TitleID = $('#titleSearch').attr('data-titleid');
  }
  $.ajax({
    url: '/getCommonActors.json',
    type: 'GET',
    dataType: 'json',
    data: data,
    success: function(response) {
      var mapped = d3.set(response);
      d3.selectAll('.appearance')
        .filter(function(d,i) { return !d3.select(this).classed('clicked'); })
        .style('display', function(d) {
          if (mapped.has(d.ActorID) || d.ActorID === actorId) {
            return 'inline';
          } else {
            return 'none';
          }
        });
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