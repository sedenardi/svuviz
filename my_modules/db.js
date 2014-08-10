var mysql = require('mysql'),
  logger = require('./logger.js');

var DB = function(config){

  var self = this;
  var connection;
  
  this.connect = function(caller, next) {
    handleDisconnect(caller,next);
  };

  var handleDisconnect = function(caller, next) {
    connection = mysql.createConnection(config.mysql);

    connection.connect(function(err) {
      if(err) {
        logger.log({
          caller: 'MYSQL',
          message: err
        });
        setTimeout(self.handleDisconnect(config,'self',next), 2000);
      } else {
        logger.log({
          caller: 'MYSQL',
          message: 'Connected',
          data: { caller: caller }
        });
        if (typeof next === 'function')
          next();
      }
    });
    connection.on('error', function(err) {
      logger.log({
        caller: 'MYSQL',
        message: err,
        data: { caller: caller }
      });
      if(err.code === 'PROTOCOL_CONNECTION_LOST') {
        handleDisconnect(caller);
      } else {
        throw err;
      }
    });
  };  

  this.disconnect = function() {
    connection.end(function (err) {
      if (err) {
        logger.log({
          caller: 'MYSQL',
          message: 'Disconnect',
          data: err
        });
      } else {
        logger.log({
          caller: 'MYSQL',
          message: 'Disconnect'
        });
      }
    });
  };

  /**** FUNCTIONS ****/
  this.query = function(cmd, next) {
    var sql = connection.format(cmd.sql, cmd.inserts);
    connection.query(sql, function(err, res) {
      if (err) {
        console.log('MYSQL: ' + sql + ' \n' + err);
        logger.log({
          caller: 'MYSQL',
          message: err,
          data: sql
        });
      } else if (typeof next === 'function') {
        next(res);
      }
    });
  };

  this.queryHandleError = function(cmd, next) {
    var sql = connection.format(cmd.sql, cmd.inserts);
    connection.query(sql, next);
  };
  
};

/***** EXPORTS *****/
module.exports = DB;
