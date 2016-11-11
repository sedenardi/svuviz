'use strict';

var config = require('./config');
var db = require('./lib/db')(config.mysql);
var BaseShowScraper = require('./scrapers/BaseShowScraper');
var _ = require('lodash');

var startBaseTitles = function() {
  var baseShowSql = 'select * from BaseTitles;';
  return db.query([baseShowSql]).then((shows) => {
    var baseShows = _.map(shows, (show) => {
      var baseShow = new BaseShowScraper(db, show.BaseTitleID);
      return baseShow.start();
    });
    return Promise.all(baseShows);
  });
};

startBaseTitles().then(() => {
  return db.end();
});
