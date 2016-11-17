'use strict';

var Handlebars = require('handlebars');
var fs = require('bluebird').promisifyAll(require('fs'));

module.exports = function(opts) {
  return {
    render: function(view, data) {
      var get;
      if (opts.viewsDir) {
        var fileName = `${opts.viewsDir}/${view}.handlebars`;
        get = fs.readFileAsync(fileName);
      } else if (opts.S3) {
        get = opts.S3.getObject(`${view}.handlebars`);
      }
      return get.then((source) => {
        var template = Handlebars.compile(source.toString());
        var result = template(data);
        return Promise.resolve(result);
      });
    }
  };
};
