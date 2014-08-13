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
  
  var queueTitles = function() {
  	return {
      sql: 'truncate table ProcessTitles; Insert into ProcessTitles(TitleID,Processed) Select TitleID, 0 as `Processed` from Titles where ParentTitleID = ?;',
      inserts: [config.baseId]
    };
  };

  var getUnprocessed = function() {
    return {
      sql: 'select * from ProcessTitles where Processed = 0 limit 1;',
      inserts: []
    };
  };

  var setProcessed = function(titleId) {
    return {
      sql: 'update ProcessTitles set Processed = 1 where TitleID = ?;',
      inserts: [titleId]
    };
  };
  
  this.start = function() {
    db.connect('EpisodeActorGrabber', function(){
      db.query(queueTitles(),checkUnprocessed);
    });
  };
  
  var checkUnprocessed = function() {
    db.query(getUnprocessed(), function(res){
      if (res.length) {
        var titleId = res[0].TitleID;
        downloadCredits(titleId);
      } else {
        quit();
      }
    });
  };

  var downloadCredits = function(titleId) {
    var urlObj = url.getTitleCreditsUrl(titleId);
    
    var dl = new Downloader();
    dl.on('data', function(obj) {
      parseCreditsPage(obj);
    });
    
    dl.on('error', function(logObj) {
      logger.log(logObj);
      if (logObj.params.attempt < 10) {
        var timeout = logObj.params.attempt * 15000;
        setTimeout(function permitRetry(){
          dl.download(logObj.params.url, logObj.params.attempt + 1);
        },timeout);
      } else {
        setTimeout(function waitLonger() {
          dl.download(logObj.params.url);
        },3600000);
      }
    });

    dl.download(urlObj);
  };

  var parseCreditsPage = function(obj) {
    var p = new Parser();
    p.on('parsed', function(obj) {
      logger.log({
        caller: 'Parser',
        message: 'parsed',
        params: obj.url
      });
      
      db.query(obj.logActorsCmd(),function() {
        db.query(obj.logCastCmd(),function() {
          db.query(setProcessed(obj.url.titleId),checkUnprocessed);
        });
      });
    });
    p.parseTitleCreditsPage(obj);
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