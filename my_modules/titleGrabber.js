var logger = require('./logger.js'),
  Downloader = require('./downloader.js'),
  Parser = require('./parser.js'),
  UrlBuilder = require('./urlBuilder.js'),
  DB = require('./db.js'),
  moment = require('moment'),
  util = require('util'),
  events = require('events');

var TitleGrabber = function(config) {

  var self = this;
  var db = new DB(config);
  var url = new UrlBuilder();
  var titleId = '';
  
  var titleExistsQuery = function() {
  	return {
      sql: 'Select * from Titles where TitleID = ?;',
      inserts: [titleId]
    };
  };
  
  this.start = function(title) {
  	titleId = title;
    db.connect('TitleGrabber', init);
  };
  
  var init = function() {
    db.query(titleExistsQuery(), function titleExistsQueryDone(res) {
      if (!res.length) {
        downloadTitle(config.baseId);
      } else {
      	quit();
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
      db.query(cmd,quit);
    });
    p.parseTitlePage(obj);
  };

  var quit = function() {
  	db.disconnect();
  	logger.log({
      caller: 'TitleGrabber',
      message: 'Exiting'
  	});
    self.emit('done');
  };

};

util.inherits(TitleGrabber, events.EventEmitter);

module.exports = TitleGrabber;