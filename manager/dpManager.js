"use strict";
var config = require("../config");
var md5 = require("md5");
var mysql = require("./dpMysqlApi");
var mysql_path = require("./dpMysqlPath");
var acs = require("./dpACSApi");
var acs_path = require("./dpACSPath");
// var sas = require("./dpSASApi");
var sas = require("./dpSASApiViaOpenssl");
var sas_handler = require("./dpSASHandler");
var hbt_handler = require("./dpHBTHandler");
var dp = require("./dpManager");
var diff = require("deep-diff").diff;
var util = require("./util");
var path = require("path");
var log4js = require("log4js");
var logger = log4js.getLogger(path.basename(__filename));
logger.level = config.log.level;
const readfile = require('./dpReadEnb');

//store cell's next step and response code
var cellStateList = [];
//TODO: CREATE DATABASE TABLE
var timerList = [];

exports.cbrsRegistration = function(input, cb) {
  logger.debug("-------------------------------------------CBRSREGISTRATION-----------------------------------------------------");
  //logger.debug(hbt_handler.grant_threshold);
  //Temporary Parameter storing
  var allParam = {};

  logger.warn(JSON.stringify(input));
  if (input.flag == 1) {
    acs.acs_api_post(acs_path.allPostPath(input.oui + "-" + input.productClass + "-" + input.sn),acs_path.cbrsregistrationACSPostParamFlag(md5(input.GrantCode)));
    cb(config.rc.err.flag);
    return;
  }

  if(util.checkIfExist(input)){
    allParam["cbsdSerialNumber"] = input.oui + "-" + input.productClass + "-" + input.sn;
    allParam["GrantCode"] = input.GrantCode;
    allParam["GrantCodeMd5"] = md5(input.GrantCode);
    var sqlStr_dp = mysql_path.regPathInsert(allParam);
  } else {
    cb(config.rc.err.err700);
    return;
  }

  var cbsdArrayIndex = util.checkIfExistArray(allParam["cbsdSerialNumber"],cellStateList);
  util.checkIfExistTimeArray(allParam["cbsdSerialNumber"],timerList);

  //temp solution for genieacsv1.2
  // acs.acs_api_post(acs_path.allPostPath(allParam["cbsdSerialNumber"]),acs_path.cbrsregistrationACSPostParamFixACS(allParam))
  // .then((rsp)=> {
  //   logger.warn(rsp);
  //   return mysql.sqlquery(mysql_path.regPathDelete(allParam), config.db.dbname1, null);
  // })

  mysql.sqlquery(mysql_path.regPathDelete(allParam), config.db.dbname1, null)
  .then(sql_result => {
    logger.debug(sql_result);
    //return mysql.sqlquery(mysql_path.regPathFindGPS(input), config.db.dbname2, input);
    return readfile.ReadEnodebGPS(allParam["cbsdSerialNumber"]);
  })
  //Promise! STEP1: Mysql SELECT -> get GPS
  .then(rd_result => {
    logger.warn(rd_result);
    let gps = rd_result;
    allParam["latitude"] = gps["latitude"];
    allParam["longitude"] = gps["longitude"];
    logger.debug('Lat: '+allParam["latitude"] + ' Lng: ' + allParam["longitude"]);
    return acs.acs_api_get(acs_path.cbrsregistrationACSGetParam(allParam["cbsdSerialNumber"]));
  })
  //STEP2: ACS get
  .then(acs_result => {
    logger.debug(acs_result);
    allParam["ProvisioningState"] = acs_result["Device"]["DeviceInfo"]["X_VENDOR_ProvisioningState"]["_value"];
    allParam["softwareVersion"] = acs_result["Device"]["DeviceInfo"]["SoftwareVersion"]["_value"];
    allParam["datamodel"] = acs_result;
    return mysql.sqlquery(sqlStr_dp, config.db.dbname1, null);
  })
  //STEP3: Mysql INSERT
  .then(mysql_result => {
    logger.debug(mysql_result);
    //logger.debug(config.sas.postdata["registrationRequest"][0]);
    //Hard code: beacuse of only two test unit
    //var post = {};
    var post = {registrationRequest: [{}]};
    util.fillInRegDatamodel(post["registrationRequest"][0], allParam);
    post = JSON.stringify(post);
    return sas.sas_api("registration", post);
  })
  // .then(sas_result => {
  //   //logger.warn('sas_result ='+ JSON.stringify(sas_result));
  //   cbsdArrayIndex = cellStateList.map(item => Object.values(item)[0]).indexOf(allParam["cbsdSerialNumber"]);
  //   sas_handler.handler_sas_rsp(sas_result, cellStateList[cbsdArrayIndex], (cellState) => {
  //       cellStateList[cbsdArrayIndex] = cellState;
  //       logger.debug("Macy in the house:" + JSON.stringify(cellState));
  //       cb(config.rc.err.add(cellStateList[cbsdArrayIndex]["response"]));
  //     }
  //   );
  //   return 1;
  // })
  //STEP4: SAS Reg Request
  .then(sas_result => {
    // logger.warn('SAS ErrorCode = ' + sas_result['registrationResponse'][0]['response']['responseCode']);
    logger.warn('sas_result = '+ JSON.stringify(sas_result));
    allParam['errorcode'] = sas_result['registrationResponse'][0]['response']['responseCode'];
    cbsdArrayIndex = cellStateList.map(item => Object.values(item)[0]).indexOf(allParam["cbsdSerialNumber"]);
    return sas_handler.handler_sas_rsp(sas_result, cellStateList[cbsdArrayIndex]);
  })
  //STEP5: ACS post
  .then(cellState => {
    // cellStateList[cbsdArrayIndex] = cellState;
    logger.debug("Macy in the house:" + JSON.stringify(cellState));
    //Callback to postParser.js
    cb(config.rc.err.add(cellStateList[cbsdArrayIndex]["response"]));
    return acs.acs_api_post(
      acs_path.allPostPath(allParam["cbsdSerialNumber"]),
      acs_path.cbrsregistrationACSPostParamSucc(allParam));
  })
  .then((acs_result) => {
    logger.debug("[ACS]: ACS rsp successfully")
    logger.debug("[ACS]:" + JSON.stringify(acs_result));
    //cb(JSON.stringify({'ERROR':'0'}));
  })
  //Catch Error!
  .catch((err) => {
    logger.error(err);
    //logMyErrors(err);
    cb(config.rc.err.err(err));
  })
};

