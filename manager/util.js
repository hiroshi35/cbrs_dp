"use strict";
var config = require("../config");
var util = require("./util");
var path = require("path");
var log4js = require("log4js");
var logger = log4js.getLogger(path.basename(__filename));
var jwt = require("jsonwebtoken");
var fs = require("fs");
var mysql = require('./dpMysqlApi');
logger.level = config.log.level;

exports.check_sqlStr = function(sqlStr) {
  let i = 0;
  if (!sqlStr) {logger.error("Empty"); i = 1;}
  if (0 === sqlStr) {i = 1;}
  return i;
};

exports.fillInRegDatamodel = function(post, allParam) {
  post["userId"] = config.temp.userId;// "John Doe";//allParam["datamodel"]["Device"]["Services"]["FAPService"]["1"]["X_VENDOR_CBSD"]["UserId"]["_value"];
  post["fccId"] = config.temp.fccId;// "John Doe"; //allParam["datamodel"]["Device"]["Services"]["FAPService"]["1"]["X_VENDOR_CBSD"]["CallSign"]["_value"];
  post["callSign"] = config.temp.callSign;// "CB987"; //allParam["datamodel"]["Device"]["Services"]["FAPService"]["1"]["X_VENDOR_CBSD"]["CallSign"]["_value"];
  post["cbsdSerialNumber"] = allParam["cbsdSerialNumber"];
  post["cbsdCategory"] =
    allParam["datamodel"]["Device"]["Services"]["FAPService"]["1"]["X_VENDOR_CBSD"]["CbsdCategory"]["_value"];
  //post["cbsdInfo"] = allParam["datamodelObj"];
  post["airInterface"] = {};
  post["airInterface"]["radioTechnology"] =
    allParam["datamodel"]["Device"]["Services"]["FAPService"]["1"]["X_VENDOR_CBSD"]["RadioTechnology"]["_value"];
  if (0 == config.sas.cpiEnable) {
    post["installationParam"] = {};
    if(allParam["datamodel"]["Device"]["X_VENDOR"]["Location"]["Latitude"]["_value"] == null) {
      post["installationParam"]["latitude"] = 0;
    } else {
      post["installationParam"]["latitude"] = parseFloat(
        allParam["datamodel"]["Device"]["X_VENDOR"]["Location"]["Latitude"]["_value"]
      );
    }
    if(allParam["datamodel"]["Device"]["X_VENDOR"]["Location"]["Longitude"]["_value"] == null ){
      post["installationParam"]["longitude"] = 0;
    } else {
      post["installationParam"]["longitude"] = parseFloat(
        allParam["datamodel"]["Device"]["X_VENDOR"]["Location"]["Longitude"]["_value"]
      );
    }
    post["installationParam"]["height"] = config.temp.height;//0; //allParam["datamodel"]["Device"]["Services"]["FAPService"]["1"]["X_VENDOR_CBSD"]["InstallationParam"]["Height"]["_value"]; //blank
    post["installationParam"]["heightType"] = config.temp.heightType;//"AGL"; //allParam["datamodel"]["Device"]["Services"]["FAPService"]["1"]["X_VENDOR_CBSD"]["InstallationParam"]["HeightType"]["_value"]; //blank
    post["installationParam"]["horizontalAccuracy"] = config.temp.horizontalAccuracy;//48; //allParam["datamodel"]["Device"]["Services"]["FAPService"]["1"]["X_VENDOR_CBSD"]["InstallationParam"]["HorizontalAccuracy"]["_value"];
    post["installationParam"]["verticalAccuracy"] = config.temp.verticalAccuracy;//2; //allParam["datamodel"]["Device"]["Services"]["FAPService"]["1"]["X_VENDOR_CBSD"]["InstallationParam"]["VerticalAccuracy"]["_value"];
    post["installationParam"]["indoorDeployment"] =
      allParam["datamodel"]["Device"]["Services"]["FAPService"]["1"]["X_VENDOR_CBSD"]["InstallationParam"]["IndoorDeployment"][
        "_value"
      ];
    post["installationParam"]["antennaAzimuth"] = config.temp.antennaAzimuth;//271; //allParam["datamodel"]["Device"]["Services"]["FAPService"]["1"]["X_VENDOR_CBSD"]["InstallationParam"]["AntennaAzimuth"]["_value"];
    post["installationParam"]["antennaDowntilt"] = config.temp.antennaDowntilt;//3; //allParam["datamodel"]["Device"]["Services"]["FAPService"]["1"]["X_VENDOR_CBSD"]["InstallationParam"]["AntennaDowntilt"]["_value"];
    post["installationParam"]["antennaGain"] = config.temp.antennaGain;//16; //allParam["datamodel"]["Device"]["Services"]["FAPService"]["1"]["X_VENDOR_CBSD"]["InstallationParam"]["AntennaGain"]["_value"];
    post["installationParam"]["eirpCapability"] = config.temp.eirpCapability;//30; //allParam["datamodel"]["Device"]["Services"]["FAPService"]["1"]["X_VENDOR_CBSD"]["InstallationParam"]["EirpCapability"]["_value"];
    post["installationParam"]["antennaBeamwidth"] = config.temp.antennaBeamwidth;//30; //allParam["datamodel"]["Device"]["Services"]["FAPService"]["1"]["X_VENDOR_CBSD"]["InstallationParam"]["AntennaBeamwidth"]["_value"];
    post["installationParam"]["antennaModel"] = config.temp.antennaModel;//"Wire dipole";
  } //allParam["datamodel"]["Device"]["Services"]["FAPService"]["1"]["X_VENDOR_CBSD"]["InstallationParam"]["AntennaModel"]["_value"]; //blank
  post["groupingParam"] = [{}];
  post["groupingParam"][0]["groupType"] =
    allParam["datamodel"]["Device"]["Services"]["FAPService"]["1"]["X_VENDOR_CBSD"]["GroupParam"]["GroupType"]["_value"]; //blank
  post["groupingParam"][0]["groupId"] = "example-group-3"; //allParam["datamodel"]["Device"]["Services"]["FAPService"]["1"]["X_VENDOR_CBSD"]["GroupParam"]["GroupId"]["_value"];
  if (1 == config.sas.cpiEnable) {
    var payload = {};
    util.fillInCpiSignedDatamodel(allParam, payload);
    var privateKey = fs.readFileSync("./cert/cpicertprivkey.key");
    var token = jwt.sign(JSON.stringify(payload), privateKey, { algorithm: "RS256" });
    var cpi = token.split(".");
    post["cpiSignatureData"] = {};
    post["cpiSignatureData"]["protectedHeader"] = cpi[0]; //"eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9";//allParam["datamodel"]["Device"]["Services"]["FAPService"]["1"]["X_VENDOR_CBSD"]["CpiSignatureData"]["ProtectedHeader"]["_value"]; //blank
    post["cpiSignatureData"]["encodedCpiSignedData"] = cpi[1]; //"eyJmY2NJZCI6IkpvaG4gRG9lIiwiY2JzZFNlcmlhbE51bWJlciI6IkQ4MjM5NTYwNDciLCJpbnN0YWxsYXRpb25QYXJhbSI6eyJsYXRpdHVkZSI6MzcuNDI1MDU2LCJsb25naXR1ZGUiOi0yMi4wODQxMTMsImhlaWdodCI6OS4zLCJoZWlnaHRUeXBlIjoiQUdMIiwiaG9yaXpvbnRhbEFjY3VyYWN5Ijo0OCwidmVydGljYWxBY2N1cmFjeSI6MiwiaW5kb29yRGVwbG95bWVudCI6dHJ1ZSwiYW50ZW5uYUF6aW11dGgiOjI3MSwiYW50ZW5uYURvd250aWx0IjozLCJhbnRlbm5hR2FpbiI6MCwiZWlycENhcGFiaWxpdHkiOjMwLCJhbnRlbm5hQmVhbXdpZHRoIjozMCwiYW50ZW5uYU1vZGVsIjoiV2lyZSBkaXBvbGUifSwicHJvZmVzc2lvbmFsSW5zdGFsbGVyRGF0YSI6eyJjcGlJZCI6IjEyMzQ1Njc4OSIsImNwaU5hbWUiOiJ0aGlzaXNjcGluYW1lIiwiaW5zdGFsbENlcnRpZmljYXRpb25UaW1lIjoiMjAxOC0xMi0xMlQwNTowNTowNVoifSwiaWF0IjoxNTYxNTA5NTQyfQ";//allParam["Device"]["Services"]["FAPService"]["1"]["X_VENDOR_CBSD"]["CpiSignatureData"]["EncodedCpiSignedData"]["_value"]; //blank
    post["cpiSignatureData"]["digitalSignature"] = cpi[2];
  }
  post["measCapability"] = allParam["datamodel"]["Device"]["Services"]["FAPService"]["1"]["X_VENDOR_CBSD"]["MeasCapability"][
    "_value"
  ].split(",");
  //logger.warn(post["MeasCapability"]);
};

