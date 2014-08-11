var moment = require('moment');

var UrlBuilder = function() {

  var baseURL = 'http://www.imdb.com/';
  
  this.getTitleUrl = function(id) {
    return {
      titleId: id,
      getUrl: function() {
        return baseURL + '/title/' + this.titleId + '/';
      }
    };    
  };

};

module.exports = UrlBuilder;