exports.getFrequency = function(input, cb) {
  logger.debug("----------------------------------------------------GETFREQUENCY-----------------------------------------------------------");
  var allParam = {};

  logger.warn(JSON.stringify(input));
  if (input.flag == 1) {
    acs.acs_api_post(acs_path.allPostPath(input.oui + "-" + input.productClass + "-" + input.sn),acs_path.cbrsSasStartRfPostParam(md5(input.GrantCode)));
    cb(config.rc.err.flag);
    return;
  }

  if(util.checkIfExist(input)){
    allParam["cbsdSerialNumber"] = input.oui + "-" + input.productClass + "-" + input.sn;
    allParam["GrantCode"] = input.GrantCode;
    allParam["GrantCodeMd5"] = md5(input.GrantCode);
  } else {
    cb(config.rc.err.err700);
    return;
  }
  //CellStateList check if exist
  var cbsdArrayIndex = util.checkIfExistArray(allParam["cbsdSerialNumber"],cellStateList);
  logger.debug("CELL: "+ allParam["cbsdSerialNumber"] + " NEXT STEP: " +cellStateList[cbsdArrayIndex]["nextstep"]);

  if (-1 === cbsdArrayIndex) { 
    logger.debug('[MYSQL] Insert new device');
    var sqlStr_dp = mysql_path.regPathInsert(allParam); logger.debug(sqlStr_dp); 
  } 

  if ("spectrumInquiry" !== cellStateList[cbsdArrayIndex]["nextstep"]) {cb(config.rc.err.err800); return; }

  //STEP1: ACS Get
  acs.acs_api_get(acs_path.getFrequencyACSGetParam(allParam["cbsdSerialNumber"]))
  .then(acs_result => {
    logger.debug(acs_result);
    allParam["BandsSupported"] = acs_result["Device"]["Services"]["FAPService"]["1"]["Capabilities"]["LTE"]["BandsSupported"]["_value"];
    //allParam["MaxTxPower"] = acs_result["Device"]["Services"]["FAPService"]["1"]["Capabilities"]["MaxTxPower"]["_value"];
    allParam["MaxTxPower"] = acs_result["Device"]["Services"]["FAPService"]["1"]["CellConfig"]["LTE"]["RAN"]["RF"]["X_VENDOR_TxPower"]["_value"];
    allParam["maxEirp"] = allParam["MaxTxPower"] + 11;
    allParam["EARFCN_prior"] = acs_result["Device"]["Services"]["FAPService"]["1"]["CellConfig"]["LTE"]["RAN"]["RF"]["EARFCNDL"]["_value"];

    //SETTING EARFCN & FREQUENCY
    if (allParam["cbsdSerialNumber"] == "0050BA-FAP-000H1148536") {
      allParam["EARFCNDL"] = 43290;
      allParam["highFrequency"] = 3570000000;
      allParam["lowFrequency"] = 3550000000;
    } else {
      allParam["EARFCNDL"] = 43190;
      allParam["highFrequency"] = 3580000000;
      allParam["lowFrequency"] = 3560000000;
    }
    allParam["EARFCNUL"] = allParam["EARFCNDL"];

  logger.debug('[mysql_query]:'+ mysql_path.getFreqUpdate(allParam));
    return mysql.sqlquery(mysql_path.getFreqUpdate(allParam), config.db.dbname1, null);
  })
  //STEP2: spectrumInquiry
  .then((mysql_result) => {
    logger.debug(mysql_result);
    return sas_handler.handler_sas_req(cellStateList[cbsdArrayIndex]["nextstep"], allParam["cbsdSerialNumber"]);
  })
  .then(sas_hdl_req_result => {
    //logger.debug("[sas_hdl_req_result]: "+ JSON.stringify(sas_hdl_req_result));
    cbsdArrayIndex = cellStateList.map(item => Object.values(item)[0]).indexOf(allParam["cbsdSerialNumber"]);
    return sas_handler.handler_sas_rsp(sas_hdl_req_result, cellStateList[cbsdArrayIndex]);
  })
  .then(cellState => {
    cellStateList[cbsdArrayIndex] = cellState;
    logger.debug("Macy in the house:" + JSON.stringify(cellState));
    if (0 === cellStateList[cbsdArrayIndex]["response"]) {
      logger.debug("----- " + allParam["cbsdSerialNumber"] + " ready to GRANT -----");
      return sas_handler.handler_sas_req(cellStateList[cbsdArrayIndex]["nextstep"], allParam["cbsdSerialNumber"]);
    } else {
      cb(config.rc.err.add(cellStateList[cbsdArrayIndex]["response"]))
    }
  })
  .then(sas_hdl_req_result => {
    logger.debug("[sas_hdl_req_result]: "+ sas_hdl_req_result);
    cbsdArrayIndex = cellStateList.map(item => Object.values(item)[0]).indexOf(allParam["cbsdSerialNumber"]);
    return sas_handler.handler_sas_rsp(sas_hdl_req_result, cellStateList[cbsdArrayIndex]);
  })
  .then(cellState => {
    cellStateList[cbsdArrayIndex] = cellState;
    logger.debug("Macy in the house:" + JSON.stringify(cellState));
    if (0 === cellStateList[cbsdArrayIndex]["response"]) {
      //TODO: Heartbear here
      logger.debug("----- " + allParam["cbsdSerialNumber"] + " ready to HEARTBEAT -----");
      mysql.sqlquery(mysql_path.getFreqSelect(allParam), config.db.dbname1, null)
      .then(mysql_result => {
        if (config.freq.bandwidth == 20) {
          allParam["DLBandwidth"] = 'n100';
        } else {
          allParam["DLBandwidth"] = 'n50';
        }
        let param = mysql_result[1][0];
        allParam["ULBandwidth"] = allParam["DLBandwidth"];
        allParam["maxEirp"] = param["maxEirp"];
        return util.fillTheFreqByEnb();
      })
      .then(res => {
        config.freq.AllFreq = res;
        return util.getFrequency(allParam["cbsdSerialNumber"]);
      })
      .then(res => {
        logger.warn(config.freq.AllFreq);
        //allParam["EARFCNDL"] = res;
        // if (allParam["cbsdSerialNumber"] == "0050BA-FAP-000H1148536") {
        //   allParam["EARFCNDL"] = 43290;
        //   //allParam["lowFreq"] = 3570000000;
        //   //allParam["highFreq"] = 3550000000;
        // } else {
        //   allParam["EARFCNDL"] = 43190;
        //   //allParam["lowFreq"] = 3580000000;
        //   //allParam["highFreq"] = 3560000000;
        // }
        // allParam["EARFCNUL"] = allParam["EARFCNDL"];
        //return mysql.sqlquery(mysql_path.getFreqUpdate2(allParam), config.db.dbname1, null);
        //return 
      })
      
      return sas_handler.handler_sas_req(cellStateList[cbsdArrayIndex]["nextstep"],allParam["cbsdSerialNumber"]);
      
      //.then(mysql_result => {return mysql.sqlquery(mysql_path.getFreqUpdate3(input), config.db.dbname2, null);})
      //.then(mysql_result => {})
      //logger.debug(cbsdArrayIndex);
    } else {
      //cb(config.rc.err.err(cellStateList[cbsdArrayIndex]["response"]));
      //logger.warn('Here');
      return Promise.reject(new Error(cellStateList[cbsdArrayIndex]["response"]));
    }
  })
  .then(sas_hdl_req_result => {
    return sas_handler.handler_sas_rsp(sas_hdl_req_result, cellStateList[cbsdArrayIndex]);
  })
  .then(cellState => {
    cellStateList[cbsdArrayIndex] = cellState;
    if (0 === cellStateList[cbsdArrayIndex]["response"]) {
      cb(config.rc.err.add(cellStateList[cbsdArrayIndex]["response"]));
      hbt_handler.handler_hbt(cellStateList[cbsdArrayIndex])
      .then(hblist => {
        timerList = hblist;
        logger.debug("HeartBeat finish!!");
        return acs.acs_api_post(acs_path.allPostPath(allParam["cbsdSerialNumber"]),acs_path.getFrequencyACSPostParam(allParam));
      })
      .then(acs_result => {
        logger.warn("EARFCN prior: " + allParam["EARFCN_prior"] + " EARFCN change to: " + allParam["EARFCNDL"]);
        if (allParam["EARFCN_prior"] != allParam["EARFCNDL"]) {
          return acs.acs_api_post(acs_path.allPostPath(allParam["cbsdSerialNumber"]),acs_path.rebootACSParam(allParam));
        } else {
          return;
        }
      })
    } else {
      logger.warn("----- " + allParam["cbsdSerialNumber"] + " ready to RELINQUISH -----");
      sas_handler.handler_sas_req(cellStateList[cbsdArrayIndex]["nextstep"],allParam["cbsdSerialNumber"])
      .then(sas_hdl_req_result => {
        return sas_handler.handler_sas_rsp(sas_hdl_req_result, cellStateList[cbsdArrayIndex])
      })
      .then(cellState => {
        cellStateList[cbsdArrayIndex] = cellState;
        cb(config.rc.err.err(cellStateList[cbsdArrayIndex]["response"]));
      })
    }
  })
  .catch(err => {
    //TODO: cbsd's mysql data delete after reg..
    if ('data_been_delete' === err.name) {
      logger.error(allParam["cbsdSerialNumber"]+"'s data lost, We'll insert data in DB now");
      mysql.sqlquery(mysql_path.regPathInsert(allParam), config.db.dbname1, null)
      .catch((err)=>{logger.error(err)})
      cb(config.rc.err.err(err));
      return;
    } else {
      logger.error("[getFrequency] Error catched");
      logger.error(err);
      //logMyErrors(err);
      cb(config.rc.err.err(err));
      return;
    }
  })
}