exports.fillInCpiSignedDatamodel = function(allParam, payload) {
  payload["fccId"] = config.temp.fccId; // "John Doe"; //"John";//get data from acs
  payload["cbsdSerialNumber"] = allParam["cbsdSerialNumber"]; //"D823956047";//get data from acs
  payload["installationParam"] = {};
  payload["installationParam"]["latitude"] = parseFloat(
    allParam["datamodel"]["Device"]["X_VENDOR"]["Location"]["Latitude"]["_value"]
  );
  payload["installationParam"]["longitude"] = parseFloat(
    allParam["datamodel"]["Device"]["X_VENDOR"]["Location"]["Longitude"]["_value"]
  );
  payload["installationParam"]["height"] = config.temp.height;//0; //allParam["datamodel"]["Device"]["Services"]["FAPService"]["1"]["X_VENDOR_CBSD"]["InstallationParam"]["Height"]["_value"]; //blank
  payload["installationParam"]["heightType"] = config.temp.heightType;//"AGL"; //allParam["datamodel"]["Device"]["Services"]["FAPService"]["1"]["X_VENDOR_CBSD"]["InstallationParam"]["HeightType"]["_value"]; //blank
  payload["installationParam"]["horizontalAccuracy"] = config.temp.horizontalAccuracy;//48; //allParam["datamodel"]["Device"]["Services"]["FAPService"]["1"]["X_VENDOR_CBSD"]["InstallationParam"]["HorizontalAccuracy"]["_value"];
  payload["installationParam"]["verticalAccuracy"] = config.temp.verticalAccuracy;//2; //allParam["datamodel"]["Device"]["Services"]["FAPService"]["1"]["X_VENDOR_CBSD"]["InstallationParam"]["VerticalAccuracy"]["_value"];
  payload["installationParam"]["indoorDeployment"] =
    allParam["datamodel"]["Device"]["Services"]["FAPService"]["1"]["X_VENDOR_CBSD"]["InstallationParam"]["IndoorDeployment"]["_value"];
  payload["installationParam"]["antennaAzimuth"] = config.temp.antennaAzimuth;//271; //allParam["datamodel"]["Device"]["Services"]["FAPService"]["1"]["X_VENDOR_CBSD"]["InstallationParam"]["AntennaAzimuth"]["_value"];
  payload["installationParam"]["antennaDowntilt"] = config.temp.antennaDowntilt;//3; //allParam["datamodel"]["Device"]["Services"]["FAPService"]["1"]["X_VENDOR_CBSD"]["InstallationParam"]["AntennaDowntilt"]["_value"];
  payload["installationParam"]["antennaGain"] = config.temp.antennaGain;//16; //allParam["datamodel"]["Device"]["Services"]["FAPService"]["1"]["X_VENDOR_CBSD"]["InstallationParam"]["AntennaGain"]["_value"];
  payload["installationParam"]["eirpCapability"] = config.temp.eirpCapability;//30; //allParam["datamodel"]["Device"]["Services"]["FAPService"]["1"]["X_VENDOR_CBSD"]["InstallationParam"]["EirpCapability"]["_value"];
  payload["installationParam"]["antennaBeamwidth"] = config.temp.antennaBeamwidth;//30; //allParam["datamodel"]["Device"]["Services"]["FAPService"]["1"]["X_VENDOR_CBSD"]["InstallationParam"]["AntennaBeamwidth"]["_value"];
  payload["installationParam"]["antennaModel"] = config.temp.antennaModel;//"Wire dipole"; //allParam["datamodel"]["Device"]["Services"]["FAPService"]["1"]["X_VENDOR_CBSD"]["InstallationParam"]["AntennaModel"]["_value"]; //blank
  payload["professionalInstallerData"] = {};
  payload["professionalInstallerData"]["cpiId"] = config.temp.cpiId;//"123456789"; //get data from acs
  payload["professionalInstallerData"]["cpiName"] = config.temp.cpiName;//"thisiscpiname"; //get data from acs
  payload["professionalInstallerData"]["installCertificationTime"] = config.temp.installCertificationTime;//"2018-12-12T05:05:05Z"; //get data from acs
};

