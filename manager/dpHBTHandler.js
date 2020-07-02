"use strict";
var config = require("../config");
var mysql = require("./dpMysqlApi");
var acs = require("./dpACSApi");
var acs_path = require("./dpACSPath");
var md5 = require("md5");
//var sas = require("./dpSASApi");
var sas_handler = require("./dpSASHandler");
var hbt_handler = require("./dpHBTHandler");
//var timer_list = require("./dpTimerContent");
var path = require("path");
var log4js = require("log4js");
var logger = log4js.getLogger(path.basename(__filename));
logger.level = config.log.level;
var heartbeat_threshold = 0.8;
var grant_threshold = 0.7;
var allTimerContent = [];

function grant_expire_handler(who) {
  logger.debug("[start to grant_expire_handler]");
  let cbsdArrayIndex = allTimerContent.map(item => Object.values(item)[0]).indexOf(who);
  //step 1: clear heartbeat timer
  clearTimeout(allTimerContent[cbsdArrayIndex]["heartbeatTimerId"]);
  allTimerContent[cbsdArrayIndex]["heartbeatTimerId"] = null;
  //step 2:send next heartbeat request to sas + nenew
  sas_handler.handler_sas_req("heartbeat_renew", who)
  .then(sas_hdl_req_result => {
    return sas_handler.handler_sas_rsp(sas_hdl_req_result, { cbsdSerialNumber: who, response: -1, nextstep: null });
  })
  .then(cellStateObj => {
    //SUCCESS HERE
    if (0 === cellStateObj["response"]) {
      hbt_handler.handler_hbt(cellStateObj)
      .then(() => {
        logger.debug("[grant_expire_handler] hbt handler finish");
      })
    } else {
      logger.error("hbt fail, so grant expire......");
      var sqlStr = "SELECT grantCode FROM " + config.db.dbtable + ' WHERE cbsdSerialNumber = "' + who + '";';
      mysql.sqlquery(sqlStr, config.db.dbname1, null)
      .then(mysql_result => {
        logger.debug("heartbeat fail->sqlquery:" + JSON.stringify(mysql_result));
        logger.error("admin false!!!!!!!!");
        return acs.acs_api_post(acs_path.allPostPath(who), acs_path.heartbeatACSPostParam(md5(mysql_result[1][0]["grantCode"] + 50)));
      })
      .then(acs_result => {
        logger.debug("[ACS]:" + JSON.stringify(acs_result));
      })
      // .catch(err => {
      //   logger.error("heartbeat fail: " + err);
      // })
    }
  })
  .catch(err => {
    logger.error("[grant_expire_handler]: " + err);
  })
}

function transmit_expire_handler(who) {
  logger.debug("[start to transmit_expire_handler]");
  let cbsdArrayIndex = allTimerContent.map(item => Object.values(item)[0]).indexOf(who);
  //step 1: clear transmit timer
  clearTimeout(allTimerContent[cbsdArrayIndex]["transmitTimerId"]);
  logger.error("heartbeat fail, so transmit expire......");
  //set txpower 0
  var sqlStr = "SELECT grantCode FROM " + config.db.dbtable + ' WHERE cbsdSerialNumber = "' + who + '";';
  mysql.sqlquery(sqlStr, config.db.dbname1, null)
  .then(mysql_result => {
    logger.debug("heartbeat fail->sqlquery:" + JSON.stringify(mysql_result));
    logger.error("admin false!!!!!!!!!");
    return acs.acs_api_post(acs_path.allPostPath(who), acs_path.heartbeatACSPostParam(md5(mysql_result[1][0]["grantCode"] + 50)))
  })
  .then(acs_result => {
    logger.error(acs_result);
  })
  .catch(err => {
    logger.error(err);
  })
}

function heartbeat_expire_handler(who) {
  logger.debug(who + " start to heartbeat_expire_handler");
  let cbsdArrayIndex = allTimerContent.map(item => Object.values(item)[0]).indexOf(who);
  //logger.warn(allTimerContent.length);
  //step 1: clear transmit timer
  clearTimeout(allTimerContent[cbsdArrayIndex]["transmitTimerId"]);
  allTimerContent[cbsdArrayIndex]["transmitTimerId"] = null;
  //step 2:send next heartbeat request to sas
  sas_handler.handler_sas_req("heartbeat_auth", who)
  .then(handler_sas_req_result => {
    return sas_handler.handler_sas_rsp(handler_sas_req_result, { cbsdSerialNumber: who, response: -1, nextstep: null });
  })
  .then(cellStateObj => {
    if (0 === cellStateObj["response"]) {
      hbt_handler.handler_hbt(cellStateObj, function(no_use) {
        logger.debug("hbt handler finish");
      });
    } else {
      logger.debug("hbt fail");
      var sqlStr = "SELECT grantCode FROM " + config.db.dbtable + ' WHERE cbsdSerialNumber = "' + who + '";';
      mysql.sqlquery(sqlStr, config.db.dbname1, null)
      .then(mysql_result => {
        logger.debug("heartbeat fail->sqlquery:" + JSON.stringify(mysql_result));
        logger.error("admin false!!!!!!!!!!!!!!!");
        return acs.acs_api_post(acs_path.allPostPath(who),acs_path.heartbeatACSPostParam(md5(mysql_result[1][0]["grantCode"] + 50)));
      })
      .then(acs_result => {
        logger.error("[ACS]:" + JSON.stringify(acs_result));
      });
      sas_handler.handler_sas_req("relinquishment", who)
      .then(handler_sas_req_result => {
        return sas_handler.handler_sas_rsp(handler_sas_req_result, { cbsdSerialNumber: who, response: -1, nextstep: null })
      })
      .then(cellStateObj => {
        logger.error("relinquishment rc=" + cellStateObj["response"]);
      })
    }
  })
  .catch(err => {
    logger.error(err);
  })
}

