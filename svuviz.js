var config = require('./config.json'),
  logger = require('./my_modules/logger.js'),
  Web = require('./my_modules/web.js'),
  BaseShowScraper = require('./my_modules/baseShowScraper.js');

var base = new BaseShowScraper(config);
base.start()

//var web = new Web(config);
//web.startServer();
