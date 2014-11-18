var logger = require('./logger.js'),
  Downloader = require('./downloader.js'),
  Parser = require('./parser.js'),
  UrlBuilder = require('./urlBuilder.js'),
  TitleGrabber = require('./titleGrabber.js'),
  DB = require('./db.js'),
  moment = require('moment'),
  util = require('util'),
  events = require('events');

var BaseShowScraper = function(config, baseId, firstSeason) {
  
  var self = this;
  var db = new DB(config);
  var url = new UrlBuilder();

  var lastSeasonQuery = function() {
    var sql = 'select coalesce(max(Season),1) as LastSeason from Titles t where ParentTitleID = ?;';
    return {
      sql: sql,
      inserts: [baseId]
    };
  };
  
  this.start = function() {
    var baseGrabber = new TitleGrabber(config);
    baseGrabber.on('done', startSeasons);
    baseGrabber.start(baseId);
  };
  
  var startSeasons = function() {
    db.connect('BaseShowScraper', function() {
      if (typeof firstSeason !== 'undefined' && firstSeason) {
        var season = 1;
        var seasonUrl = url.getSeasonsUrl(baseId, season);
        downloadSeason(seasonUrl);
      } else {
        db.query(lastSeasonQuery(baseId), function(dbRes) {
          var season = dbRes[0].LastSeason;
          var seasonUrl = url.getSeasonsUrl(baseId, season);
          downloadSeason(seasonUrl);
        });
      }
    });
  };

  var downloadSeason = function(seasonUrl) {
    var dl = new Downloader();
    dl.on('data', function(obj) {
      parseSeason(obj);
    });

    dl.download(seasonUrl);
  };

  var parseSeason = function(obj) {
    var p = new Parser();
    p.on('parsed', function(parsedObj) {
      logger.log({
        caller: 'Parser',
        message: 'parsed',
        params: parsedObj.url
      });
      logParsedTitles(parsedObj);
    });
    p.parseSeasonPage(obj);
  };

  var logParsedTitles = function(parsedObj) {
    var cmd = parsedObj.logCmd();
    db.query(cmd, function() {
      var processCmd = parsedObj.logToProcess()
      db.query(processCmd, function() {
        if (parsedObj.url.hasNextSeason()) {
          var nextSeason = parsedObj.url.getNextSeason();
          downloadSeason(nextSeason);
        } else {
          self.emit('done', baseId);
        }
      });
    });
  };

};

util.inherits(BaseShowScraper, events.EventEmitter);

module.exports = BaseShowScraper;
