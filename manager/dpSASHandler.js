"use strict";

var mysql = require("./dpMysqlApi");
var acs = require("./dpACSApi");
var acs_path = require("./dpACSPath");
var md5 = require("md5");
var config = require("../config");
var sas = require("./dpSASApiViaOpenssl");
var path = require("path");
var log4js = require("log4js");
var logger = log4js.getLogger(path.basename(__filename));
logger.level = config.log.level;

exports.handler_sas_rsp = function(sas_rsp, cellState) {
  //need an id to identify handle which cell
  logger.warn("handler: " + JSON.stringify(sas_rsp));
  logger.warn("handler: " + JSON.stringify(cellState));
  //logger.error(cellState);
  //var lock = 0;
  //for (let i = 0; i < cellState.length; i++) {
  var sqlStr;
  cellState["response"] = -1;
  cellState["nextstep"] = "";
  //  var response = -1;
  //  var nextstep = null;
  if (sas_rsp["registrationResponse"]) {
    logger.debug(sas_rsp["registrationResponse"].length); //total number of enb
    //multi enb need add for loop
    cellState["response"] = sas_rsp["registrationResponse"][0]["response"]["responseCode"];
    switch (sas_rsp["registrationResponse"][0]["response"]["responseCode"]) {
      case 0: //success
        //set state === 1 ->registration state & idle state
        //update table
        sqlStr =
          "UPDATE " +
          config.db.dbtable +
          ' SET cbsdId="' +
          sas_rsp["registrationResponse"][0]["cbsdId"] +
          '",State = 1 WHERE cbsdSerialNumber = "' +
          cellState["cbsdSerialNumber"] +
          '";';
        cellState["nextstep"] = "spectrumInquiry";
        logger.debug('sqlString = '+sqlStr);
        break;
      case 100:
        sqlStr =
          "UPDATE " +
          config.db.dbtable +
          ' SET cbsdId=null,State = 0 WHERE cbsdSerialNumber = "' +
          cellState["cbsdSerialNumber"] +
          '";';
        cellState["nextstep"] = "registration";
        break;
      case 101:
        sqlStr =
          "UPDATE " +
          config.db.dbtable +
          ' SET cbsdId=null,State = 0 WHERE cbsdSerialNumber = "' +
          cellState["cbsdSerialNumber"] +
          '";';
        cellState["nextstep"] = "registration";
        break;
      case 102:
        sqlStr =
          "UPDATE " +
          config.db.dbtable +
          ' SET cbsdId=null,State = 0 WHERE cbsdSerialNumber = "' +
          cellState["cbsdSerialNumber"] +
          '";';
        cellState["nextstep"] = "registration";
        break;
      case 103:
        sqlStr =
          "UPDATE " +
          config.db.dbtable +
          ' SET cbsdId=null,State = 0 WHERE cbsdSerialNumber = "' +
          cellState["cbsdSerialNumber"] +
          '";';
        cellState["nextstep"] = "registration";
        break;
      case 200:
        sqlStr =
          "UPDATE " +
          config.db.dbtable +
          ' SET cbsdId=null,State = 0 WHERE cbsdSerialNumber = "' +
          cellState["cbsdSerialNumber"] +
          '";';
        cellState["nextstep"] = "registration";
        break;
      case 201:
        //set state === 0 ->unregistration state
        //update table
        sqlStr =
          "UPDATE " +
          config.db.dbtable +
          ' SET cbsdId=null,State = 0 WHERE cbsdSerialNumber = "' +
          cellState["cbsdSerialNumber"] +
          '";';
        cellState["nextstep"] = "registration";
        break;
      default:
        console.log("no match return code");
        /*sqlStr = 
            "UPDATE " +
            config.db.dbtable +
            ' SET cbsdId=null,State = 0 WHERE cbsdSerialNumber = "' +
            cellState["cbsdSerialNumber"] +
            '";';*/
        cellState["nextstep"] = "registration";
        sqlStr = null;
        break;
    }
  } else if (sas_rsp["spectrumInquiryResponse"]) {
    //no handler now
    cellState["response"] = sas_rsp["spectrumInquiryResponse"][0]["response"]["responseCode"];
    switch (sas_rsp["spectrumInquiryResponse"][0]["response"]["responseCode"]) {
      case 0: //success
        cellState["nextstep"] = "grant";
        sqlStr = null;
        break;
      default:
        cellState["nextstep"] = "spectrumInquiry";
        sqlStr = null;
        console.log("no match return code");
        break;
    }
  } else if (sas_rsp["grantResponse"]) {
    cellState["response"] = sas_rsp["grantResponse"][0]["response"]["responseCode"];
    switch (sas_rsp["grantResponse"][0]["response"]["responseCode"]) {
      case 0: //success
        cellState["nextstep"] = "heartbeat";
        sqlStr = "UPDATE " + config.db.dbtable + " SET State = 2";
        if (sas_rsp["grantResponse"][0]["grantId"]) {
          sqlStr = sqlStr + ',grantId = "' + sas_rsp["grantResponse"][0]["grantId"] + '" ';
        }
        if (sas_rsp["grantResponse"][0]["grantExpireTime"]) {
          sqlStr = sqlStr + ',grantExpireTime = "' + sas_rsp["grantResponse"][0]["grantExpireTime"] + '" ';
        }
        if (sas_rsp["grantResponse"][0]["heartbeatInterval"]) {
          sqlStr = sqlStr + ',heartbeatInterval = "' + sas_rsp["grantResponse"][0]["heartbeatInterval"] + '" ';
        }
        /*if (sas_rsp["grantResponse"][0]["measReportConfig"]) {
          sqlStr =
            sqlStr +
            ',measReportConfig = "' +
            sas_rsp["grantResponse"][0]["measReportConfig"] +
            '" ';
        }*/
        if (sas_rsp["grantResponse"][0]["operationParam"]) {
          sqlStr =
            sqlStr +
            'maxEirp = "' +
            sas_rsp["grantResponse"][0]["operationParam"]["maxEirp"] +
            '",lowFrequency ="' +
            sas_rsp["grantResponse"][0]["operationParam"]["operationFrequencyRange"]["lowFrequency"] +
            '",highFrequency ="' +
            sas_rsp["grantResponse"][0]["operationParam"]["operationFrequencyRange"]["highFrequency"] +
            '" ';
        }
        if (sas_rsp["grantResponse"][0]["channelType"]) {
          sqlStr = sqlStr + ',channelType = "' + sas_rsp["grantResponse"][0]["channelType"] + '" ';
        }
        sqlStr = sqlStr + ' WHERE cbsdSerialNumber = "' + cellState["cbsdSerialNumber"] + '";';
        break;
      case 105:
        cellState["nextstep"] = "deregistration";
        sqlStr = null;
        break;
      case 400:
        cellState["nextstep"] = "spectrumInquiry";
        sqlStr = null;
        break;
      case 401:
        cellState["nextstep"] = "spectrumInquiry";
        sqlStr = null;
        break;
      default:
        console.log("no match return code");
        sqlStr = null;
        break;
    }
  } else if (sas_rsp["heartbeatResponse"]) {
    cellState["response"] = sas_rsp["heartbeatResponse"][0]["response"]["responseCode"];
    switch (sas_rsp["heartbeatResponse"][0]["response"]["responseCode"]) {
      case 0: //success
        cellState["nextstep"] = "heartbeat";
        sqlStr =
          "UPDATE " +
          config.db.dbtable +
          ' SET State = 3,transmitExpireTime = "' +
          sas_rsp["heartbeatResponse"][0]["transmitExpireTime"] +
          '" ';
        if (sas_rsp["heartbeatResponse"][0]["grantExpireTime"]) {
          sqlStr = sqlStr + ',grantExpireTime = "' + sas_rsp["heartbeatResponse"][0]["grantExpireTime"] + '" ';
        }
        if (sas_rsp["heartbeatResponse"][0]["heartbeatInterval"]) {
          sqlStr = sqlStr + ',grantExpireTime = "' + sas_rsp["heartbeatResponse"][0]["heartbeatInterval"] + '" ';
        }
        /*if (sas_rsp["heartbeatResponse"][0]["measReportConfig"]) {
          sqlStr =
            sqlStr +
            ',measReportConfig = "' +
            sas_rsp["heartbeatResponse"][0]["measReportConfig"] +
            '" ';
        }*/
        if (sas_rsp["heartbeatResponse"][0]["operationParam"]) {
          sqlStr =
            sqlStr +
            'maxEirp = "' +
            sas_rsp["heartbeatResponse"][0]["operationParam"]["maxEirp"] +
            '",lowFrequency ="' +
            sas_rsp["heartbeatResponse"][0]["operationParam"]["operationFrequencyRange"]["lowFrequency"] +
            '",highFrequency ="' +
            sas_rsp["heartbeatResponse"][0]["operationParam"]["operationFrequencyRange"]["highFrequency"] +
            '" ';
        }
        sqlStr = sqlStr + ' WHERE cbsdSerialNumber = "' + cellState["cbsdSerialNumber"] + '";';
        break;
      case 105:
        cellState["nextstep"] = "deregistration";
        sqlStr = null;
        break;
      case 500:
        cellState["nextstep"] = "grant";
        sqlStr = null;
        break;
      case 501:
        cellState["nextstep"] = "relinquishment";
        sqlStr = null;
        break;
      case 502:
        cellState["nextstep"] = "relinquishment";
        sqlStr = null;
        break;
      default:
        console.log("no match return code");
        cellState["nextstep"] = "relinquishment";
        sqlStr = null;
        break;
    }
  } else if (sas_rsp["relinquishmentResponse"]) {
    cellState["response"] = sas_rsp["relinquishmentResponse"][0]["response"]["responseCode"];
    switch (sas_rsp["relinquishmentResponse"][0]["response"]["responseCode"]) {
      case 0: //success
        sqlStr =
          "UPDATE " +
          config.db.dbtable +
          ' SET State = 1,grantId = null WHERE cbsdSerialNumber ="' +
          cellState["cbsdSerialNumber"] +
          '";';
        cellState["nextstep"] = "deregistration";
        break;
      case 102:
        sqlStr = null;
        cellState["nextstep"] = "relinquishment";
        break;
      case 103:
        sqlStr = null;
        cellState["nextstep"] = "relinquishment";
        break;
      default:
        console.log("no match return code");
        cellState["nextstep"] = "relinquishment";
        sqlStr = null;
        break;
    }
  } else if (sas_rsp["deregistrationResponse"]) {
    cellState["response"] = sas_rsp["deregistrationResponse"][0]["response"]["responseCode"];
    switch (sas_rsp["deregistrationResponse"][0]["response"]["responseCode"]) {
      case 0: //success
        sqlStr =
          "UPDATE " +
          config.db.dbtable +
          ' SET State = 0,cbsdId = null WHERE cbsdSerialNumber ="' +
          cellState["cbsdSerialNumber"] +
          '";';
        cellState["nextstep"] = "registration";
        break;
      case 102:
        sqlStr = null;
        cellState["nextstep"] = "deregistration";
        break;
      case 103:
        sqlStr = null;
        cellState["nextstep"] = "deregistration";
        break;
      default:
        console.log("no match return code");
        sqlStr = null;
        break;
    }
  } else {
    console.log("no match sas response");
    sqlStr = -1;
  }
  if (sqlStr === -1 ) {
    return Promise.reject(cellState);
  }
  else if (sqlStr === null) {
    logger.warn("[SAS_HDL] Do not need sqlquery");
    return Promise.resolve(cellState);
  } else {
    return new Promise((resolve, reject) => {
      mysql.sqlquery(sqlStr, config.db.dbname1, null)
      .then(result => {
        resolve(cellState);
      })
      .catch(err =>{
        logger.error("sqlquery error");
        reject(err);
      })
    })
  }
};

