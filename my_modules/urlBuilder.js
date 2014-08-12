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

  this.getSeasonsUrl = function(id) {
    return {
      titleId: id,
      season: 1,
      maxSeason: 1,
      getUrl: function() {
        return baseURL + '/title/' + this.titleId + '/episodes?season=' + this.season;
      },
      hasNextSeason: function() {
        return this.season < this.maxSeason;
      },
      getNextSeason: function() {
        if (this.hasNextSeason()) {
          return {
            titleId: this.titleId,
            season: this.season + 1,
            maxSeason: this.maxSeason,
            getUrl: this.getUrl,
            setMaxSeason: this.setMaxSeason,
            hasNextSeason: this.hasNextSeason,
            getNextSeason: this.getNextSeason
          };
        }
      }
    };
  };

  this.getTitleCreditsUrl = function(id) {
    return {
      titleId: id,
      getUrl: function() {
        return baseURL + '/title/' + this.titleId + '/fullcredits';
      }
    };
  };

  this.getActorCreditsUrl = function(id) {
    return {
      actorId: id,
      getUrl: function() {
        return baseURL + '/name/' + this.actorId + '/';
      }
    };
  };

};

module.exports = UrlBuilder;
