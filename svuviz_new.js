'use strict';

var config = require('./config');
var db = require('./lib/db')(config.mysql);
var BaseShow = require('./scrapers/BaseShow');
var EpisodeActor = require('./scrapers/EpisodeActor');
var ActorCredits = require('./scrapers/ActorCredits');
var _ = require('lodash');

var startBaseTitles = function() {
  var baseShowSql = 'select * from BaseTitles;';
  return db.query([baseShowSql]).then((shows) => {
    var baseShows = _.map(shows, (show) => {
      var baseShow = new BaseShow(db, show.BaseTitleID);
      return baseShow.start();
    });
    return Promise.all(baseShows);
  });
};

startBaseTitles().then(() => {
  var episodeActor = new EpisodeActor(db);
  return episodeActor.start();
}).then(() => {
  var actorCredits = new ActorCredits(db);
  return actorCredits.start();
}).then(() => {
  return db.end();
}).catch((err) => {
  console.log(err);
});
