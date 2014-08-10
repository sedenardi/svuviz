var util = require('util');

var log = function(logObj, db) {
  toConsole(logObj);
  if (typeof db !== 'undefined') {
    toDB(logObj, db);
  }
};

var formatDate = function(date) {
  return date.getFullYear() + '-' + 
    (date.getMonth() + 1) + '-' + 
    date.getDate() + ' ' + 
    date.getHours() + ':' + 
    date.getMinutes() + ':' + 
    date.getSeconds() + ':' + 
    date.getMilliseconds();
};

var toConsole = function(logObj) {
  var msg = 'Time:    ' +  formatDate(new Date());
  if (logObj.caller) msg += '\nCaller:  ' + logObj.caller;
  if (logObj.message) msg += '\nMessage: ' + logObj.message;
  if (logObj.params) msg += '\nParams:  ' + JSON.stringify(logObj.params);
  if (logObj.data) msg += '\nData:    ' + JSON.stringify(logObj.data);
  msg += '\n' + util.inspect(process.memoryUsage());
  console.log(msg + '\n');
};

var toDB = function(logObj, db) {
  var ins = 'Insert into Log(Caller';
  var params = 'Select ?';
  var inserts = [logObj.caller];
  if (logObj.message) {
    ins += ',Message';
    params += ',?';
    inserts.push(logObj.message);
  }
  if (logObj.params) {
    ins += ',Params';
    params += ',?';
    inserts.push(JSON.stringify(logObj.params));
  }
  if (logObj.data) {
    ins += ',Data';
    params += ',?';
    inserts.push(JSON.stringify(logObj.data));
  }
  var cmd = {
    sql: ins + ') ' + params + ';',
    inserts: inserts
  };
  db.query(cmd);
};

module.exports.log = log;
