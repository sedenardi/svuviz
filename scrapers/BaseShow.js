'use strict';

var TitleGrabber = require('./TitleGrabber');
var urlBuilder = require('../lib/urlBuilder');
var dl = require('../lib/downloader')();
var parser = require('../lib/parser');
var logger = require('../lib/logger');

var BaseShow = function(db, baseId) {
  this.db = db;
  this.baseId = baseId;
};

BaseShow.prototype.lastSeasonQuery = function() {
  return [
    'select coalesce(max(Season),1) as LastSeason from Titles t where ParentTitleID = ?;',
    [this.baseId]
  ];
};

BaseShow.prototype.download = function(seasonUrl) {
  logger.log({
    caller: 'BaseShow',
    message: `Scraping ${this.baseId} Season`,
    minData: seasonUrl.season
  });
  return dl.get(seasonUrl).then((body) => {
    var parsedObj = parser.parseSeasonPage({ url: seasonUrl, data: body });
    var logAction = this.db.query(parsedObj.logCmd());
    var processAction = this.db.query(parsedObj.logToProcess());
    return Promise.all([logAction, processAction]).then(() => {
      if (parsedObj.url.hasNextSeason()) {
        var nextSeason = parsedObj.url.getNextSeason();
        return this.download(nextSeason);
      } else {
        return Promise.resolve();
      }
    });
  });
};

BaseShow.prototype.start = function() {
  var baseGrabber = new TitleGrabber(this.db, this.baseId);
  return baseGrabber.start().then(() => {
    return this.db.query(this.lastSeasonQuery());
  }).then((res) => {
    var season = res[0].LastSeason;
    var seasonUrl = urlBuilder.getSeasonsUrl(this.baseId, season);
    return this.download(seasonUrl);
  });
};

module.exports = BaseShow;
