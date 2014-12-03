var config = require('./config.json'),
  logger = require('./my_modules/logger.js'),
  Web = require('./my_modules/web.js'),
  DB = require('./my_modules/db.js'),
  BaseShowScraper = require('./my_modules/baseShowScraper.js'),
  EpisodeActorGrabber = require('./my_modules/episodeActorGrabber.js'),
  ActorCreditsGrabber = require('./my_modules/actorCreditsGrabber.js'),
  queries = require('./my_modules/queries.js'),
  fs = require('fs');

var day = 1000 * 60 * 60 * 24;
var numBaseShows = 0, doneBaseShows = 0;

var web = new Web(config);
web.startServer();

var cast = new EpisodeActorGrabber(config);
var credits = new ActorCreditsGrabber(config);

var queueAllActors = function() {
  var db = new DB(config);
  db.connect('queueUpAllActors', function(){
    db.query({
      sql: 'Insert into ProcessActors(ActorID) select ActorID from Actors a where not exists (select 1 from ProcessActors pa where pa.ActorID = a.ActorID);',
      inserts: []
    }, function() { 
      credits.start();
      db.disconnect();
    });
  });
};

var scrapeBaseTitle = function(baseId) {
  var base = new BaseShowScraper(config, baseId);
  
  base.on('done',function(baseId) {
    doneBaseShows++;
    if (doneBaseShows === numBaseShows) {
      cast.setBaseShowsDone();
    }
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
      numBaseShows = dbRes.length;
      doneBaseShows = 0;
      cast.start();
      credits.start();
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
      caller: 'SVUViz',
      message: 'Fetching all info',
      params: baseId
    });
    web.allInfo(db, baseId, function(allInfo) {
      db.disconnect();
      var s = JSON.stringify(allInfo);
      var filename = process.cwd() + '/web/static/' + baseId + '.json';
      logger.log({
        caller: 'SVUViz',
        message: 'Writing to file',
        params: { filename: filename }
      });
      fs.writeFile(filename, s, function (err) {
        if (err) {
          console.log(err);
          return;
        }
        logger.log({
          caller: 'SVUViz',
          message: 'Done writing to file',
          params: { filename: filename }
        });
        if (baseTitles.length > 1) {
          process.nextTick(function(){
            fetchAllInitFiles(baseTitles.slice(1));
          });
          s = null;
        }
      });
    });
  });
};

cast.on('done', function() {
  credits.setIncomingActorsDone();
});

credits.on('done', function() {
  var db = new DB(config);
  db.connect('FinishProcessing', function(){
    db.query(queries.buildCommonTitles(), function() {
      db.query({ sql: 'select * from BaseTitles;', inserts: [] }, function(dbRes2) {
        db.disconnect();
        fetchAllInitFiles(dbRes2);
      });
    });
  });
});

startBaseTitles();

setTimeout(function() {
  scrapeBaseTitle(baseId);
}, day*7);

setInterval(queueAllActors, day*3);