exports.checkIfExist = function(input) {
  if (
    "string" === typeof input.oui &&
    "string" === typeof input.productClass &&
    "string" === typeof input.sn &&
    "string" === typeof input.GrantCode
  ) {
    return 1;
  } else {
    return -1;
  }
}

exports.checkIfExistArray = function(cbsd, cellStateList) {
  var cbsdArrayIndex = cellStateList.map(item => Object.values(item)[0]).indexOf(cbsd);
  if (cbsdArrayIndex >= 0) {
    //logger.warn("Existed!");
    //logger.debug("cellStateList:" + JSON.stringify(cellStateList) + "\n" + "cbsdArrayIndex:" + cbsdArrayIndex);
    return cbsdArrayIndex;
  } else if (cbsdArrayIndex == -1) {
    //logger.debug("Not existed, add new device!");
    //Push new cell obj
    cellStateList.push({
      cbsdSerialNumber: cbsd,
      response: -1,
      nextstep: ""
    });
    //return cellStateList.map(item => Object.values(item)[0]).indexOf(cbsd);
    return -1;
  }
}

exports.checkIfExistTimeArray = function(cbsd, timerList) {
  var cbsdTimerIndex = timerList.map(item => Object.values(item)[0]).indexOf(cbsd);
  if (cbsdTimerIndex >= 0) {
    logger.warn("Existed in TimeArray!");
    //logger.debug("timerList:" + JSON.stringify(timerList) + "\n" + "cbsdTimerIndex:" + cbsdTimerIndex);
    clearTimeout(timerList[cbsdTimerIndex]["grantTimerId"]);
    clearTimeout(timerList[cbsdTimerIndex]["transmitTimerId"]);
    clearTimeout(timerList[cbsdTimerIndex]["heartbeatTimerId"]);
    return cbsdTimerIndex;
  } else if (cbsdTimerIndex == -1) {
    logger.debug("Not existed, add in TimeArray!");
    //Push new cell obj
    timerList.push({
      cbsdSerialNumber: cbsd,
      response: -1,
      nextstep: ""
    });
    cbsdTimerIndex = timerList.map(item => Object.values(item)[0]).indexOf(cbsd);
    //return timerList.map(item => Object.values(item)[0]).indexOf(cbsd);
    return cbsdTimerIndex;
  }
}

