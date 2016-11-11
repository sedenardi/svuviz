'use strict';

var TitleGrabber = require('./TitleGrabber');
var urlBuilder = require('../lib/urlBuilder');
var dl = require('../lib/downloader')();
var parser = require('../lib/parser');
var logger = require('../lib/logger');

var BaseShowScraper = function(db, baseId) {
  this.db = db;
  this.baseId = baseId;
};

BaseShowScraper.prototype.lastSeasonQuery = function() {
  return [
    'select coalesce(max(Season),1) as LastSeason from Titles t where ParentTitleID = ?;',
    [this.baseId]
  ];
};

BaseShowScraper.prototype.download = function(seasonUrl) {
  logger.log({
    caller: 'BaseShowScraper',
    message: `Scraping ${this.baseId} Season`,
    minData: seasonUrl.season
  });
  return dl.get(seasonUrl).then((body) => {
    var parsedObj = parser.parseSeasonPage({ url: seasonUrl, data: body });
    var logCmd = this.db.query(parsedObj.logCmd());
    var processCmd = this.db.query(parsedObj.logToProcess());
    return Promise.all([logCmd, processCmd]).then(() => {
      if (parsedObj.url.hasNextSeason()) {
        var nextSeason = parsedObj.url.getNextSeason();
        return this.download(nextSeason);
      } else {
        return Promise.resolve();
      }
    });
  });
};

BaseShowScraper.prototype.start = function() {
  var baseGrabber = new TitleGrabber(this.db, this.baseId);
  return baseGrabber.start().then(() => {
    return this.db.query(this.lastSeasonQuery());
  }).then((res) => {
    var season = res[0].LastSeason;
    var seasonUrl = urlBuilder.getSeasonsUrl(this.baseId, season);
    return this.download(seasonUrl);
  });
};

module.exports = BaseShowScraper;
