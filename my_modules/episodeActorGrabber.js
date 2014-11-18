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

  var getUnprocessed = function() {
    return {
      sql: 'select * from ProcessTitles limit 10;',
      inserts: []
    };
  };

  var setProcessed = function(titleId) {
    return {
      sql: 'delete from ProcessTitles where TitleID = ?;',
      inserts: [titleId]
    };
  };
  
  this.start = function() {
    db.connect('EpisodeActorGrabber', checkUnprocessed);
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
        logger.log({
          caller: 'EpisodeActorGrabber',
          message: 'No unprocessed, checking again in 30 seconds'
        });
        setTimeout(checkUnprocessed, 30000);
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
    var p = new Parser();
    p.on('parsed', function(parsedObj) {      
      db.query(parsedObj.logActorsCmd(),function() {
        db.query(parsedObj.logCastCmd(),function() {
          db.query(parsedObj.logToProcess(), function() {
            db.query(setProcessed(parsedObj.url.titleId), function() {
              logger.log({
                caller: 'EpisodeActorGrabber',
                message: 'MarkProcessed',
                params: { titleId: parsedObj.url.titleId }
              });
              done++;
              if (done === total) {
                checkUnprocessed();
              }
            });
          });
        });
      });
    });

    p.parseTitleCreditsPage(obj);
  };

  // var quit = function() {
  // 	db.disconnect();
  // 	logger.log({
  //     caller: 'EpisodeActorGrabber',
  //     message: 'Exiting'
  // 	});
  //   self.emit('done');
  // };

};

util.inherits(EpisodeActorGrabber, events.EventEmitter);

module.exports = EpisodeActorGrabber;