'use strict';

var config = require('./config');
var db = require('./lib/db')(config.mysql);
var queries = require('./lib/queries')(db);

var scrapers = require('./scrapers')(config, db, queries);
var endpoints = require('./endpoints')(config, queries);

module.exports = {
  runBaseTitles: (event, context) => {
    scrapers.runBaseTitles().then(() => { context.done(); });
  },
  queueAllActors: (event, context) => {
    scrapers.queueAllActors().then(() => { context.done(); });
  },
  web: (event, context) => {
    var path = (event.resourcePath || 'index').replace('/', '');
    if (endpoints[path]) {
      endpoints[path](event.query).then((res) => {
        context.done(null, res);
      }).catch((err) => {
        context.done(err);
      });
    } else {
      context.done(null, {});
    }
  }
};
