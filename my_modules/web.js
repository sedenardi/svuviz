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

  app.get('/svuInfo.json', function (req, res) {
    var svuInfo = queries.svuInfo();
    db.query(svuInfo.cmd, function(dbRes) {
      res.json(svuInfo.process(dbRes));
    });
  });

  app.get('/commonInfo.json', function (req, res) {
    var commonInfo = queries.commonInfo();
    db.query(commonInfo.cmd, function(dbRes) {
      res.json(commonInfo.process(dbRes));
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
