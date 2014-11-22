var config = require('./config.json'),
  logger = require('./my_modules/logger.js'),
  Web = require('./my_modules/web.js'),
  DB = require('./my_modules/db.js'),
  BaseShowScraper = require('./my_modules/baseShowScraper.js'),
  EpisodeActorGrabber = require('./my_modules/episodeActorGrabber.js'),
  ActorCreditsGrabber = require('./my_modules/actorCreditsGrabber.js');

var db = new DB(config);
var day = 1000 * 60 * 60 * 24;

var queueAllActors = function() {
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

var cast = new EpisodeActorGrabber(config);
var credits = new ActorCreditsGrabber(config);

cast.start();
credits.start();

startBaseTitles();

var web = new Web(config);
web.startServer();

setInterval(queueAllActors, day*3);