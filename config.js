"use strict";
var fs = require("fs");

const config = {};
config.log = {};
config.log.level = "debug";

config.rc = {};
config.rc.err = {};
config.rc.err.errInput = '{"result":"-1", "message":{"cause": "Error input!"}}';
config.rc.err.errMysql = '{"result":"-1", "message":{"cause": "Mysql error!"}}';
config.rc.err.err700 = '{"result":"700", "message":{"cause": "JSON format error!"}}';
config.rc.err.err800 = '{"result":"800", "message":{"cause": "API step error!"}}';
config.rc.err.err500 = '{"result":"500", "message":{"cause": "Unknown error!"}}';
config.rc.err.noChange = '{"result":"900", "message":{"cause": "No param changed!"}}';
config.rc.err.Changed = '{"result":"0", "message":{"cause": "Param changed!"}}';
config.rc.err.flag = '{"result":"0", "message":{"cause": "fake API"}}';
config.rc.err.add = (errcode) => {
  var str = '{"result":"'+errcode+'"}';
  return str;
};
config.rc.err.err = (errcode) => {
  var str = '{"result":"-1", "message":{"cause": "'+errcode+'"}}';
  return str;
};

var env = fs.readFileSync("./env.json",'utf8');
config.db = {};
config.db.host = "127.0.0.1";
config.db.user = JSON.parse(env)['mysql'].user;
config.db.pwd = JSON.parse(env)['mysql'].passwd;
config.db.dbname1 = "DP_Manage";
config.db.dbname2 = "son_field_setting";
config.db.dbtable = "Group_SC_info";

config.acs = {};
config.acs.host = "127.0.0.1";
config.acs.port = 7557;

config.freq = {};
config.freq.AllFreq = [];
config.freq.low = 3550;
config.freq.high = 3600;
config.freq.bandwidth = 20;
config.freq.dynamicAllocation = 0;

//SAS
config.sas = {};
config.sas.host = JSON.parse(env)['sas'].ip
config.sas.port = 5000;
//config.sas.key = fs.readFileSync("");
//config.sas.cert = fs.readFileSync("");
// config.sas.key = fs.readFileSync("./cert/client.key");
config.sas.key = "./cert/client.key";
// config.sas.key = "./cert/domainproxyuutpriv.key";
config.sas.cert = "./cert/client.pem";
// config.sas.cert = "./cert/dpuutcert.pem";
config.sas.ca = "./cert/server.pem";
// config.sas.ca = "./cert/cbrs_ca1.pem";
// config.sas.crl_path = "./cert/crlserverfordp.crl";

// config.sas.key = "./cert/client_old.key";
// config.sas.cert = "./cert/client_old.pem";
// config.sas.ca = "./cert/server_old.pem";

/*
config.sas.postdata = JSON.stringify({
  registrationRequest: [
    {
      userId: "John Doe",
      fccId: "John Doe",
      cbsdSerialNumber: "D823956047"
    }
  ]
});
*/
config.sas.cpiEnable = JSON.parse(env)['cpiEnable'];

config.sas.postdata = {
  registrationRequest: [
    {
      //userId: "John Doe",
      //fccId: "John Doe",
      //cbsdSerialNumber: "D823956047"
    }
  ]
};

config.sas.postdata2 = {
  registrationRequest: [
    {
      //userId: "John Bee",
      //fccId: "John Bee",
      //cbsdSerialNumber: "D823634126"
    }
  ]
};

config.sas.deregister = JSON.stringify({
  deregistration: [
    {
      cbsdId: ""
    }
  ]
});

//CRL related
config.crl = {};
// config.crl.file_pos = "/home/k100/workspace/dp_forSON/cert/crlserverfordp.crl";
module.exports = config;

config.temp = {};
config.temp.fccId = JSON.parse(env)['tempParam'].fccId;
config.temp.userId = JSON.parse(env)['tempParam'].userId;
config.temp.callSign = JSON.parse(env)['tempParam'].callSign;
config.temp.height = JSON.parse(env)['tempParam'].installationParam.height;
config.temp.heightType = JSON.parse(env)['tempParam'].installationParam.heightType;
config.temp.horizontalAccuracy = JSON.parse(env)['tempParam'].installationParam.horizontalAccuracy;
config.temp.verticalAccuracy = JSON.parse(env)['tempParam'].installationParam.verticalAccuracy;
config.temp.antennaAzimuth = JSON.parse(env)['tempParam'].installationParam.antennaAzimuth;
config.temp.antennaDowntilt = JSON.parse(env)['tempParam'].installationParam.antennaDowntilt;
config.temp.antennaGain = JSON.parse(env)['tempParam'].installationParam.antennaGain;
config.temp.eirpCapability = JSON.parse(env)['tempParam'].installationParam.eirpCapability;
config.temp.antennaBeamwidth = JSON.parse(env)['tempParam'].installationParam.antennaBeamwidth;
config.temp.antennaModel = JSON.parse(env)['tempParam'].installationParam.antennaModel;
config.temp.cpiId = JSON.parse(env)['tempParam'].professionalInstallerData.cpiId;
config.temp.cpiName = JSON.parse(env)['tempParam'].professionalInstallerData.cpiName;
config.temp.installCertificationTime = JSON.parse(env)['tempParam'].professionalInstallerData.installCertificationTime;
config.temp.groupType = JSON.parse(env)['tempParam'].groupingParam.groupType;
config.temp.groupId = JSON.parse(env)['tempParam'].groupingParam.groupId;