exports.cbrsDeregistration = function(input, cb) {
  logger.debug("------------------------------------------DEREGISTRATION---------------------------------------------------");
  var allParam = {};

  logger.warn(JSON.stringify(input));
  if (input.flag == 1) {
    cb(config.rc.err.flag);
    return;
  }

  if(util.checkIfExist(input)){
    allParam["cbsdSerialNumber"] = input.oui + "-" + input.productClass + "-" + input.sn;
    // allParam["GrantCode"] = input.GrantCode;
    // allParam["GrantCodeMd5"] = md5(input.GrantCode);
  } else {
    cb(config.rc.err.err700);
    return;
  }

  var cbsdArrayIndex = cellStateList.map(item => Object.values(item)[0]).indexOf(allParam["cbsdSerialNumber"]);
  logger.debug("CELL: "+ allParam["cbsdSerialNumber"] + " NEXT STEP: " +cellStateList[cbsdArrayIndex]["nextstep"]);
  if (-1 == cbsdArrayIndex) {
    cb(config.rc.err.err800);
    return;
  }

  if ("registration" == cellStateList[cbsdArrayIndex]["nextstep"]) {
    logger.error(cbsdArrayIndex);
    logger.error(timerList);
    logger.error(timerList[cbsdArrayIndex]);
    logger.error("cellStateList[cbsdArrayIndex]['nextstep']: " + cellStateList[cbsdArrayIndex]["nextstep"]);
    cb(config.rc.err.err500);
    return;
  } else if ("spectrumInquiry" == cellStateList[cbsdArrayIndex]["nextstep"]) {
    cellStateList[cbsdArrayIndex]["nextstep"] = "deregistration";
  } else if ("grant" == cellStateList[cbsdArrayIndex]["nextstep"]) {
    cellStateList[cbsdArrayIndex]["nextstep"] = "deregistration";
  } else if ("heartbeat" == cellStateList[cbsdArrayIndex]["nextstep"]) {
    cellStateList[cbsdArrayIndex]["nextstep"] = "relinquishment";
    var cbsdTimerIndex = timerList.map(item => Object.values(item)[0]).indexOf(allParam["cbsdSerialNumber"]);
    clearTimeout(timerList[cbsdTimerIndex]["grantTimerId"]);
    clearTimeout(timerList[cbsdTimerIndex]["transmitTimerId"]);
    clearTimeout(timerList[cbsdTimerIndex]["heartbeatTimerId"]);
    hbt_handler.hbt_timer_list_kill(cbsdTimerIndex)
    .then(hblist => {
      timerList = hblist;
      logger.debug("update timerList:" + timerList.length);
    })
    .catch(err => {
      cb(config.rc.err.add(err));
      return;
    })
  } else if ("relinquishment" == cellStateList[cbsdArrayIndex]["nextstep"]) {
    cellStateList[cbsdArrayIndex]["nextstep"] = "deregistration";
  } else {
    // cb(config.rc.err.err500);
    // return;
  }

  acs.acs_api_post(acs_path.allPostPath(allParam["cbsdSerialNumber"]),acs_path.cbrsSasStopRfPostParam())
  .then(acs_res => {
    return sas_handler.handler_sas_req(cellStateList[cbsdArrayIndex]["nextstep"], allParam["cbsdSerialNumber"]);
  })
  .then(sas_hdl_req_result => { return sas_handler.handler_sas_rsp(sas_hdl_req_result, cellStateList[cbsdArrayIndex]);})
  .then(cellState => {
    cellStateList[cbsdArrayIndex] = cellState;
    if ("deregistration" == cellStateList[cbsdArrayIndex]["nextstep"]) {
      logger.warn(allParam['cbsdSerialNumber'] + ' has been deleted!');
      //acs.acs_api_post(acs_path.allPostPath(allParam["cbsdSerialNumber"]),acs_path.cbrsSasStopRfPostParam());
      
      sas_handler.handler_sas_req(cellStateList[cbsdArrayIndex]["nextstep"], allParam["cbsdSerialNumber"])
      .then(sas_hdl_req_result => sas_handler.handler_sas_rsp(sas_hdl_req_result, cellStateList[cbsdArrayIndex]))
      .then(cellState => {
        cellStateList[cbsdArrayIndex] = cellState;
        cb(config.rc.err.add(cellStateList[cbsdArrayIndex]["response"]));
      })
      .catch(err => {
        cb(config.rc.err.add(err));
        return;
      })
      util.relFrequency(allParam["cbsdSerialNumber"])
      .then(res => {
        return mysql.sqlquery(mysql_path.deregPathDel(allParam), config.db.dbname1, null);
      })
      .then(res => {
        logger.warn("Frequency: " + JSON.stringify(config.freq.AllFreq));
        return;
      })
    } else {
      logger.warn(allParam['cbsdSerialNumber'] + ' has been deleted!');
      cb(config.rc.err.add(cellStateList[cbsdArrayIndex]["response"]));
      mysql.sqlquery(mysql_path.deregPathDel(allParam), config.db.dbname1, null);
      return;
    }
  })
  .catch(err => {
    logger.error("[Deregistration] Error catched");
    logger.error(err);
    cb(config.rc.err.err(err));
    return;
  })
}

