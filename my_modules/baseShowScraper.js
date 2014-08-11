var logger = require('./logger.js'),
  Downloader = require('./downloader.js'),
  Parser = require('./parser.js'),
  UrlBuilder = require('./urlBuilder.js'),
  DB = require('./db.js'),
  moment = require('moment'),
  util = require('util'),
  events = require('events');

var BaseShowScraper = function(config) {
  
  var self = this;
  var db = new DB(config);
  var url = new UrlBuilder();
  
  var baseShowExistsQuery = {
    sql: 'Select * from Titles where TitleID = ?;',
    inserts: [config.baseId]
  };
  
  this.start = function() {
    db.connect('BaseShowScraper', init);
  };
  
  var init = function() {
    db.query(baseShowExistsQuery, function baseQueryDone(res) {
      if (!res.length) {
        downloadTitle(config.baseId);
      }
    });
  };

  var downloadTitle = function(titleId) {
    var urlObj = url.getTitleUrl(titleId);
    
    var dl = new Downloader();
    dl.on('data', function(obj) {
      parseTitlePage(obj);
    });
    
    dl.on('error', function(logObj) {
      logger.log(logObj);
    });

    dl.download(urlObj);
  };

  var parseTitlePage = function(obj) {
    var p = new Parser();
    p.on('parsed', function(obj) {
      logger.log({
        caller: 'Parser',
        message: 'parsed',
        params: obj.url
      });
      
      var cmd = obj.logCmd();
      db.query(cmd);
    });
    p.parseTitlePage(obj);
  };
  
  var startSeasons = function() {

  };

};

util.inherits(BaseShowScraper, events.EventEmitter);

module.exports = BaseShowScraper;
