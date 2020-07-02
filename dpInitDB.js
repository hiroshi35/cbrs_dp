"use strict";
var config = require("./config");
var mysql = require("mysql");
var path = require("path");
var log4js = require("log4js");
var logger = log4js.getLogger(path.basename(__filename));
logger.level = config.log.level;
var init = require("./dpInitDB");

function mysql_connect(db, cb) {
  var opt = {
    host: config.db.host,
    user: config.db.user,
    password: config.db.pwd
  };
  if (db) {
    opt.database = db;
  }

  var connection = mysql.createConnection(opt);
  connection.connect(function(err) {
    if (err) {
      logger.error(err.stack);
      logger.error("Fail mysql connection");
      connection.end();
      cb(err);
      return;
    }
    cb(connection);
    connection.end();
    //logger.debug(connection.threadId);
  });
}

exports.createDB = function(cb) {
  mysql_connect(null, function(connection) {
    var sqlStr = "CREATE DATABASE IF NOT EXISTS DP_Manage;";
    logger.debug(sqlStr);
    connection.query(sqlStr, function(err) {
      if (err) {
        logger.error("err");
        //logger.error(err);
        cb(err);
        return;
      }
      logger.debug("DP_Manage DB is created");
      //cb(null);
    });
  });

  mysql_connect("DP_Manage", function(connection) {
    var sqlStr =
      "CREATE TABLE IF NOT EXISTS Group_SC_info (cbsdSerialNumber VARCHAR(64) PRIMARY KEY, userId VARCHAR(16) NOT NULL, fccId VARCHAR(19) NOT NULL, callSign VARCHAR(16) NOT NULL, cbsdId VARCHAR(32) NOT NULL, grantCode INT NOT NULL,measCapability VARCHAR(64) NOT NULL, Category VARCHAR(1) NOT NULL, groupId VARCHAR(128) NOT NULL, groupType VARCHAR(128) NOT NULL, grantId VARCHAR(32) NOT NULL, hardwareVersion VARCHAR(64) NOT NULL, softWareVersion VARCHAR(64) NOT NULL, firmWareVersion VARCHAR(64) NOT NULL, lowFrequency INT(8) UNSIGNED NOT NULL, highFrequency INT(8) UNSIGNED NOT NULL, EARFCNDL INT(8) UNSIGNED NOT NULL, EARFCNUL INT(8) UNSIGNED NOT NULL, DLBandwidth INT(8) UNSIGNED NOT NULL, ULBandwidth INT(8) UNSIGNED NOT NULL, channelType VARCHAR(8) NOT NULL, ruleApplied VARCHAR(16) NOT NULL, maxEirp INT(8) NOT NULL, Txpower INT(8) NOT NULL, grantExpireTime DATETIME NOT NULL, heartbeatInterval INT(8) UNSIGNED NOT NULL, transmitExpireTime DATETIME NOT NULL, State INT(4) UNSIGNED NOT NULL, timestamp DATETIME NOT NULL);";
    //logger.debug(sqlStr);
    connection.query(sqlStr, function(err) {
      if (err) {
        logger.error("hi err");
        //logger.error(err);
        cb(err);
        return;
      }
      logger.debug("Group_SC_info is created");
    });
    /*
    var sqlStr =
      "CREATE TABLE IF NOT EXISTS SAS_Timer_info (cbsdSerialNumber VARCHAR(64) NOT NULL, heartbeatTimerId JSON NOT NULL, transmitTimerId JSON NOT NULL, grantTimerId JSON NOT NULL);";
    connection.query(sqlStr, function(err) {
      if (err) {
        logger.error("err");
        //logger.error(err);
        cb(err);
      }
      logger.debug("SAS_Timer_info is created");
      cb(null);
    });
    */
  });
};

init.createDB(() => {});