exports.cbrsStopTransmit = function(input, cb) {
  logger.debug("------------------------------------------STOPTRANSMIT---------------------------------------------------");
  var allParam = {};
  if(util.checkIfExist(input)){
    allParam["cbsdSerialNumber"] = input.oui + "-" + input.productClass + "-" + input.sn;
    allParam["GrantCode"] = input.GrantCode;
    allParam["GrantCodeMd5"] = md5(input.GrantCode);
  } else {
    cb(config.rc.err.err700);
    return;
  }
  var cbsdArrayIndex = cellStateList.map(item => Object.values(item)[0]).indexOf(allParam["cbsdSerialNumber"]);
  if (-1 == cbsdArrayIndex || "heartbeat" != cellStateList[cbsdArrayIndex]["nextstep"]) {
    cb(config.rc.err.err800);
    return;
  }
  cellStateList[cbsdArrayIndex]["nextstep"] = "relinquishment";
  var cbsdTimerIndex = timerList.map(item => Object.values(item)[0]).indexOf(allParam["cbsdSerialNumber"]);
  clearTimeout(timerList[cbsdTimerIndex]["grantTimerId"]);
  clearTimeout(timerList[cbsdTimerIndex]["transmitTimerId"]);
  clearTimeout(timerList[cbsdTimerIndex]["heartbeatTimerId"]);
  hbt_handler.hbt_timer_list_kill(cbsdTimerIndex)
  .then(hblist => {
    timerList = hblist;
    logger.debug("update timerList:" + timerList.length);
  })
  sas_handler.handler_sas_req(cellStateList[cbsdArrayIndex]["nextstep"], allParam["cbsdSerialNumber"])
  .then(sas_hdl_req_result => {
    return sas_handler.handler_sas_rsp(sas_hdl_req_result, cellStateList[cbsdArrayIndex]);
  })
  .then(cellState => {
    cellStateList[cbsdArrayIndex] = cellState;
    cb(config.rc.err.add(cellStateList[cbsdArrayIndex]["response"]));
  })
  .catch(err => {
    logger.error("[stopTransmit] Error catched")
    logger.error(err);
    cb(config.rc.err.err(err));
    return;
  })
}

