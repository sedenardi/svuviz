var events = require('events'),
  express = require('express'),
  hbars = require('./hbars.js'),
  util = require('util'),
  DB = require('./db.js'),
  logger = require('./logger.js'),
  queries = require('./queries.js');

var Web = function(config) {

  var self = this;
  var db = new DB(config);
  var rootDir = process.cwd();
  
  var app = express(),
    hbs = new hbars(rootDir, config);

  app.engine('handlebars', hbs.hbs.engine);

  app.set('views', rootDir + '/web/views');
  app.set('view engine', 'handlebars');
  app.use(express.static(rootDir + config.web.folders.static));

  app.get('/showInfo.json', function (req, res) {
    var showInfo = queries.showInfo();
    db.query(showInfo.cmd, function(dbRes) {
      var info = showInfo.process(dbRes);
      res.json(info.tArray);
    });
  });

  app.get('/filterTitles.json', function (req, res) {
    var filterTitles = queries.filterTitles();
    db.query(filterTitles, function(dbRes) {
      res.json(dbRes);
    });
  });

  app.get('/actorsAndTitles.json', function (req, res) {
    var actorsAndTitles = queries.actorsAndTitles();
    db.query(actorsAndTitles.cmd, function(dbRes) {
      res.json(actorsAndTitles.process(dbRes));
    });
  });

  app.get('/commonalities.json', function (req, res) {
    var commonalities = queries.commonalities();
    db.query(commonalities.cmd, function(dbRes) {
      res.json(commonalities.process(dbRes));
    });
  });

  app.get('/all.json', function (req, res) {
    var showInfo = queries.showInfo();
    db.query(showInfo.cmd, function(dbRes) {
      var infoObj = showInfo.process(dbRes);
      var actorsAndTitles = queries.actorsAndTitles();
      db.query(actorsAndTitles.cmd, function(dbRes2) {
        var aTObj = actorsAndTitles.process(dbRes2);
        var commonalities = queries.commonalities();
        db.query(commonalities.cmd, function(dbRes3) {
          var comObj = commonalities.process(dbRes3);
          var allObj = {
            shows: infoObj.titles,
            actors: aTObj.actors,
            titles: aTObj.titles
          };
          for (var actor in allObj.actors) {
            if (typeof comObj.actors[actor] !== 'undefined') {
              allObj.actors[actor].Commonalities = comObj.actors[actor];
            }
          }
          res.json(allObj);
        });
      });
    });
  });

  app.get('/getCommonActors.json', function (req, res) {
    if (typeof req.query.ActorID === 'undefined') {
      res.json(402, { error: 'Must specify ActorID.'});
    }
    var query = queries.getCommonActors(req.query.ActorID);
    db.query(query, function(dbRes) {
      var array = [];
      for (var i = 0; i < dbRes.length; i++) {
        array.push(dbRes[i].ActorID);
      }
      res.json(array);
    });
  });

  app.get('/getCommonTitles.json', function (req, res) {
    if (typeof req.query.ActorID1 === 'undefined') {
      res.json(402, { error: 'Must specify ActorID1.'});
    }
    if (typeof req.query.ActorID2 === 'undefined') {
      res.json(402, { error: 'Must specify ActorID2.'});
    }
    var query = queries.getCommonTitles(req.query.ActorID1,req.query.ActorID2);
    db.query(query, function(dbRes) {
      res.json(dbRes);
    });
  });

  app.get('/getActorInfo.json', function (req, res) {
    if (typeof req.query.ActorID === 'undefined') {
      res.json(402, { error: 'Must specify ActorID.'});
    }
    var query = queries.getActorInfo(req.query.ActorID);
    db.query(query, function(dbRes) {
      res.json(dbRes);
    });
  });

  this.startServer = function() {
    db.connect('Express', function webDB() {
      app.listen(config.web.port, function webStarted() {
        logger.log({
          caller: 'Express',
          message: 'Web server started',
          params: { port: config.web.port }
        });
      });
    });
  };
  
};

util.inherits(Web, events.EventEmitter);

module.exports = Web;