function devideFreq(low, high, bandwidth) {
  var earfcnArr = [];
  var temp = high - low;
  for (var i = 0; i < temp/bandwidth; i++) {
    var earfcn = (low + (bandwidth/2) + i*10 - 3400  + 4159)*10;
    var earfcnObj = {'earfcn': earfcn, 'user':[]};
    earfcnArr.push(earfcnObj);
  }
  return earfcnArr;
}

exports.fillTheFreqByEnb = () => {
  var AllFreq = devideFreq(config.freq.low, config.freq.high, config.freq.bandwidth);
  logger.warn(AllFreq);
  const earfcn_band = "SELECT cbsdSerialNumber ,EARFCNDL, DLBandwidth FROM Group_SC_info;";
  return new Promise((resolve,reject) => {
    mysql.sqlquery(earfcn_band, config.db.dbname1, null)
    .then(mysql_result => {
      //logger.error(mysql_result);
      for (var i = 0; i < mysql_result[1].length; i++) {
        console.log(mysql_result[1][i]);
        //console.log('---------------------------------------------------------------------');
        if (mysql_result[1][i].EARFCNDL !== 0) {
          var obj = AllFreq.find(element => element.earfcn == mysql_result[1][i].EARFCNDL);
          //logger.warn(obj);
          obj.user.push(mysql_result[1][i].cbsdSerialNumber);
          //logger.debug(AllFreq);
        }
      }
      resolve(AllFreq);
    })
    .catch(err => {
      logger.error(err);
      reject(err);
    })
  })
}

