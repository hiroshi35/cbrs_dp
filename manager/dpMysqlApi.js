"use strict";
var util = require("./util");
var mysql = require("mysql");
var config = require("../config");
var path = require("path");
var log4js = require("log4js");
var logger = log4js.getLogger(path.basename(__filename));
logger.level = config.log.level;

function mysql_connect(db) {
  const opt = {
    host: config.db.host,
    user: config.db.user,
    password: config.db.pwd,
    database: db
  };

  return new Promise((resolve, reject) => {
    const connection = mysql.createConnection(opt);
    connection.connect((err) => {
      if (err) {
        //logger.error(err.stack);
        logger.error("Fail mysql connection");
        connection.end();
        reject(err);
      }
      resolve(connection);
    });
  });
}

exports.sqlquery = (sqlStr, db, input) => {
  if (util.check_sqlStr(sqlStr)) {
    logger.error("Invalid String");
    return Promise.reject(new Error("Invalid String"));
  }

  return new Promise((resolve, reject) => {
    mysql_connect(db)
    .then((connection)=>{
      connection.query(sqlStr, (err, result) => {
        var obj = [];
        if (err) {
          if (util.check_sqlStr(input)) {
            logger.error('No SQL String');
            obj.push(input);
            reject(err);
            return;
          }
          reject(err);
          connection.end();
          return;
        }
        logger.debug("sql query success" + JSON.stringify(result));
        obj.push(input);
        obj.push(result);
        resolve(obj);
        connection.end();
        return;
      })
    })
    .catch((err) => {
      logger.error(err);
      reject(new Error("Error in query mysql"));
      return;
    })
  });
};