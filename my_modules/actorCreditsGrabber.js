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
  var incomingActors = true;
  var db = new DB(config);
  var url = new UrlBuilder();
  var moreLinks = [];
  var moreLinksIndex = 0;
  var total = 0, done = 0;

  var getUnprocessed = function() {
    return {
      sql: 'select * from ProcessActors limit 30;'
    };
  };

  var setProcessed = function(actorId) {
    return {
      sql: 'delete from ProcessActors where ActorID = ?;',
      inserts: [actorId]
    };
  };

  var redirectActor = function(oldActorId, newActorId) {
    var sql = 'delete from Appearances where ActorID = ?;';
    sql += 'delete from Actors where ActorID = ?;';
    sql += 'insert into ProcessActors(ActorID) select ?;';
    return {
      sql: sql,
      inserts: [oldActorId, oldActorId, newActorId]
    };
  };
  
  this.start = function() {
    incomingActors = true;
    db.connect('ActorCreditsGrabber', checkUnprocessed);
  };

  this.setIncomingActorsDone = function() {
    logger.log({
      caller: 'ActorCreditsGrabber',
      message: 'Received IncomingActors done'
    });
    incomingActors = false;
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
        if (incomingActors) {
          logger.log({
            caller: 'ActorCreditsGrabber',
            message: 'No unprocessed, checking again in 60 seconds'
          });
          setTimeout(checkUnprocessed, 60000);
        } else {
          quit();
        }
      }
    });
  };

  var downloadCredits = function(actorId) {
    var urlObj = url.getActorCreditsUrl(actorId);
    
    var dl = new Downloader();
    dl.on('data', function(obj) {
      parseCreditsPage(obj);
    });

    dl.download(urlObj);
  };

  var parseCreditsPage = function(obj) {
    var parsedObj = Parser.parseActorCreditsPage(obj);
    if (parsedObj.actorIsRedirected()) {
      db.query(redirectActor(parsedObj.url.actorId, parsedObj.retActorId), function() {
        markProcessed(parsedObj.url.actorId);
      });
      return;
    }

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
  };

  var downloadMoreLink = function(moreLinksObj, index) {
    var urlObj = url.getMoreEpisodesUrl(moreLinksObj.moreLinks[index]);

    var dl = new Downloader();
    dl.on('data', function(obj) {
      parseMoreLink(moreLinksObj, obj);
    });

    dl.download(urlObj);
  };

  var parseMoreLink = function(moreLinksObj, obj) {
    var parsedObj = Parser.parseMoreEpisodes(obj);
    db.query(parsedObj.logTitlesCmd(),function() {
      db.query(parsedObj.logAppearancesCmd(),function() {
        moreLinksObj.moreLinksDone++;
        if (moreLinksObj.moreLinksDone === moreLinksObj.moreLinks.length) {
          markProcessed(moreLinksObj.moreLinks[0].actorId);
        }
      });
    });
  };

  var markProcessed = function(actorId) {
    db.query(setProcessed(actorId), function() {
      done++;
      if (done === total) {
        checkUnprocessed();
      }
    });
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