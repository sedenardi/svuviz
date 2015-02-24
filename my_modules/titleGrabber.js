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
        downloadTitle(titleId);
      } else {
      	quit();
      }
    });
  };

  var downloadTitle = function(titleId) {
    var urlObj = url.getTitleUrl(titleId);
    
    var dl = new Downloader();
    dl.on('data', function(obj) {
      var parsed = Parser.parseTitlePage(obj);
      var cmd = parsed.logCmd();
      db.query(cmd,quit);
    });

    dl.download(urlObj);
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