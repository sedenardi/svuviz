'use strict';

var urlBuilder = require('../lib/urlBuilder');
var dl = require('../lib/downloader')();
var parser = require('../lib/parser');

var TitleGrabber = function(db, titleId) {
  this.db = db;
  this.titleId = titleId;
};

TitleGrabber.prototype.titleExistsQuery = function() {
  return [
    'Select * from Titles where TitleID = ?;',
    [this.titleId]
  ];
};

TitleGrabber.prototype.download = function() {
  var urlObj = urlBuilder.getTitleUrl(this.titleId);
  return dl.get(urlObj).then((body) => {
    var parsed = parser.parseTitlePage({url: urlObj, data: body});
    return this.db.query(parsed.logCmd());
  });
};

TitleGrabber.prototype.start = function() {
  return this.db.query(this.titleExistsQuery()).then((res) => {
    if (res.length) {
      return Promise.resolve();
    } else {
      return this.download();
    }
  });
};

module.exports = TitleGrabber;
