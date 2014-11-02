var moment = require('moment');

var UrlBuilder = function() {

  var baseURL = 'http://www.imdb.com/';
  
  this.getTitleUrl = function(id) {
    return {
      action: 'getTitleUrl',
      titleId: id,
      getUrl: function() {
        return baseURL + 'title/' + this.titleId + '/';
      }
    };
  };

  this.getSeasonsUrl = function(id,season) {
    var startSeason = (typeof season !== 'undefined') ? season : 1;
    return {
      action: 'getSeasonsUrl',
      titleId: id,
      season: startSeason,
      maxSeason: startSeason,
      getUrl: function() {
        return baseURL + 'title/' + this.titleId + '/episodes?season=' + this.season;
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
      action: 'getTitleCreditsUrl',
      titleId: id,
      getUrl: function() {
        return baseURL + 'title/' + this.titleId + '/fullcredits';
      }
    };
  };

  this.getActorCreditsUrl = function(id) {
    return {
      action: 'getActorCreditsUrl',
      actorId: id,
      getUrl: function() {
        return baseURL + 'name/' + this.actorId + '/';
      }
    };
  };

  this.getMoreEpisodesUrl = function(moreLinkObj) {
    return {
      action: 'getMoreEpisodesUrl',
      moreLinkObj: moreLinkObj,
      getUrl: function() {
        return baseURL + 'name/' + moreLinkObj.actorId +'/episodes/_ajax?' +
          'title=' + moreLinkObj.titleId +
          '&category=' + moreLinkObj.category + 
          '&credit_index=' + moreLinkObj.credit_index;
      }
    };
  };

};

module.exports = UrlBuilder;