//pending: Add multi-cell case
exports.handler_sas_req = function(sas_req, cbsdSerialNumber) {
  //hard code
  return new Promise((resolve, reject) => {
    let sqlStr = 'SELECT * FROM Group_SC_info WHERE cbsdSerialNumber = "' + cbsdSerialNumber + '";';
    mysql.sqlquery(sqlStr, config.db.dbname1, null)
    .then(mysql_result => {
      logger.debug("[SAS_HDL_REQ_MYSQL]: " + JSON.stringify(mysql_result));

      var param = mysql_result[1][0];

      if ("registration" === sas_req) {
        var post_data = JSON.stringify({
          registrationRequest: [
            {
              //TODO: GPS
              cbsdSerialNumber: "123",
              fccId: param["fccId"],
              //cbsdSerialNumber: "D823956047"
              cbsdSerialNumber: param["cbsdSerialNumber"]
            }
          ]
        });
      } else if ("spectrumInquiry" === sas_req) {
        var post_data = JSON.stringify({
          spectrumInquiryRequest: [
            {
              cbsdId: param["cbsdId"],
              inquiredSpectrum: [
                {
                  lowFrequency: param["lowFrequency"],
                  highFrequency: param["highFrequency"]
                }
              ]
            }
          ]
        });
      } else if ("grant" === sas_req) {
        var post_data = JSON.stringify({
          grantRequest: [
            {
              cbsdId: param["cbsdId"],
              operationParam: {
                maxEirp: param["maxEirp"],
                operationFrequencyRange: {
                  lowFrequency: param["lowFrequency"],
                  highFrequency: param["highFrequency"]
                }
              }
            }
          ]
        });
      } else if ("heartbeat" === sas_req) {
        var post_data = JSON.stringify({
          heartbeatRequest: [
            {
              cbsdId: param["cbsdId"],
              grantId: param["grantId"],
              operationState: "GRANTED"
            }
          ]
        });
      } else if ("relinquishment" === sas_req) {
        var post_data = JSON.stringify({
          relinquishmentRequest: [
            {
              cbsdId: param["cbsdId"],
              grantId: param["grantId"]
            }
          ]
        });
      } else if ("heartbeat_auth" === sas_req) {
        var post_data = JSON.stringify({
          heartbeatRequest: [
            {
              cbsdId: param["cbsdId"],
              grantId: param["grantId"],
              operationState: "AUTHORIZED"
            }
          ]
        });
        sas_req = "heartbeat";
      } else if ("heartbeat_renew" === sas_req) {
        var post_data = JSON.stringify({
          heartbeatRequest: [
            {
              cbsdId: param["cbsdId"],
              grantId: param["grantId"],
              operationState: "AUTHORIZED",
              grantRenew: true
            }
          ]
        });
        sas_req = "heartbeat";
      } else {
        var post_data = JSON.stringify({
          deregistrationRequest: [
            {
              cbsdId: param["cbsdId"]
            }
          ]
        });
      }
      logger.debug("post_data: " + post_data);
      return sas.sas_api(sas_req, post_data); //return sas_result;
    })
    .then(sas_result => {
      resolve(sas_result);
    })
    .catch(err => {
      logger.error("[SAS_HDL_REQ_ERROR]: " + err);
      if (err == 1000) {
        logger.error("HeartBeat Response Lost!!");
        var sqlStr = "SELECT grantCode FROM " + config.db.dbtable + ' WHERE cbsdSerialNumber = "' + cbsdSerialNumber + '";';
        mysql.sqlquery(sqlStr, config.db.dbname1, null)
        .then(mysql_result => {
          logger.debug("heartbeat fail->sqlquery:" + JSON.stringify(mysql_result));
          logger.error("Stop RF transmission, so set adminstate = false!!");
          return acs.acs_api_post(acs_path.allPostPath(cbsdSerialNumber),acs_path.heartbeatACSPostParam(md5(mysql_result[1][0]["grantCode"] + 50)));
        })
        .then(acs_result => {
          logger.error("[ACS]:" + JSON.stringify(acs_result));
          reject(new Error('HeartBeat Response Lost!!'));
        })
        .catch(err => {
          reject(err);
        })
      } else {
        var errstep = new Error();
        //errstep.name = "data_been_delete";
        reject(errstep);
      }
    })
  })
};