exports.changeParameters = function(input, cb) {
  logger.debug("------------------------------------------CHANGEPARAMETERS---------------------------------------------------");
  var allParam = {};
  var sql_param;
  var acs_param;
  if(util.checkIfExist(input)){
    allParam["cbsdSerialNumber"] = input.oui + "-" + input.productClass + "-" + input.sn;
    allParam["GrantCode"] = input.GrantCode;
    allParam["GrantCodeMd5"] = md5(input.GrantCode);
  } else {
    cb(config.rc.err.err700);
    return;
  }
  var cbsdArrayIndex = cellStateList.map(item => Object.values(item)[0]).indexOf(allParam["cbsdSerialNumber"]);
  //logger.debug("CELL: "+ allParam["cbsdSerialNumber"] + " NEXT STEP: " +cellStateList[cbsdArrayIndex]["nextstep"]);
  if (-1 == cbsdArrayIndex) {
    cb(config.rc.err.err800);
    return;
  }
  //TODO: 12/17
  //mysql.sqlquery(mysql_path.chaneParamSelect(input), config.db.dbname2, null)
  var rd_param;
  readfile.ReadEnodebGPS(allParam["cbsdSerialNumber"])
  .then(rd_result => {
    rd_param = rd_result;
    logger.warn("readfile_param: " + JSON.stringify(rd_result));
    return acs.acs_api_get(acs_path.changeParamGetParam(allParam["cbsdSerialNumber"]));
  })
  .then(acs_result => {
    acs_param = acs.acs_api_resToObj(acs_result);
    logger.warn("acs_param: " + JSON.stringify(acs_param));
    acs_param["latitude"] = parseFloat(acs_param["latitude"]);
    acs_param["longitude"] = parseFloat(acs_param["longitude"]);
    logger.debug("Compare: sql_param: " + JSON.stringify(rd_param) + " acs_param: " + JSON.stringify(acs_param));

    var difference = diff(rd_param, acs_param); //compare
    if (difference) {
      for (let i = 0; i < difference.length; i++) {
        logger.debug("DIFF -> diff[" + i +"]: "+difference[i]["kind"] +" "+difference[i]["path"] +" "+difference[i]["lhs"] +" "+difference[i]["rhs"]);
        if ("latitude" == difference[i]["path"] || "longitude" == difference[i]["path"]) {
          logger.warn('GPS changed, now Derigistration');
          dp.cbrsDeregistration(input, result => {
            logger.debug("cbrsDeregistration: " + result);
            cb(config.rc.err.Changed);
            return;
          })
        } else if (
          "EARFCNUL" == difference[i]["path"] ||
          "EARFCNDL" == difference[i]["path"] ||
          "DLBandwidth" == difference[i]["path"] ||
          "ULBandwidth" == difference[i]["path"] ||
          "X_VENDOR_TxPower" == difference[i]["path"] ||
          "AdminState" == difference[i]["path"] ||
          "MaxEirp" == difference[i]["path"]
        ) {
          logger.warn('GPS changed, but DP do nothing');
          cb(config.rc.err.Changed);
        } else {
          //logger.warn('GPS not changed');
          cb(config.rc.err.noChange);
          return;
        }
      }
    } else {
      logger.debug("NO DIFFERENCE NEED REGISTRATE AGAIN");
      cb(config.rc.err.noChange);
      return;
    }
    
  })
  .catch(err => {
    logger.error("[changeParameters] Error catched");
    cb(config.rc.err.err(err));
    return;
  })
}