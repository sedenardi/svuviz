'use strict';

var urlBuilder = require('../lib/urlBuilder');
var dl = require('../lib/downloader')();
var parser = require('../lib/parser');
var logger = require('../lib/logger');
var _ = require('lodash');

var unprocessedQuery = ['select * from ProcessActors limit 50;'];
var setProcessedQuery = function(actorId) {
  return [
    'delete from ProcessActors where ActorID = ?;',
    [actorId]
  ];
};
var redirectActorQuery = function(oldActorId, newActorId) {
  var sql = `
  delete from Appearances where ActorID = ?;
  delete from Actors where ActorID = ?;
  insert into ProcessActors(ActorID) select ?;`;
  return [sql, [oldActorId, oldActorId, newActorId]];
};

var ActorCredits = function(db) {
  this.db = db;
};

ActorCredits.prototype.downloadMoreLink = function(moreLink) {
  var urlObj = urlBuilder.getMoreEpisodesUrl(moreLink);
  return dl.get(urlObj).then((body) => {
    var parsedObj = parser.parseMoreEpisodes({ url: urlObj, data: body });
    return this.db.query(parsedObj.logTitlesCmd()).then(() => {
      return this.db.query(parsedObj.logAppearancesCmd());
    });
  }).then(() => {
    return this.db.query(setProcessedQuery(moreLink.actorId));
  });
};

ActorCredits.prototype.downloadCredits = function(actorId) {
  var urlObj = urlBuilder.getActorCreditsUrl(actorId);
  return dl.get(urlObj).then((body) => {
    var parsedObj = parser.parseActorCreditsPage({ url: urlObj, data: body });
    if (parsedObj.actorIsRedirected()) {
      return this.db.query(redirectActorQuery(actorId, parsedObj.retActorId));
    }
    if (!parsedObj.credits.length) {
      return Promise.resolve();
    }
    return this.db.query(parsedObj.logTitlesCmd()).then(() => {
      return this.db.query(parsedObj.logAppearancesCmd());
    }).then(() => {
      var moreLinks = parsedObj.getMoreLinks();
      if (!moreLinks.length) {
        return Promise.resolve();
      }
      var actions = _.map(moreLinks.length, (l) => {
        return this.downloadMoreLink(l);
      });
      return Promise.all(actions);
    });
  }).then(() => {
    return this.db.query(setProcessedQuery(actorId));
  });
};

ActorCredits.prototype.start = function() {
  return this.db.query(unprocessedQuery).then((res) => {
    logger.log({
      caller: 'ActorCredits',
      message: `Found ${res.length} unprocessed actors`
    });
    if (!res.length) {
      return Promise.resolve();
    }
    var actions = _.map(res, (r) => {
      return this.downloadCredits(r.ActorID);
    });
    return Promise.all(actions).then(() => {
      return this.start();
    });
  });
};

module.exports = ActorCredits;
