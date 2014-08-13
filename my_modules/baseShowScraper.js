var logger = require('./logger.js'),
  Downloader = require('./downloader.js'),
  Parser = require('./parser.js'),
  UrlBuilder = require('./urlBuilder.js'),
  TitleGrabber = require('./titleGrabber.js'),
  DB = require('./db.js'),
  moment = require('moment'),
  util = require('util'),
  events = require('events');

var BaseShowScraper = function(config) {
  
  var self = this;
  var db = new DB(config);
  var url = new UrlBuilder();
  
  this.start = function() {
    var baseGrabber = new TitleGrabber(config);
    baseGrabber.on('done', startSeasons);
    baseGrabber.start(config.baseId);
  };
  
  var startSeasons = function() {
    db.connect('BaseShowScraper', function() {
      var seasonUrl = url.getSeasonsUrl(config.baseId);
      downloadSeason(seasonUrl);
    });
  };

  var downloadSeason = function(seasonUrl) {
    var dl = new Downloader();
    dl.on('data', function(obj) {
      parseSeason(obj);
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

    dl.download(seasonUrl);
  };

  var parseSeason = function(obj) {
    var p = new Parser();
    p.on('parsed', function(obj) {
      logger.log({
        caller: 'Parser',
        message: 'parsed',
        params: obj.url
      });
      
      var cmd = obj.logCmd();
      db.query(cmd, function() {
        if (obj.url.hasNextSeason()) {
          var nextSeason = obj.url.getNextSeason();
          downloadSeason(nextSeason);
        } else {
          self.emit('done');
        }
      });
    });
    p.parseSeasonPage(obj);
  };

};

util.inherits(BaseShowScraper, events.EventEmitter);

module.exports = BaseShowScraper;
