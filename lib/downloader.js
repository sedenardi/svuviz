'use strict';

var Promise = Promise || require('bluebird');
var request = require('request');
var uuid = require('uuid');
var logger = require('./logger');

module.exports = function() {
  var jar = request.jar();
  request = request.defaults({
    timeout: 3000,
    gzip: false,
    jar: jar
  });
  var getCallback = function(url, cb) {
    request({
      url: url,
      headers: {
        'User-Agent': uuid.v4(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      }
    }, function(err, res, body) {
      if (err || res.statusCode !== 200) {
        if (err && err.code === 'ESOCKETTIMEDOUT') {
          logger.log({
            caller: 'Request',
            message: 'Timeout'
          });
          setTimeout(() => {
            getCallback(url, cb);
          }, Math.floor(Math.random() * 1000));
        } else {
          cb((err || res.statusCode));
        }
      } else {
        cb(null, body);
      }
    });
  };
  return {
    get: function(url) {
      return new Promise(function(resolve, reject) {
        getCallback(url.getUrl(), (err, body) => {
          if (err) { return reject(err); }
          return resolve(body);
        });
      });
    }
  };
};
