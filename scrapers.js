'use strict';

var BaseShow = require('./scrapers/BaseShow');
var EpisodeActor = require('./scrapers/EpisodeActor');
var ActorCredits = require('./scrapers/ActorCredits');
var logger = require('./lib/logger');
var fs = require('bluebird').promisifyAll(require('fs'));
var _ = require('lodash');

module.exports = function(config, db, queries) {
  var S3 = require('./lib/s3')(config);

  var generateFlatFile = function(baseTitleId, seqNo, local) {
    logger.log({
      caller: 'SVUViz',
      message: `Fetching all info - ${baseTitleId}`
    });
    return queries.baseTitleInfo(baseTitleId, seqNo).then((baseTitleInfo) => {
      var filename = `${baseTitleId}.json`;
      var filePath = `${process.cwd()}/web/static/${filename}`;
      logger.log({
        caller: 'SVUViz',
        message: `Writing file - ${baseTitleId}`
      });
      if (local) {
        return fs.writeFileAsync(filePath, JSON.stringify(baseTitleInfo));
      } else {
        return S3.upload(filename, JSON.stringify(baseTitleInfo));
      }
    }).then(() => {
      logger.log({
        caller: 'SVUViz',
        message: `Finished writing file - ${baseTitleId}`,
        params: baseTitleId
      });
    });
  };
  var runBaseTitles = function(local) {
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
          return generateFlatFile(show.BaseTitleID, i, local);
        });
        return Promise.all(files);
      });
    }).then(() => {
      if (local) {
        return db.end();
      } else {
        return Promise.resolve();
      }
    }).catch((err) => {
      console.log(err);
      if (local) {
        return db.end();
      } else {
        return Promise.resolve();
      }
    });
  };
  return {
    runBaseTitles: runBaseTitles,
    queueAllActors: queries.queueAllActors
  };
};
