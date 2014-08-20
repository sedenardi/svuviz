var config = require('./config.json'),
  logger = require('./my_modules/logger.js'),
  Web = require('./my_modules/web.js'),
  BaseShowScraper = require('./my_modules/baseShowScraper.js'),
  EpisodeActorGrabber = require('./my_modules/episodeActorGrabber.js'),
  ActorCreditsGrabber = require('./my_modules/actorCreditsGrabber.js');

var base = new BaseShowScraper(config);
var cast = new EpisodeActorGrabber(config);
var credits = new ActorCreditsGrabber(config);
base.on('done',function() {
  cast.start();
});
cast.on('done',function() {
  credits.start();
});
//base.start();

var web = new Web(config);
web.startServer();