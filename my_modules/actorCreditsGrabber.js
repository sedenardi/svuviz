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
  var moreLinks = [];
  var moreLinksIndex = 0;
  
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
      //db.query(queueActors(),checkUnprocessed);
      checkUnprocessed();
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
      
      db.query(obj.logTitlesCmd(),function() {
        db.query(obj.logAppearancesCmd(),function() {
          moreLinks = obj.getMoreLinks();
          if (moreLinks.length) {
            moreLinksIndex = 0;
            nextMoreLink();
          } else {
            markProcessed(obj.url.actorId);
          }
        });
      });
    });
    p.parseArtistCreditsPage(obj, config.baseId);
  };

  var nextMoreLink = function() {
    if (moreLinksIndex < moreLinks.length) {
      downloadMoreLink(moreLinks[moreLinksIndex]);
    } else {
      markProcessed(moreLinks[0].actorId);
    }
  };

  var downloadMoreLink = function(moreLinkObj) {
    var urlObj = url.getMoreEpisodesUrl(moreLinkObj);

    var dl = new Downloader();
    dl.on('data', function(obj) {
      parseMoreLink(obj);
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

  var parseMoreLink = function(obj) {
    var p = new Parser();
    p.on('parsed', function(obj) {
      logger.log({
        caller: 'Parser',
        message: 'parsed',
        params: obj.url
      });
      
      db.query(obj.logTitlesCmd(),function() {
        db.query(obj.logAppearancesCmd(),function() {
          moreLinksIndex++;
          nextMoreLink();
        });
      });
    });
    p.parseMoreEpisodes(obj);
  };

  var markProcessed = function(actorId) {
    db.query(setProcessed(actorId), checkUnprocessed);
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