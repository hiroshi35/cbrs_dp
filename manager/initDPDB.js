const mysql = require('./dpMysqlApi');
//const create = require('./initDPDB');

const db = 'CREATE DATABASE IF NOT EXISTS DP_Manage;';
const table = "CREATE TABLE IF NOT EXISTS Group_SC_info (" +
"cbsdSerialNumber varchar(64) DEFAULT '' NOT NULL," +
"userId varchar(16) DEFAULT '' NOT NULL," +
"fccId varchar(19) DEFAULT '' NOT NULL," +
"callSign varchar(16) DEFAULT '' NOT NULL," +
"cbsdId varchar(64) DEFAULT '' NOT NULL," +
"grantCode int(11) DEFAULT -1 NOT NULL," +
"measCapability varchar(64) DEFAULT '' NOT NULL," +
"Category varchar(1) DEFAULT '' NOT NULL," +
"groupId varchar(128) DEFAULT '' NOT NULL," +
"groupType varchar(128) DEFAULT '' NOT NULL," +
"grantId varchar(32) DEFAULT '' NOT NULL," +
"hardwareVersion varchar(64) DEFAULT '' NOT NULL," +
"softWareVersion varchar(64) DEFAULT '' NOT NULL," +
"firmWareVersion varchar(64) DEFAULT '' NOT NULL," +
"lowFrequency int(8) unsigned NOT NULL DEFAULT '0'," +
"highFrequency int(8) unsigned NOT NULL DEFAULT '0'," +
"EARFCNDL int(8) unsigned NOT NULL DEFAULT '0'," +
"EARFCNUL int(8) unsigned NOT NULL DEFAULT '0'," +
"DLBandwidth int(8) unsigned NOT NULL DEFAULT '0'," +
"ULBandwidth int(8) unsigned NOT NULL DEFAULT '0'," +
"channelType varchar(8) DEFAULT '' NOT NULL," +
"ruleApplied varchar(16) DEFAULT '' NOT NULL," +
"maxEirp int(8) NOT NULL DEFAULT '0'," +
"Txpower int(8) NOT NULL DEFAULT '0'," +
"grantExpireTime datetime NOT NULL DEFAULT '1970-01-01 00:00:01'," +
"heartbeatInterval int(8) unsigned NOT NULL DEFAULT '0'," +
"transmitExpireTime datetime NOT NULL DEFAULT '1970-01-01 00:00:01'," +
"State int(4) unsigned NOT NULL DEFAULT '0'," +
"timestamp datetime NOT NULL DEFAULT '1970-01-01 00:00:01'," +
"PRIMARY KEY (cbsdSerialNumber)" +
");"

const del = 'DELETE FROM Group_SC_info;'

exports.createdb = function(){
  mysql.sqlquery(db, null, null)
  .then((res) => {
    return mysql.sqlquery(table, "DP_Manage", null);
  })
  .then((res) => {
    return mysql.sqlquery(del, "DP_Manage", null);
  })
  .catch((err) => {
    console.log(err);
  })

}

//create.createdb();






