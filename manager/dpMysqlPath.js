'use strict'
const config = require('../config');

const mysqlPath = {};
// mysqlPath.regPathInsert = (cbsd) => {
//   var str = "INSERT INTO Group_SC_info ( cbsdSerialNumber, softWareVersion, grantCode) VALUES ('" +
//   cbsd["cbsdSerialNumber"] +
//   "', '" +
//   cbsd["softwareVersion"] +
//   "', '" +
//   cbsd["GrantCode"] +
//   "');";
//   return str;
// }

mysqlPath.regPathInsert = (cbsd) => {
  var str = "INSERT INTO Group_SC_info ( cbsdSerialNumber, softWareVersion, grantCode, lowFrequency, highFrequency) VALUES ('" +
  cbsd["cbsdSerialNumber"] +
  "', '" +
  cbsd["softwareVersion"] +
  "', '" +
  cbsd["GrantCode"] +
  "', 3550000000, 3700000000);";
  return str;
}

mysqlPath.regPathDelete = (cbsd) => {
  var str = "DELETE FROM Group_SC_info WHERE cbsdSerialNumber ='" + cbsd["cbsdSerialNumber"] + "';"
  return str;
}

mysqlPath.regPathUpdateState = (cbsd) => {
  var str =
    "UPDATE " +
    config.db.dbtable +
    ' SET State = 0' +
    ' ,grantCode = "' +
    cbsd["GrantCode"] +
    '" WHERE cbsdSerialNumber = "' +
    cbsd["cbsdSerialNumber"] +
    '";';
    return str;
}

mysqlPath.regPathUpdate = (cbsd) => {
  var str = "UPDATE " +
    config.db.dbtable +
    ' SET softWareVersion ="' +
    cbsd["cbsdSerialNumber"] +
    '",grantCode = "' +
    cbsd["GrantCode"] +
    '",lowFrequency = 3550000000, highFrequency = 3700000000 WHERE cbsdSerialNumber = "' +
    cbsd["cbsdSerialNumber"] +
    '";';
  return str;
}

mysqlPath.getFreqUpdate = (cbsd) => {
  var sqlStr =
      "UPDATE Group_SC_info SET maxEirp = '" +
      cbsd["maxEirp"] +
      "', grantCode ='" +
      cbsd["GrantCode"] +
      "', EARFCNDL ='" +
      cbsd["EARFCNDL"] +
      "', EARFCNUL ='" +
      cbsd["EARFCNUL"] +
      "', lowFrequency ='" +
      cbsd["lowFrequency"] +
      "', highFrequency ='" +
      cbsd["highFrequency"] +
      "' WHERE cbsdSerialNumber = '" +
      cbsd["cbsdSerialNumber"] +
      "';";
  return sqlStr;
}

mysqlPath.getFreqSelect = (cbsd) => {
  var sqlStr =
      "SELECT lowFrequency, highFrequency, maxEirp FROM Group_SC_info WHERE cbsdSerialNumber = '" +
      cbsd["cbsdSerialNumber"] +
      "';";
  return sqlStr;
}

mysqlPath.getFreqUpdate2 = (cbsd) => {
  var sqlStr =
    "UPDATE Group_SC_info SET Txpower ='" +
    cbsd["maxEirp"] +
    "', EARFCNDL ='" +
    cbsd["EARFCNDL"] +
    "', EARFCNUL ='" +
    cbsd["EARFCNUL"] +
    "', DLBandwidth ='" +
    cbsd["DLBandwidth"] +
    "', ULBandwidth ='" +
    cbsd["ULBandwidth"] +
    "' WHERE cbsdSerialNumber ='" +
    cbsd["cbsdSerialNumber"] +
    "';";
    return sqlStr;
}

mysqlPath.getFreqUpdate3 = (cbsd) => {
  var sqlStr = "UPDATE device_info SET getFreq = 1 WHERE sn ='" + cbsd.sn + "';";
  return sqlStr;
}

mysqlPath.deregPathDel = (cbsd) => {
  var sqlStr = "DELETE FROM Group_SC_info WHERE cbsdSerialNumber ='"+ cbsd["cbsdSerialNumber"] + "';";
  return sqlStr;
}

mysqlPath.chaneParamSelect = (cbsd) => {
  var sqlStr =
    'SELECT latitude, longitude FROM device_info WHERE oui = "' +
    cbsd.oui +
    '" AND sn = "' +
    cbsd.sn +
    '" AND productClass = "' +
    cbsd.productClass +
    '";';
    
    return sqlStr;
}

mysqlPath.regPathFindGPS = (cbsd) => {
  var str = 'SELECT latitude, longitude FROM device_info WHERE oui = "' +
    cbsd.oui +
    '" AND sn = "' +
    cbsd.sn +
    '" AND productClass = "' +
    cbsd.productClass +
    '";';
  return str;
}

module.exports = mysqlPath;