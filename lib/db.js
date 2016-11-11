'use strict';

var mysql = require('mysql');
var Promise = Promise || require('bluebird');

module.exports = function(config) {
  var pool = mysql.createPool(config);
  return {
    query: function(queryArray) {
      if (queryArray.length < 2) { queryArray.push([]); }
      return new Promise((resolve, reject) => {
        pool.query(queryArray[0], queryArray[1], (err, res) => {
          if (err) { return reject(err); }
          return resolve(res);
        });
      });
    },
    queryCallback: function(queryArray, cb) {
      if (queryArray.length < 2) { queryArray.push([]); }
      pool.query(queryArray[0], queryArray[1], (err, res) => {
        cb(err, res);
      });
    },
    end: function() {
      return new Promise((resolve, reject) => {
        pool.end((err) => {
          if (err) { return reject(err); }
          console.log('Database Closed.');
          return resolve();
        });
      });
    }
  };
};
