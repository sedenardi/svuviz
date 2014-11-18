var config = require('./config.json'),
  logger = require('./my_modules/logger.js'),
  Web = require('./my_modules/web.js'),
  BaseShowScraper = require('./my_modules/baseShowScraper.js'),
  EpisodeActorGrabber = require('./my_modules/episodeActorGrabber.js'),
  ActorCreditsGrabber = require('./my_modules/actorCreditsGrabber.js');

var svu = 'tt0203259';
var friends = 'tt0108778';
var seinfeld = 'tt0098904';

var queueUpAllActors = function() {
  return {
    sql: 'Insert into ProcessActors(ActorID) select ActorID from Actors a where not exists (select 1 from ProcessActors pa where pa.ActorID = a.ActorID);',
    inserts: []
  };
};

var queueUpAllActors = function(queueAll) {
  db.connect('queueUpAllActors', function(){
    db.query({
      sql: 'Insert into ProcessActors(ActorID) select ActorID from Actors a where not exists (select 1 from ProcessActors pa where pa.ActorID = a.ActorID);',
      inserts: []
    }, function() { });
  });
};

var base = new BaseShowScraper(config, seinfeld);
var cast = new EpisodeActorGrabber(config);
var credits = new ActorCreditsGrabber(config);

base.on('done',function(baseId) {
  logger.log({
    caller: 'BaseShowScraper',
    message: 'done',
    params: baseId
  });
});

base.start();
cast.start();
credits.start();

var web = new Web(config);
web.startServer();