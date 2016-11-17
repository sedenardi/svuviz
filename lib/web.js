'use strict';

var express = require('express');
var compression = require('compression');
var path = require('path');
var logger = require('./logger.js');

var Web = function(config, queries) {
  this.app = express();
  this.config = config;

  var staticDir = path.resolve(__dirname, '../', config.app.folders.static);
  console.log(staticDir);
  this.app.use(express.static(staticDir));
  this.app.use(compression({ threshold: 512 }));

  var viewsDir = path.resolve(__dirname, '../', config.app.folders.views);
  console.log(viewsDir);
  var hbars = require('./hbars')({ viewsDir: viewsDir });

  this.app.get('/', function (req, res) {
    var activeBaseTitleId = 'tt0203259';
    if (typeof req.query.BaseTitleID !== 'undefined') {
      activeBaseTitleId = req.query.BaseTitleID;
    }
    queries.baseTitles().then((dbRes) => {
      var activeDisplayName = '',
          activeTitleName = '';
      for (var i = 0; i < dbRes.length; i++) {
        if (dbRes[i].BaseTitleID === activeBaseTitleId) {
          activeDisplayName = dbRes[i].DisplayName;
          activeTitleName = dbRes[i].TitleName;
          dbRes[i].active = true;
        } else {
          dbRes[i].active = false;
        }
      }
      if (activeDisplayName === '') {
        res.status(400).json({ error: 'Bad BaseTitleID specified.'});
        return;
      }
      hbars.render('index', {
        layout: false,
        baseTitles: dbRes,
        activeBaseTitleId: activeBaseTitleId,
        activeDisplayName: activeDisplayName,
        activeTitleName: activeTitleName
      }).then((html) => {
        res.send(html);
      }).catch((err) => {
        res.send(err);
      });
    });
  });

  this.app.get('/CommonActors', function (req, res) {
    if (typeof req.query.BaseTitleID === 'undefined') {
      res.status(400).json({ error: 'Must specify BaseTitleID.'});
      return;
    }
    if (typeof req.query.ActorID === 'undefined') {
      res.status(400).json({ error: 'Must specify ActorID.'});
      return;
    }
    queries.getCommonActors(req.query.BaseTitleID, req.query.ActorID, req.query.TitleID).then((actors) => {
      res.json(actors);
    });
  });

  this.app.get('/CommonTitles', function (req, res) {
    if (typeof req.query.ActorID1 === 'undefined') {
      res.status(400).json({ error: 'Must specify ActorID1.'});
      return;
    }
    if (typeof req.query.ActorID2 === 'undefined') {
      res.status(400).json({ error: 'Must specify ActorID2.'});
      return;
    }
    queries.getCommonTitles(req.query.ActorID1, req.query.ActorID2).then((titles) => {
      res.json(titles);
    });
  });

  this.app.get('/ActorInfo', function (req, res) {
    if (typeof req.query.ActorID === 'undefined') {
      res.status(400).json({ error: 'Must specify ActorID.'});
      return;
    }
    queries.getActorInfo(req.query.ActorID).then((actors) => {
      res.json(actors);
    });
  });

  this.app.get('/TitleActors', (req, res) => {
    if (typeof req.query.BaseTitleID === 'undefined') {
      res.status(400).json({ error: 'Must specify BaseTitleID.'});
      return;
    }
    if (typeof req.query.TitleID === 'undefined') {
      res.status(400).json({ error: 'Must specify TitleID.'});
      return;
    }
    queries.getTitleActors(req.query.BaseTitleID, req.query.TitleID).then((actors) => {
      res.json(actors);
    });
  });
};

Web.prototype.startServer = function() {
  this.app.listen(this.config.app.port, () => {
    logger.log({
      caller: 'Express',
      message: 'Web server started',
      params: { port: this.config.app.port }
    });
  });
};

module.exports = Web;
