'use strict';

var cheerio = require('cheerio');
var moment = require('moment');

var parse = function(obj) {
  return {
    $: cheerio.load(obj.data),
    url: obj.url
  };
};

module.exports = {
  parseTitlePage: function(rawObj) {
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
        return [sql, [this.titleId, this.parentTitleId, this.title]];
      }
    };
    return titleObj;
  },
  parseSeasonPage: function(rawObj) {
    var obj = parse(rawObj);

    var maxSeason = 1;
    obj.$('#bySeason').find('option').each(function() {
      var n = obj.$(this).text().trim();
      if (!isNaN(n) && parseInt(n) > maxSeason) {
        maxSeason = parseInt(n);
      }
    });
    obj.url.maxSeason = maxSeason;

    var eps = [];
    obj.$('.list_item').each(function(){
      var seasonEp = obj.$(this).find('div[data-const]').find('div').text();
      var title = obj.$(this).find('.info').find('strong').find('a').text();
      var titleId = obj.$(this).find('.info').find('strong').find('a').attr('href').split('/')[2];
      var synopsis = obj.$(this).find('.item_description').text().trim();

      var airDate = moment(obj.$(this).find('.airdate').text().trim(), 'DD MMM YYYY');
      if (!airDate.isValid()) airDate = null;
      else airDate = airDate.toDate();

      eps.push({
        titleId: titleId,
        title: title,
        synopsis: synopsis,
        season: seasonEp.split(',')[0].replace('S', ''),
        episode: seasonEp.split(',')[1].trim().replace('Ep', ''),
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
        var updateSql = 'update Titles set Title = ?, Season = ?, Number = ?, Synopsis = ?, AirDate = ? where TitleID = ?;';
        var updateArray = [];
        for (var i = 0; i < this.episodes.length; i++) {
          updateArray.push(updateSql);
          inserts.push(this.episodes[i].title);
          inserts.push(this.episodes[i].season);
          inserts.push(this.episodes[i].episode);
          inserts.push(this.episodes[i].synopsis);
          inserts.push(this.episodes[i].airDate);
          inserts.push(this.episodes[i].titleId);
        }
        sql += selects.join(' UNION ') + ') t1 where not exists (select 1 from Titles t where t.TitleID = t1.TitleID);';
        sql += updateArray.join('');
        return [sql, inserts];
      },
      logToProcess: function() {
        var sql = 'Insert into ProcessTitles(TitleID) select * from (';
        var s = 'select ? as `TitleID`';
        var selects = [];
        var inserts = [];
        for (var i = 0; i < this.episodes.length; i++) {
          selects.push(s);
          inserts.push(this.episodes[i].titleId);
        }
        sql += selects.join(' UNION ') + ') t1 where not exists (select 1 from ProcessTitles t where t.TitleID = t1.TitleID);';
        return [sql, inserts];
      }
    };
    return seasonObj;
  }
};
