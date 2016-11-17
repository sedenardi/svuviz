'use strict';

var config = require('./config');
var db = require('./lib/db')(config.mysql);
var queries = require('./lib/queries')(db);
var S3 = require('./lib/s3')(config);

var scrapers = require('./scrapers')(db, queries, S3);
var endpoints = require('./endpoints')(config, queries, S3);

module.exports = {
  runBaseTitles: (event, context) => {
    scrapers.runBaseTitles().then(() => { context.done(); });
  },
  queueAllActors: (event, context) => {
    scrapers.queueAllActors().then(() => { context.done(); });
  },
  web: (event, context) => {
    var path = (event.resourcePath || '').replace('/', '') || 'index';
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