exports.getFrequency = (cbsdsn) => {
  console.log(config.freq.AllFreq);
  return new Promise((resolve, reject) => {
    var temp = Math.min(...config.freq.AllFreq.map(ele => ele.user.length));
    for (var i = 0; i < config.freq.AllFreq.length; i++) {
      if (config.freq.AllFreq[i].user.length === temp) {
        config.freq.AllFreq[i].user.push(cbsdsn);
        logger.warn('EnodeB SN : '+ cbsdsn + ' , get frequency => ' + config.freq.AllFreq[i].earfcn);
        resolve(config.freq.AllFreq[i].earfcn);
        return;
      }
    }
    reject(-1);
    return;
  })
}

exports.relFrequency = (cbsdsn) => {
  return new Promise((resolve, reject) => {
    const findFreq = "SELECT EARFCNDL FROM Group_SC_info WHERE cbsdSerialNumber ='" + cbsdsn + "';";
    mysql.sqlquery(findFreq, config.db.dbname1, null)
    .then(res => {
      //logger.warn(config.freq.AllFreq);
      //logger.error(res[1]);
      //logger.error(res[1][0].EARFCNDL);
      var found = config.freq.AllFreq.indexOf(config.freq.AllFreq.find(ele => ele.earfcn == res[1][0].EARFCNDL));
      //logger.error(config.freq.AllFreq[found]);
      var index = config.freq.AllFreq[found].user.indexOf(config.freq.AllFreq[found].user.find(ele => ele == cbsdsn));
      if (index == -1) {
        reject(-1);
      } else {
        config.freq.AllFreq[found].user.splice(index,1);
        logger.warn('EnodeB SN : '+ cbsdsn + ' , release frequency => ' + config.freq.AllFreq[found].earfcn);
        resolve(config.freq.AllFreq[found].earfcn);
      }
    })
    .catch(err => {
      logger.error(err);
      reject(err);
    })
  });
}

// exports.readEnvConfig = function(option) {
//   logger.debug('option: ' + option);
//   return new Promise((resolve,reject) => {
//     fs.readFile('./env.json', 'utf8', (err, data) => {  
//       if (err) {
//         reject(err);
//       }
//       try {
//         if(undefined == JSON.parse(data)[option]) {
//           reject(new Error('Undefined enodeB'));
//         } else {
//           resolve(JSON.parse(data)[option]);
//         }
//       } catch(e) {
//         reject(new Error('Undefined enodeB'));
//       }
//     });
//   });
// }