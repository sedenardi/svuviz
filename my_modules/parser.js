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
  
  this.parseTitlePage = function(rawObj) {
    var obj = parse(rawObj);
    var titleId = obj.url.titleId;
    var title = obj.$('.header').first().find('span[itemprop="name"]').first().text();
    var parentTitleId = null;
    
    if (obj.$('.tv_header').get().length) {
      var parentUrl = obj.$('.tv_header').first().find('a').first().attr('href');
      var parts = parentUrl.split('/');
      parentTitleId = parts[1];
    }
    
    var titleObj = {
      titleId: titleId,
      parentTitleId: parentTitleId,
      title: title,
      logCmd: function() {
        var sql = 'Insert into Titles(TitleID,ParentTitleID,Title) Select * from (select ? as `TitleID`,? as `ParentTitleID`,? as `Title`) t1 where not exists (select 1 from Titles t where t.TitleID = t1.TitleID);';
        return {
          sql: sql,
          inserts: [this.titleId, this.parentTitleId, this.title]
        };
      }
    };
    self.emit('parsed', titleObj);
  };
};

util.inherits(Parser, events.EventEmitter);

module.exports = Parser;
