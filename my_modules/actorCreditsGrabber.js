var logger = require('./logger.js'),
  Downloader = require('./downloader.js'),
  Parser = require('./parser.js'),
  UrlBuilder = require('./urlBuilder.js'),
  DB = require('./db.js'),
  moment = require('moment'),
  util = require('util'),
  events = require('events');

var ActorCreditsGrabber = function(config) {

  var self = this;
  var db = new DB(config);
  var url = new UrlBuilder();
  
  var queueActors = function() {
  	return {
      sql: 'truncate table ProcessActors; Insert into ProcessActors(ActorID,Processed) Select ActorID, 0 as `Processed` from Actors;',
      inserts: [config.baseId]
    };
  };

  var getUnprocessed = function() {
    return {
      sql: 'select * from ProcessActors where Processed = 0 limit 1;',
      inserts: []
    };
  };

  var setProcessed = function(actorId) {
    return {
      sql: 'update ProcessActors set Processed = 1 where ActorID = ?;',
      inserts: [actorId]
    };
  };
  
  this.start = function() {
    db.connect('ActorCreditsGrabber', function(){
      db.query(queueActors(),checkUnprocessed);
    });
  };
  
  var checkUnprocessed = function() {
    db.query(getUnprocessed(), function(res){
      if (res.length) {
        var actorId = res[0].ActorID;
        downloadCredits(actorId);
      } else {
        quit();
      }
    });
  };

  var downloadCredits = function(actorId) {
    var urlObj = url.getActorCreditsUrl(actorId);
    
    var dl = new Downloader();
    dl.on('data', function(obj) {
      parseCreditsPage(obj);
    });
    
    dl.on('error', function(logObj) {
      logger.log(logObj);
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
      
      
    });
    p.parseArtistCreditsPage(obj);
  };

  var quit = function() {
  	db.disconnect();
  	logger.log({
      caller: 'ActorCreditsGrabber',
      message: 'Exiting'
  	});
    self.emit('done');
  };

};

util.inherits(ActorCreditsGrabber, events.EventEmitter);

module.exports = ActorCreditsGrabber;