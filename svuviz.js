'use strict';

var config = require('./config');
var db = require('./lib/db')(config.mysql);
var queries = require('./lib/queries')(db);
var S3 = require('./lib/s3')(config);

var scrapers = require('./scrapers')(db, queries, S3);

scrapers.runActorCredits().then(() => {
  db.end();
});
