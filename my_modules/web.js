var events = require('events'),
  express = require('express'),
  compression = require('compression'),
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
  app.use(compression({
    threshold: 512
  }));

  app.get('/showInfo.json', function (req, res) {
    if (typeof req.query.BaseTitleID === 'undefined') {
      res.status(400).json({ error: 'Must specify BaseTitleID.'});
      return;
    }
    var showInfo = queries.showInfo(req.query.BaseTitleID);
    db.query(showInfo.cmd, function(dbRes) {
      var info = showInfo.process(dbRes[3]);
      res.json(info.tArray);
    });
  });

  app.get('/showInfoArray.json', function (req, res) {
    if (typeof req.query.BaseTitleID === 'undefined') {
      res.status(400).json({ error: 'Must specify BaseTitleID.'});
      return;
    }
    var showInfo = queries.showInfoArray(req.query.BaseTitleID);
    db.query(showInfo.cmd, function(dbRes) {
      var info = showInfo.process(dbRes[3]);
      res.json(info.tArray);
    });
  });

  app.get('/getColorCutoffs.json', function (req, res) {
    if (typeof req.query.BaseTitleID === 'undefined') {
      res.status(400).json({ error: 'Must specify BaseTitleID.'});
      return;
    }
    var showInfo = queries.getColorCutoffs(req.query.BaseTitleID);
    db.query(showInfo, function(dbRes) {
      var cutoffs = [dbRes[8][0].first, dbRes[8][0].second, dbRes[8][0].third];
      res.json(cutoffs);
    });
  });

  app.get('/filterTitles.json', function (req, res) {
    if (typeof req.query.BaseTitleID === 'undefined') {
      res.status(400).json({ error: 'Must specify BaseTitleID.'});
      return;
    }
    var filterTitles = queries.filterTitles(req.query.BaseTitleID);
    db.query(filterTitles, function(dbRes) {
      res.json(dbRes);
    });
  });

  app.get('/filterTitlesArray.json', function (req, res) {
    if (typeof req.query.BaseTitleID === 'undefined') {
      res.status(400).json({ error: 'Must specify BaseTitleID.'});
      return;
    }
    var filterTitles = queries.filterTitlesArray(req.query.BaseTitleID);
    db.query(filterTitles.cmd, function(dbRes) {
      res.json(filterTitles.process(dbRes));
    });
  });

  app.get('/allInfo.json', function (req, res) {
    if (typeof req.query.BaseTitleID === 'undefined') {
      res.status(400).json({ error: 'Must specify BaseTitleID.'});
      return;
    }
    var showInfoQuery = queries.showInfoArray(req.query.BaseTitleID);
    db.query(showInfoQuery.cmd, function(dbResA) {
      var showInfo = showInfoQuery.process(dbResA[3]).tArray;
      var filterTitlesQuery = queries.filterTitlesArray(req.query.BaseTitleID);
      db.query(filterTitlesQuery.cmd, function(dbResB) {
        var filterTitles = filterTitlesQuery.process(dbResB);
        var colorCutoffsQuery = queries.getColorCutoffs(req.query.BaseTitleID);
        db.query(colorCutoffsQuery, function(dbResC) {
          var colorCutoffs = [dbResC[8][0].first, dbResC[8][0].second, dbResC[8][0].third];
          res.json({
            showInfo: showInfo,
            filterTitles: filterTitles,
            colorCutoffs: colorCutoffs
          });
        });
      });
    });
  });

  // app.get('/actorsAndTitles.json', function (req, res) {
  //   var actorsAndTitles = queries.actorsAndTitles();
  //   db.query(actorsAndTitles.cmd, function(dbRes) {
  //     res.json(actorsAndTitles.process(dbRes));
  //   });
  // });

  // app.get('/commonalities.json', function (req, res) {
  //   var commonalities = queries.commonalities();
  //   db.query(commonalities.cmd, function(dbRes) {
  //     res.json(commonalities.process(dbRes));
  //   });
  // });

  // app.get('/all.json', function (req, res) {
  //   var showInfo = queries.showInfo();
  //   db.query(showInfo.cmd, function(dbRes) {
  //     var infoObj = showInfo.process(dbRes);
  //     var actorsAndTitles = queries.actorsAndTitles();
  //     db.query(actorsAndTitles.cmd, function(dbRes2) {
  //       var aTObj = actorsAndTitles.process(dbRes2);
  //       var commonalities = queries.commonalities();
  //       db.query(commonalities.cmd, function(dbRes3) {
  //         var comObj = commonalities.process(dbRes3);
  //         var allObj = {
  //           shows: infoObj.titles,
  //           actors: aTObj.actors,
  //           titles: aTObj.titles
  //         };
  //         for (var actor in allObj.actors) {
  //           if (typeof comObj.actors[actor] !== 'undefined') {
  //             allObj.actors[actor].Commonalities = comObj.actors[actor];
  //           }
  //         }
  //         res.json(allObj);
  //       });
  //     });
  //   });
  // });

  app.get('/getCommonActors.json', function (req, res) {
    if (typeof req.query.BaseTitleID === 'undefined') {
      res.status(400).json({ error: 'Must specify BaseTitleID.'});
      return;
    }
    if (typeof req.query.ActorID === 'undefined') {
      res.status(400).json({ error: 'Must specify ActorID.'});
      return;
    }
    var query = queries.getCommonActors(req.query.BaseTitleID, 
      req.query.ActorID, req.query.TitleID);
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
      res.status(400).json({ error: 'Must specify ActorID1.'});
      return;
    }
    if (typeof req.query.ActorID2 === 'undefined') {
      res.status(400).json({ error: 'Must specify ActorID2.'});
      return;
    }
    var query = queries.getCommonTitles(req.query.ActorID1,req.query.ActorID2);
    db.query(query, function(dbRes) {
      res.json(dbRes);
    });
  });

  app.get('/getActorInfo.json', function (req, res) {
    if (typeof req.query.ActorID === 'undefined') {
      res.status(400).json({ error: 'Must specify ActorID.'});
      return;
    }
    var query = queries.getActorInfo(req.query.ActorID);
    db.query(query, function(dbRes) {
      res.json(dbRes);
    });
  });

  app.get('/getTitleActors.json', function (req, res) {
    if (typeof req.query.BaseTitleID === 'undefined') {
      res.status(400).json({ error: 'Must specify BaseTitleID.'});
      return;
    }
    if (typeof req.query.TitleID === 'undefined') {
      res.status(400).json({ error: 'Must specify TitleID.'});
      return;
    }
    var query = queries.getTitleActors(req.query.BaseTitleID, req.query.TitleID);
    db.query(query, function(dbRes) {
      var array = [];
      for (var i = 0; i < dbRes.length; i++) {
        array.push(dbRes[i].ActorID);
      }
      res.json(array);
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
