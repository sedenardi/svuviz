'use strict';

var mysql = require('mysql');
var Promise = Promise || require('bluebird');
var logger = require('./logger');

module.exports = function(config) {
  var pool = mysql.createPool(config);
  var queryCallback = function(queryArray, cb) {
    if (queryArray.length < 2) { queryArray.push([]); }
    pool.query(queryArray[0], queryArray[1], (err, res) => {
      if (err) {
        if (err.code === 'ER_LOCK_DEADLOCK') {
          logger.log({
            caller: 'DB',
            message: 'Deadlock'
          });
          setTimeout(() => {
            queryCallback(queryArray, cb);
          }, Math.floor(Math.random() * 1000));
        } else {
          return cb(err);
        }
      } else {
        cb(err, res);
      }
    });
  };
  return {
    query: function(queryArray) {
      return new Promise((resolve, reject) => {
        queryCallback(queryArray, (err, res) => {
          if (err) { return reject(err); }
          return resolve(res);
        });
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
