'use strict';

var config = require('./config');
var db = require('./lib/db')(config.mysql);
var queries = require('./lib/queries')(db);

var scrapers = require('./scrapers')(config, db, queries);

scrapers.runBaseTitles().then(() => {
  db.end();
});
