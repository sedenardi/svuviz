var config = require('./config.json'),
  logger = require('./my_modules/logger.js'),
  Web = require('./my_modules/web.js'),
  DB = require('./my_modules/db.js'),
  BaseShowScraper = require('./my_modules/baseShowScraper.js'),
  EpisodeActorGrabber = require('./my_modules/episodeActorGrabber.js'),
  ActorCreditsGrabber = require('./my_modules/actorCreditsGrabber.js'),
  fs = require('fs');

var day = 1000 * 60 * 60 * 24;

var web = new Web(config);
web.startServer();

var queueAllActors = function() {
  var db = new DB(config);
  db.connect('queueUpAllActors', function(){
    db.query({
      sql: 'Insert into ProcessActors(ActorID) select ActorID from Actors a where not exists (select 1 from ProcessActors pa where pa.ActorID = a.ActorID);',
      inserts: []
    }, function() { 
      db.disconnect();
    });
  });
};

var scrapeBaseTitle = function(baseId) {
  var base = new BaseShowScraper(config, baseId);
  
  base.on('done',function(baseId) {
    logger.log({
      caller: 'BaseShowScraper',
      message: 'done',
      params: baseId
    });

    setTimeout(function() {
      scrapeBaseTitle(baseId);
    }, day*7);
  });

  base.start();
};

var startBaseTitles = function() {
  var db = new DB(config);
  db.connect('queueUpAllActors', function(){
    db.query({
      sql: 'select * from BaseTitles;',
      inserts: []
    }, function(dbRes) { 
      for (var i = 0; i < dbRes.length; i++) {
        scrapeBaseTitle(dbRes[i].BaseTitleID);
      }
      db.disconnect();
    });
  });
};

var fetchAllInitFiles = function(baseTitles) {
  var db = new DB(config);
  db.connect('fetchAllInitFiles', function(){
    var baseId = baseTitles[0].BaseTitleID;
    logger.log({
      caller: 'BaseShowScraper',
      message: 'Fetching all info',
      params: baseId
    });
    web.allInfo(db, baseId, function(allInfo) {
      db.disconnect();
      var s = JSON.stringify(allInfo);
      var filename = process.cwd() + '/web/static/' + baseId + '.json';
      logger.log({
        caller: 'BaseShowScraper',
        message: 'Writing to file',
        params: { baseId: baseId, filename: filename }
      });
      fs.writeFile(filename, s, function (err) {
        if (err) {
          console.log(err);
          return;
        }
        logger.log({
          caller: 'BaseShowScraper',
          message: 'Done writing to file',
          params: { baseId: baseId, filename: filename }
        });
        if (baseTitles.length > 1) {
          fetchAllInitFiles(baseTitles.slice(1));
        }
      });
    });
  });
};

var cast = new EpisodeActorGrabber(config);
var credits = new ActorCreditsGrabber(config);

credits.on('done', function() {
  var db = new DB(config);
  var cmd = {
    sql: 'select (select count(1) from ProcessActors) as Actors,' +
      '(select count(1) from ProcessTitles) as Titles;',
    inserts: []
  };
  db.connect('checkForDoneProcessing', function(){
    db.query(cmd, function(dbRes) {
      if (dbRes[0].Actors === 0 && dbRes[0].Titles === 0) {
        db.query({
          sql: 'select * from BaseTitles;',
          inserts: []
        }, function(dbRes2) {
          db.disconnect();
          fetchAllInitFiles(dbRes2);
        });
      } else {
        db.disconnect();
      }
    });
  });
});

cast.start();
credits.start();

startBaseTitles();

setInterval(queueAllActors, day*3);