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

  var queueUpAllActors = function() {
    return {
      sql: 'Insert into ProcessActors(ActorID) select ActorID from Actors a where not exists (select 1 from ProcessActors pa where pa.ActorID = a.ActorID);',
      inserts: []
    };
  };

  var getUnprocessed = function() {
    return {
      sql: 'select * from ProcessActors limit 30;',
      inserts: []
    };
  };

  var setProcessed = function(actorId) {
    return {
      sql: 'delete from ProcessActors where ActorID = ?;',
      inserts: [actorId]
    };
  };
  
  this.start = function(queueAll) {
    db.connect('ActorCreditsGrabber', function(){
      if (typeof queueAll !== 'undefined' && queueAll) {
        logger.log({
          caller: 'ActorCreditsGrabber',
          message: 'Queueing all actors'
        });
        db.query(queueUpAllActors(), function() {
          checkUnprocessed();
        });
      } else {
        checkUnprocessed();
      }
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
    p.on('parsed', function(parsedObj) {
      // logger.log({
      //   caller: 'Parser',
      //   message: 'parsed',
      //   params: parsedObj.url
      // });
      
      if (parsedObj.credits.length) {
        db.query(parsedObj.logTitlesCmd(),function() {
          db.query(parsedObj.logAppearancesCmd(),function() {
            var moreLinks = parsedObj.getMoreLinks();
            if (moreLinks.length) {
              var moreLinksObj = {
                moreLinks: moreLinks,
                moreLinksDone: 0
              };
              for (var i = 0; i < moreLinks.length; i++) {
                downloadMoreLink(moreLinksObj, i);
              }
            } else {
              markProcessed(parsedObj.url.actorId);
            }
          });
        });
      } else {
        markProcessed(parsedObj.url.actorId);
      }
    });
    p.parseActorCreditsPage(obj, config.baseId);
  };

  var downloadMoreLink = function(moreLinksObj, index) {
    var urlObj = url.getMoreEpisodesUrl(moreLinksObj.moreLinks[index]);

    var dl = new Downloader();
    dl.on('data', function(obj) {
      parseMoreLink(moreLinksObj, obj);
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

  var parseMoreLink = function(moreLinksObj, obj) {
    var p = new Parser();
    p.on('parsed', function(parsedObj) {
      // logger.log({
      //   caller: 'Parser',
      //   message: 'parsed',
      //   params: parsedObj.url
      // });

      db.query(parsedObj.logTitlesCmd(),function() {
        db.query(parsedObj.logAppearancesCmd(),function() {
          moreLinksObj.moreLinksDone++;
          if (moreLinksObj.moreLinksDone === moreLinksObj.moreLinks.length) {
            markProcessed(moreLinksObj.moreLinks[0].actorId);
          }
        });
      });
    });
    p.parseMoreEpisodes(obj);
  };

  var markProcessed = function(actorId) {
    db.query(setProcessed(actorId), function() {
      logger.log({
        caller: 'ActorCreditsGrabber',
        message: 'MarkProcessed',
        params: { actorId: actorId }
      });
      done++;
      if (done === total) {
        checkUnprocessed();
      }
    });
  };

};

util.inherits(ActorCreditsGrabber, events.EventEmitter);

module.exports = ActorCreditsGrabber;