var logger = require('./logger.js'),
  request = require('request'),
  util = require('util'),
  events = require('events');

var Downloader = function() {

  var self = this;  
  
  this.download = function(url, attempt) {
    if (typeof attempt === 'undefined') attempt = 1;
    request({
      url: url.getUrl(),
      timeout: 30000
    }, function (error, response, body) {
      if (error) {
        logger.log({
          caller: 'Downloader',
          message: 'error',
          params: {
            url: url,
            uri: url.getUrl(),
            attempt: attempt
          },
          data: error
        });
        if (error.code === 'ETIMEDOUT') {
          if (attempt < 10) {
            var timeout = attempt * 15000;
            setTimeout(function permitRetry(){
              self.download(url, attempt + 1);
            },timeout);
          } else {
            setTimeout(function waitLonger() {
              self.download(url);
            },600000);
          }
        }
        return;
      } else if (response.statusCode !== 200) {
        self.emit('error', {
          caller: 'Downloader',
          message: 'error',
          params: {
            url: url,
            uri: url.getUrl(),
            attempt: attempt
          },
          data: response
        });
        return;
      }
      self.emit('data', {
        url: url,
        data: body
      });
    });
  };
  
};

util.inherits(Downloader, events.EventEmitter);

module.exports = Downloader;
