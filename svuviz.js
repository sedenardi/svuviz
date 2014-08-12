var config = require('./config.json'),
  logger = require('./my_modules/logger.js'),
  Web = require('./my_modules/web.js'),
  BaseShowScraper = require('./my_modules/baseShowScraper.js'),
  EpisodeActorGrabber = require('./my_modules/episodeActorGrabber.js');

var base = new BaseShowScraper(config);
var cast = new EpisodeActorGrabber(config);
base.on('done',function() {
  cast.start();
});
cast.on('done',function() {

});

//var web = new Web(config);
//web.startServer();
base.start();