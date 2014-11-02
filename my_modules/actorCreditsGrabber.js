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
  var total = 0, done = 0;

  var getUnprocessed = function() {
    return {
      sql: 'select * from ProcessActors limit 20;',
      inserts: []
    };
  };

  var setProcessed = function(actorId) {
    return {
      sql: 'delete from ProcessActors where ActorID = ?;',
      inserts: [actorId]
    };
  };
  
  this.start = function() {
    db.connect('ActorCreditsGrabber', function(){
      checkUnprocessed();
    });
  };
  
  var checkUnprocessed = function() {
    db.query(getUnprocessed(), function(res){
      if (res.length) {
        logger.log({
          caller: 'ActorCreditsGrabber',
          message: 'Found ' + res.length + ' unprocessed actors'
        });
        total = res.length;
        done = 0;
        for (var i = 0; i < res.length; i++) {
          downloadCredits(res[i].ActorID);  
        }
      } else {
        logger.log({
          caller: 'ActorCreditsGrabber',
          message: 'No unprocessed, checking again in 30 seconds'
        });
        setTimeout(checkUnprocessed, 30000);
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
          var moreLinks = obj.getMoreLinks();
          if (moreLinks.length) {
            var moreLinksIndex = 0;
            nextMoreLink(moreLinks, moreLinksIndex);
          } else {
            markProcessed(obj.url.actorId);
          }
        });
      });
    });
    p.parseArtistCreditsPage(obj, config.baseId);
  };

  var nextMoreLink = function(moreLinks, moreLinksIndex) {
    if (moreLinksIndex < moreLinks.length) {
      downloadMoreLink(moreLinks, moreLinksIndex);
    } else {
      markProcessed(moreLinks[0].actorId);
    }
  };

  var downloadMoreLink = function(moreLinks, moreLinksIndex) {
    var urlObj = url.getMoreEpisodesUrl(moreLinks[moreLinksIndex]);

    var dl = new Downloader();
    dl.on('data', function(obj) {
      parseMoreLink(moreLinks, moreLinksIndex, obj);
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

  var parseMoreLink = function(moreLinks, moreLinksIndex, obj) {
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
          nextMoreLink(moreLinks, moreLinksIndex);
        });
      });
    });
    p.parseMoreEpisodes(obj);
  };

  var markProcessed = function(actorId) {
    db.query(setProcessed(actorId), function() {
      done++;
      if (done === total) {
        checkUnprocessed();
      }
    });
  };

  // var quit = function() {
  // 	db.disconnect();
  // 	logger.log({
  //     caller: 'ActorCreditsGrabber',
  //     message: 'Exiting'
  // 	});
  //   self.emit('done');
  // };

};

util.inherits(ActorCreditsGrabber, events.EventEmitter);

module.exports = ActorCreditsGrabber;