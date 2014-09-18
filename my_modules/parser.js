var cheerio = require('cheerio'),
  moment = require('moment'),
  util = require('util'),
  events = require('events');

var Parser = function() {

  var self = this;
  
  var parse = function(obj) {
    return newObj = {
      $: cheerio.load(obj.data),
      url: obj.url
    };
  };
  
  this.parseTitlePage = function(rawObj) {
    var obj = parse(rawObj);
    var titleId = obj.url.titleId;
    var title = obj.$('.header').first().find('span[itemprop="name"]').first().text();
    var parentTitleId = null;
    
    if (obj.$('.tv_header').get().length) {
      var parentUrl = obj.$('.tv_header').first().find('a').first().attr('href');
      var parts = parentUrl.split('/');
      parentTitleId = parts[1];
    }
    
    var titleObj = {
      titleId: titleId,
      parentTitleId: parentTitleId,
      title: title,
      logCmd: function() {
        var sql = 'Insert into Titles(TitleID,ParentTitleID,Title) Select * from (select ? as `TitleID`,? as `ParentTitleID`,? as `Title`) t1 where not exists (select 1 from Titles t where t.TitleID = t1.TitleID);';
        return {
          sql: sql,
          inserts: [this.titleId, this.parentTitleId, this.title]
        };
      }
    };
    self.emit('parsed', titleObj);
  };

  this.parseSeasonPage = function(rawObj) {
    var obj = parse(rawObj);

    var maxSeason = 1;
    obj.$('#bySeason').find('option').each(function(i,v) {
      var n = obj.$(this).text().trim();
      if (!isNaN(n) && parseInt(n) > maxSeason) {
        maxSeason = parseInt(n);
      }
    });
    obj.url.maxSeason = maxSeason;

    var eps = [];
    obj.$('.list_item').each(function(i,v){
      var seasonEp = obj.$(this).find('div[data-const]').find('div').text();
      var title = obj.$(this).find('.info').find('strong').find('a').text();
      var titleId = obj.$(this).find('.info').find('strong').find('a').attr('href').split('/')[2];
      var synopsis = obj.$(this).find('.item_description').text().trim();
      
      var airDate = moment(obj.$(this).find('.airdate').text().trim(),'DD MMM YYYY');
      if (!airDate.isValid()) airDate = null;
      else airDate = airDate.toDate();
      
      eps.push({
        titleId: titleId,
        title: title,
        synopsis: synopsis,
        season: seasonEp.split(',')[0].replace('S',''),
        episode: seasonEp.split(',')[1].trim().replace('Ep',''),
        airDate: airDate
      });
    });

    var seasonObj = {
      url: obj.url,
      episodes: eps,
      logCmd: function() {
        var sql = 'Insert into Titles(TitleID,ParentTitleID,Season,Number,Title,Synopsis,AirDate) select * from (';
        var s = 'select ? as `TitleID`,? as `ParentTitleID`,? as `Season`,? as `Number`,? as `Title`,? as `Synopsis`,? as `AirDate`';
        var selects = [];
        var inserts = [];
        for (var i = 0; i < this.episodes.length; i++) {
          selects.push(s);
          inserts.push(this.episodes[i].titleId);
          inserts.push(this.url.titleId);
          inserts.push(this.episodes[i].season);
          inserts.push(this.episodes[i].episode);
          inserts.push(this.episodes[i].title);
          inserts.push(this.episodes[i].synopsis);
          inserts.push(this.episodes[i].airDate);
        }
        sql += selects.join(' UNION ') + ') t1 where not exists (select 1 from Titles t where t.TitleID = t1.TitleID);';
        return {
          sql: sql,
          inserts: inserts
        };
      }
    };
    self.emit('parsed', seasonObj);
  };

  this.parseTitleCreditsPage = function(rawObj) {
    var obj = parse(rawObj);

    var cast = [];
    obj.$('.cast_list').find('tr.odd').each(function(i,v){
      var actorId = obj.$(this).find('[itemprop="actor"]').find('a').attr('href').split('/')[2];
      var name = obj.$(this).find('[itemprop="actor"]').find('[itemprop="name"]').text().trim();
      var character = '';
      var characterId = null;
      if (obj.$(this).find('.character').find('a').length) {
        character = obj.$(this).find('.character').find('a').text().trim().replace(/\s{2,}/g, ' ');
        characterId = obj.$(this).find('.character').find('a').attr('href').split('/')[2];
      } else {
        character = obj.$(this).find('.character').text().trim().replace(/\s{2,}/g, ' ');
      }
      cast.push({
        actorId: actorId,
        name: name,
        character: character,
        characterId: characterId
      });
    });
    obj.$('.cast_list').find('tr.even').each(function(i,v){
      var actorId = obj.$(this).find('[itemprop="actor"]').find('a').attr('href').split('/')[2];
      var name = obj.$(this).find('[itemprop="actor"]').find('[itemprop="name"]').text().trim();
      var character = '';
      var characterId = null;
      if (obj.$(this).find('.character').find('a').length) {
        character = obj.$(this).find('.character').find('a').text().trim().replace(/\s{2,}/g, ' ');
        characterId = obj.$(this).find('.character').find('a').attr('href').split('/')[2];
      } else {
        character = obj.$(this).find('.character').text().trim().replace(/\s{2,}/g, ' ');
      }
      cast.push({
        actorId: actorId,
        name: name,
        character: character,
        characterId: characterId
      });
    });
    
    var castObj = {
      url: obj.url,
      cast: cast,
      logActorsCmd: function() {
        var sql = 'Insert into Actors(ActorID,Name) select * from (';
        var s = 'select ? as `ActorID`,? as `Name`';
        var selects = [];
        var inserts = [];
        for (var i = 0; i < this.cast.length; i++) {
          selects.push(s);
          inserts.push(this.cast[i].actorId);
          inserts.push(this.cast[i].name);
        }
        sql += selects.join(' UNION ') + ') t1 where not exists (select 1 from Actors t where t.ActorID = t1.ActorID);';
        return {
          sql: sql,
          inserts: inserts
        };
      },
      logCastCmd: function() {
        var sql = 'Insert into Appearances(ActorID,TitleID,`Character`,CharacterID) select * from (';
        var s = 'select ? as `ActorID`,? as `TitleID`,? as `Character`,? as `CharacterID`';
        var selects = [];
        var inserts = [];
        for (var i = 0; i < this.cast.length; i++) {
          selects.push(s);
          inserts.push(this.cast[i].actorId);
          inserts.push(this.url.titleId);
          inserts.push(this.cast[i].character);
          inserts.push(this.cast[i].characterId);
        }
        sql += selects.join(' UNION ') + ') t1 where not exists (select 1 from Appearances t where t.ActorID = t1.ActorID and t.TitleID = t1.TitleID);';
        return {
          sql: sql,
          inserts: inserts
        };
      }
    };
    self.emit('parsed', castObj);
  };

  this.parseArtistCreditsPage = function(rawObj, excludedTitleId) {
    var obj = parse(rawObj);

    var credits = [];

    obj.$('.filmo-category-section').first().find('.filmo-row').each(function(i,v){
      //console.log("Row: " + i);
      var titleId = obj.$(this).find('b').find('a').attr('href').split('/')[2];
      var title = obj.$(this).find('b').find('a').text().trim();
      var episodes = [];
      var moreLinkObj = null;
      var character = '';
      var characterId = null;
      if (obj.$(this).find('.filmo-episodes').length) {
        obj.$(this).find('.filmo-episodes').each(function(j,w){
          if (obj.$(this).find('a[onclick]').length) {
            var moreLinks = obj.$(this).find('a[onclick]').attr('onclick').split('(')[1].split(')')[0].split(',');
            moreLinkObj = {
              actorId: moreLinks[1].replace(/'/g, ''),
              titleId: moreLinks[2].replace(/'/g, ''),
              category: moreLinks[3].replace(/'/g, ''),
              credit_index: moreLinks[4].replace(/'/g, '')
            };
          } else {
            var episodeId = obj.$(this).find('a').first().attr('href').split('/')[2];
            var episodeTitle = obj.$(this).find('a').first().text().trim();
            var episodeCharacter = '';
            var episodeCharacterId = null;
            if (obj.$(this).find('a').length === 2) {
              episodeCharacter = obj.$(this).find('a').eq(1).text().trim().replace(/\s{2,}/g, ' ');
              episodeCharacterId = obj.$(this).find('a').eq(1).attr('href').split('/')[2];
            } else if (obj.$(this).text().trim().split('...').length === 2) {
              episodeCharacter = obj.$(this).text().trim().split('...')[1].trim().replace(/\s{2,}/g, ' ');
            }
            episodes.push({
              episodeId: episodeId,
              episodeTitle: episodeTitle,
              episodeCharacter: episodeCharacter,
              episodeCharacterId: episodeCharacterId
            });
          }
        });
      } else if (obj.$(this).html().split('<br>').length > 1) {
        if (obj.$(this).find('a:not(.in_production)').length === 1) {
          character = obj.$(this).html().split('<br>')[1].trim().replace(/\s{2,}/g, ' ');
        } else if (obj.$(this).find('a:not(.in_production)').length === 2) {
          character = obj.$(this).find('a:not(.in_production)').eq(1).text().trim().replace(/\s{2,}/g, ' ');
          characterId = obj.$(this).find('a:not(.in_production)').eq(1).attr('href').split('/')[2];
        } else {
          var raw = obj.$(this).html().split('<br>')[1].trim();
          character = obj.$(raw).text().trim().replace('\n',' ');
        }
      }
      if (titleId !== excludedTitleId) {
        credits.push({
          titleId: titleId,
          title: title,
          character: character,
          characterId: characterId,
          episodes: episodes,
          moreLinkObj: moreLinkObj
        });
      }
    });
    //console.log(JSON.stringify(credits));
    var creditsObj = {
      url: obj.url,
      credits: credits,
      getMoreLinks: function() {
        var moreLinks = [];
        for (var i = 0; i < this.credits.length; i++) {
          if (this.credits[i].moreLinkObj) {
            moreLinks.push(this.credits[i].moreLinkObj);
          }
        }
        return moreLinks;
      },
      logTitlesCmd: function() {
        var sql = 'Insert into Titles(TitleID,ParentTitleID,Title) select * from (';
        var s = 'select ? as `TitleID`,? as `ParentTitleID`,? as `Title`';
        var selects = [];
        var inserts = [];
        for (var i = 0; i < this.credits.length; i++) {
          selects.push(s);
          inserts.push(this.credits[i].titleId);
          inserts.push(null);
          inserts.push(this.credits[i].title);
          if (this.credits[i].episodes.length) {
            for (var j = 0; j < this.credits[i].episodes.length; j++) {
              selects.push(s);
              inserts.push(this.credits[i].episodes[j].episodeId);
              inserts.push(this.credits[i].titleId);
              inserts.push(this.credits[i].episodes[j].episodeTitle);
            }
          }
        }
        sql += selects.join(' UNION ') + ') t1 where not exists (select 1 from Titles t where t.TitleID = t1.TitleID);';
        return {
          sql: sql,
          inserts: inserts
        };
      },
      logAppearancesCmd: function() {
        var sql = 'Insert into Appearances(ActorID,TitleID,`Character`,CharacterID) select * from (';
        var s = 'select ? as `ActorID`,? as `TitleID`,? as `Character`,? as `CharacterID`';
        var selects = [];
        var inserts = [];
        for (var i = 0; i < this.credits.length; i++) {
          if (this.credits[i].episodes.length) {
            for (var j = 0; j < this.credits[i].episodes.length; j++) {
              selects.push(s);
              inserts.push(this.url.actorId);
              inserts.push(this.credits[i].episodes[j].episodeId);
              inserts.push(this.credits[i].episodes[j].episodeCharacter);
              inserts.push(this.credits[i].episodes[j].episodeCharacterId);  
            }
          } else {
            selects.push(s);
            inserts.push(this.url.actorId);
            inserts.push(this.credits[i].titleId);
            inserts.push(this.credits[i].character);
            inserts.push(this.credits[i].characterId);
          }
        }
        sql += selects.join(' UNION ') + ') t1 where not exists (select 1 from Appearances t where t.ActorID = t1.ActorID and t.TitleID = t1.TitleID);';
        return {
          sql: sql,
          inserts: inserts
        };
      }
    };

    self.emit('parsed', creditsObj);
  };

  this.parseMoreEpisodes = function(rawObj) {
    var obj = parse(rawObj);

    var episodes = [];
    obj.$('.filmo-episodes').each(function(j,w){
      var episodeId = obj.$(this).find('a').first().attr('href').split('/')[2];
      var episodeTitle = obj.$(this).find('a').first().text().trim();
      var episodeCharacter = '';
      var episodeCharacterId = null;
      if (obj.$(this).find('a').length === 2) {
        episodeCharacter = obj.$(this).find('a').eq(1).text().trim().replace(/\s{2,}/g, ' ');
        episodeCharacterId = obj.$(this).find('a').eq(1).attr('href').split('/')[2];
      } else if (obj.$(this).text().trim().split('...').length === 2) {
        episodeCharacter = obj.$(this).text().trim().split('...')[1].trim().replace(/\s{2,}/g, ' ');
      }
      episodes.push({
        episodeId: episodeId,
        episodeTitle: episodeTitle,
        episodeCharacter: episodeCharacter,
        episodeCharacterId: episodeCharacterId
      });
    });

    var episodesObj = {
      url: obj.url,
      episodes: episodes,
      logTitlesCmd: function() {
        var sql = 'Insert into Titles(TitleID,ParentTitleID,Title) select * from (';
        var s = 'select ? as `TitleID`,? as `ParentTitleID`,? as `Title`';
        var selects = [];
        var inserts = [];
        for (var i = 0; i < this.episodes.length; i++) {
          selects.push(s);
          inserts.push(this.episodes[i].episodeId);
          inserts.push(this.url.moreLinkObj.titleId);
          inserts.push(this.episodes[i].episodeTitle);
        }
        sql += selects.join(' UNION ') + ') t1 where not exists (select 1 from Titles t where t.TitleID = t1.TitleID);';
        return {
          sql: sql,
          inserts: inserts
        };
      },
      logAppearancesCmd: function() {
        var sql = 'Insert into Appearances(ActorID,TitleID,`Character`,CharacterID) select * from (';
        var s = 'select ? as `ActorID`,? as `TitleID`,? as `Character`,? as `CharacterID`';
        var selects = [];
        var inserts = [];
        for (var i = 0; i < this.episodes.length; i++) {
          selects.push(s);
          inserts.push(this.url.moreLinkObj.actorId);
          inserts.push(this.episodes[i].episodeId);
          inserts.push(this.episodes[i].episodeCharacter);
          inserts.push(this.episodes[i].episodeCharacterId);
        }
        sql += selects.join(' UNION ') + ') t1 where not exists (select 1 from Appearances t where t.ActorID = t1.ActorID and t.TitleID = t1.TitleID);';
        return {
          sql: sql,
          inserts: inserts
        };
      }
    };

    self.emit('parsed', episodesObj);
  };
};

util.inherits(Parser, events.EventEmitter);

module.exports = Parser;
