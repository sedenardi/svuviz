'use strict';

var config = require('./config');
var db = require('./lib/db')(config.mysql);
var BaseShow = require('./scrapers/BaseShow');
var EpisodeActor = require('./scrapers/EpisodeActor');
var ActorCredits = require('./scrapers/ActorCredits');
var fs = require('bluebird').promisifyAll(require('fs'));
var queries = require('./lib/queries')(db);
var logger = require('./lib/logger');
var _ = require('lodash');

var generateFlatFile = function(baseTitleId, seqNo) {
  logger.log({
    caller: 'SVUViz',
    message: `Fetching all info - ${baseTitleId}`
  });
  return queries.baseTitleInfo(baseTitleId, seqNo).then((baseTitleInfo) => {
    var filename = `${process.cwd()}/web/static/${baseTitleId}.json`;
    logger.log({
      caller: 'SVUViz',
      message: `Writing file - ${baseTitleId}`
    });
    return fs.writeFileAsync(filename, JSON.stringify(baseTitleInfo));
  }).then(() => {
    logger.log({
      caller: 'SVUViz',
      message: `Finished writing file - ${baseTitleId}`,
      params: baseTitleId
    });
  });
};

var runBaseTitles = function() {
  return queries.baseTitles().then((shows) => {
    var baseShows = _.map(shows, (show) => {
      var baseShow = new BaseShow(db, show.BaseTitleID);
      return baseShow.start();
    });
    return Promise.all(baseShows).then(() => {
      var episodeActor = new EpisodeActor(db);
      return episodeActor.start();
    }).then(() => {
      var actorCredits = new ActorCredits(db);
      return actorCredits.start();
    }).then(() => {
      logger.log({
        caller: 'SVUViz',
        message: 'Building common titles'
      });
      return queries.buildCommonTitles();
    }).then(() => {
      var files = _.map(shows, (show, i) => {
        return generateFlatFile(show.BaseTitleID, i);
      });
      return Promise.all(files);
    });
  }).then(() => {
    return db.end();
  }).catch((err) => {
    console.log(err);
    return db.end();
  });
};

module.exports = {
  runBaseTitles: runBaseTitles,
  queueAllActors: queries.queueAllActors
};
