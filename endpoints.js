'use strict';

var path = require('path');
var Hbars = require('./lib/hbars');
var _ = require('lodash');

module.exports = function(config, queries) {
  var viewsDir = path.resolve(__dirname, config.app.folders.views);
  var hbars = Hbars(viewsDir);

  return {
    index: (params) => {
      params = params || {};
      var baseTitleId = params.BaseTitleID || 'tt0203259';
      return queries.baseTitles().then((baseTitles) => {
        baseTitles = _.map(baseTitles, (t) => {
          t.active = t.BaseTitleID === baseTitleId;
          return t;
        });
        var activeBaseTitle = _.find(baseTitles, { active: true });
        if (!activeBaseTitle) {
          return Promise.resolve('Base Title Not Found!');
        }
        return hbars.render('index', {
          layout: false,
          baseTitles: baseTitles,
          activeBaseTitleId: baseTitleId,
          activeDisplayName: activeBaseTitle.DisplayName,
          activeTitleName: activeBaseTitle.TitleName
        });
      });
    },
    CommonActors: (params) => {
      return queries.getCommonActors(params.BaseTitleID, params.ActorID, params.TitleID);
    },
    CommonTitles: (params) => {
      return queries.getCommonTitles(params.ActorID1, params.ActorID2);
    },
    ActorInfo: (params) => {
      return queries.getActorInfo(params.ActorID);
    },
    TitleActors: (params) => {
      return queries.getTitleActors(params.BaseTitleID, params.TitleID);
    }
  };
};
