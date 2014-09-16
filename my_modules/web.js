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
      res.json(showInfo.process(dbRes));
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
