var logger = require('./logger.js'),
  Downloader = require('./downloader.js'),
  Parser = require('./parser.js'),
  UrlBuilder = require('./urlBuilder.js'),
  DB = require('./db.js'),
  moment = require('moment'),
  util = require('util'),
  events = require('events');

var EpisodeActorGrabber = function(config) {

  var self = this;
  var db = new DB(config);
  var url = new UrlBuilder();
  var total = 0, done = 0;
  var baseShowsIncoming = true;

  var getUnprocessed = function() {
    return {
      sql: 'select * from ProcessTitles limit 10;'
    };
  };

  var setProcessed = function(titleId) {
    return {
      sql: 'delete from ProcessTitles where TitleID = ?;',
      inserts: [titleId]
    };
  };
  
  this.start = function() {
    baseShowsIncoming = true;
    db.connect('EpisodeActorGrabber', checkUnprocessed);
  };

  this.setBaseShowsDone = function() { 
    logger.log({
      caller: 'EpisodeActorGrabber',
      message: 'Received BaseShowScraper finished'
    });
    baseShowsIncoming = false; 
  };
  
  var checkUnprocessed = function() {
    db.query(getUnprocessed(), function(res){
      if (res.length) {
        logger.log({
          caller: 'EpisodeActorGrabber',
          message: 'Found ' + res.length + ' unprocessed titles'
        });
        total = res.length;
        done = 0;
        for (var i = 0; i < res.length; i++) {
          downloadCredits(res[i].TitleID);  
        }
      } else {
        if (baseShowsIncoming) {
          logger.log({
            caller: 'EpisodeActorGrabber',
            message: 'No unprocessed, checking again in 60 seconds'
          });
          setTimeout(checkUnprocessed, 60000);
        } else {
          quit();
        }
      }
    });
  };

  var downloadCredits = function(titleId) {
    var urlObj = url.getTitleCreditsUrl(titleId);
    
    var dl = new Downloader();
    dl.on('data', function(obj) {
      parseCreditsPage(obj);
    });

    dl.download(urlObj);
  };

  var parseCreditsPage = function(obj) {
    var parsedObj = Parser.parseTitleCreditsPage(obj);
    if (parsedObj.cast.length > 0) {    
      db.query(parsedObj.logActorsCmd(),function() {
        db.query(parsedObj.logCastCmd(),function() {
          db.query(parsedObj.logToProcess(), function() {
            db.query(setProcessed(parsedObj.url.titleId), function() {
              done++;
              if (done === total) {
                checkUnprocessed();
              }
            });
          });
        });
      });
    } else {
      db.query(setProcessed(parsedObj.url.titleId), function() {
        done++;
        if (done === total) {
          checkUnprocessed();
        }
      });
    }
  };

  var quit = function() {
  	db.disconnect();
  	logger.log({
      caller: 'EpisodeActorGrabber',
      message: 'Exiting'
  	});
    self.emit('done');
  };

};

util.inherits(EpisodeActorGrabber, events.EventEmitter);

module.exports = EpisodeActorGrabber;