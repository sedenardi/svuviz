'use strict';

var Handlebars = require('handlebars');
var fs = require('bluebird').promisifyAll(require('fs'));

module.exports = function(viewsDir) {
  return {
    render: function(view, data) {
      var fileName = `${viewsDir}/${view}.handlebars`;
      return fs.readFileAsync(fileName).then((source) => {
        var template = Handlebars.compile(source.toString());
        var result = template(data);
        return Promise.resolve(result);
      });
    }
  };
};