exports.handler_hbt = function(cellStateObj) {
  logger.warn("hbt handle start!!");
  logger.warn(JSON.stringify(cellStateObj));
  var grantExpireTime;
  var heartbeatInterval;
  var transmitExpireTime;
  var cbsdArrayIndex;
  //for (let i = 0; i < cellStateObj.length; i++) {
  var timerContent = {};
  timerContent["cbsdSerialNumber"] = cellStateObj["cbsdSerialNumber"];
  var sqlStr =
    "SELECT heartbeatInterval, grantExpireTime, transmitExpireTime FROM " +
    config.db.dbtable +
    ' WHERE cbsdSerialNumber ="' +
    cellStateObj["cbsdSerialNumber"] +
    '";';
  logger.warn(JSON.stringify(cellStateObj));

  return new Promise((resolve, reject) => {
    mysql.sqlquery(sqlStr, config.db.dbname1, null)
    .then(mysql_result => {
      grantExpireTime = mysql_result[1][0]["grantExpireTime"];
      transmitExpireTime = mysql_result[1][0]["transmitExpireTime"];
      heartbeatInterval = mysql_result[1][0]["heartbeatInterval"];

      logger.debug("grantExpireTime: " + grantExpireTime);
      logger.debug("transmitExpireTime: " + transmitExpireTime);
      logger.debug("heartbeatInterval: " + heartbeatInterval);
      var current_time = new Date();
      logger.debug("current time:" + current_time);
      logger.debug("grant:" + (grantExpireTime - current_time));
      // logger.debug("grant:" + (grantExpireTime - current_time + 8 * 60 * 60 * 1000));
      // logger.debug("transmit:" + (transmitExpireTime - current_time + 8 * 60 * 60 * 1000));
      logger.debug("transmit:" + (transmitExpireTime - current_time));
      logger.debug("cbsdSerialNumber: " + timerContent["cbsdSerialNumber"]);
      logger.debug("cbsdSerialNumber: " + cellStateObj["cbsdSerialNumber"]);

      timerContent["grantTimerId"] = setTimeout(
        grant_expire_handler,
        // (grantExpireTime - current_time + 8 * 60 * 60 * 1000) * grant_threshold,
        (grantExpireTime - current_time) * grant_threshold,
        timerContent["cbsdSerialNumber"]
      );
      timerContent["transmitTimerId"] = setTimeout(
        transmit_expire_handler,
        // transmitExpireTime - current_time + 8 * 60 * 60 * 1000,
        transmitExpireTime - current_time,
        timerContent["cbsdSerialNumber"]
      );
      timerContent["heartbeatTimerId"] = setTimeout(
        heartbeat_expire_handler,
        heartbeatInterval * 1000 * heartbeat_threshold,
        timerContent["cbsdSerialNumber"]
      );
      cbsdArrayIndex = allTimerContent.map(item => Object.values(item)[0]).indexOf(timerContent["cbsdSerialNumber"]);
      logger.debug("cbsdArrayIndex:" + cbsdArrayIndex);
      if (cbsdArrayIndex >= 0) {
        if (allTimerContent[cbsdArrayIndex]["grantTimerId"]) {
          clearTimeout(allTimerContent[cbsdArrayIndex]["grantTimerId"]);
        }
        if (allTimerContent[cbsdArrayIndex]["transmitTimerId"]) {
          clearTimeout(allTimerContent[cbsdArrayIndex]["transmitTimerId"]);
        }
        if (allTimerContent[cbsdArrayIndex]["heartbeatTimerId"]) {
          clearTimeout(allTimerContent[cbsdArrayIndex]["heartbeatTimerId"]);
        }
        allTimerContent.splice([cbsdArrayIndex], 1); //delete
      }
      allTimerContent.push(timerContent);
      resolve(allTimerContent);
    })
    .catch(err => {
      logger.error(err);
      reject(err);
    })
  });
};

exports.hbt_timer_list_kill = function(index) {
  allTimerContent.splice([index], 1);
  return Promise.resolve(allTimerContent);
};
//module.exports = allTimerContent;
