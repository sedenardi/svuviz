var cheerio = require('cheerio'),
  moment = require('moment'),
  util = require('util'),
  events = require('events');

var Parser = function() {

  var self = this;
  
  var parse = function(obj) {
    return newObj = {
      $: cheerio.load(obj.data),
      url: obj.url
    };
  };
  
  this.parsePage = function(rawObj) {
    var obj = parse(rawObj);
    self.emit('parsed', tableObj);
  };
};

util.inherits(Parser, events.EventEmitter);

module.exports = Parser;
