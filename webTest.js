'use strict';

var config = require('./config');
var db = require('./lib/db')(config.mysql);
var queries = require('./lib/queries')(db);
var Web = require('./lib/web');

var web = new Web(config, queries);

web.startServer();
