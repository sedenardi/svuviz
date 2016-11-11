'use strict';

var Promise = Promise || require('bluebird');
var request = require('request');
var uuid = require('uuid');

module.exports = function() {
  var jar = request.jar();
  request = request.defaults({
    timeout: 30000,
    gzip: true,
    jar: jar
  });
  return {
    get: function(url, attempt) {
      attempt = attempt || 1;
      return new Promise(function(resolve, reject) {
        request({
          url: url.getUrl(),
          headers: {
            'User-Agent': uuid.v4(),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
          }
        }, function(err, res, body) {
          if (err || res.statusCode !== 200) {
            return reject((err || res.statusCode));
          }
          if (body.indexOf('id="waiting-main"') !== -1 || body.indexOf('Access Denied') !== -1) {
            return reject(new Error('Throttled'));
          }
          return resolve(body);
        });
      });
    }
  };
};
