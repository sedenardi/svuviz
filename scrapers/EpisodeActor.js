'use strict';

var urlBuilder = require('../lib/urlBuilder');
var dl = require('../lib/downloader')();
var parser = require('../lib/parser');
var logger = require('../lib/logger');
var _ = require('lodash');

var unprocessedQuery = ['select * from ProcessTitles limit 10;'];
var setProcessedQuery = function(titleId) {
  return [
    'delete from ProcessTitles where TitleID = ?;',
    [titleId]
  ];
};

var EpisodeActor = function(db) {
  this.db = db;
};

EpisodeActor.prototype.downloadCredits = function(titleId) {
  var urlObj = urlBuilder.getTitleCreditsUrl(titleId);
  return dl.get(urlObj).then((body) => {
    var parsedObj = parser.parseTitleCreditsPage({ url: urlObj, data: body });
    if (!parsedObj.cast.length) {
      return this.db.query(setProcessedQuery(titleId));
    }
    return this.db.query(parsedObj.logActorsCmd()).then(() => {
      return this.db.query(parsedObj.logCastCmd());
    }).then(() => {
      return this.db.query(parsedObj.logToProcess());
    }).then(() => {
      return this.db.query(setProcessedQuery(titleId));
    });
  });
};

EpisodeActor.prototype.start = function() {
  return this.db.query(unprocessedQuery).then((res) => {
    logger.log({
      caller: 'EpisodeActor',
      message: `Found ${res.length} unprocessed titles`
    });
    if (!res.length) {
      return Promise.resolve();
    }
    var actions = _.map(res, (r) => {
      return this.downloadCredits(r.TitleID);
    });
    return Promise.all(actions).then(() => {
      return this.start();
    });
  });
};

module.exports = EpisodeActor;
