"use strict";
var config = require("../config");
var path = require("path");
var log4js = require("log4js");
var dp = require("../manager/dpManager");
var logger = log4js.getLogger(path.basename(__filename));
logger.level = config.log.level;

exports.postParse = function(req, cb) {
  var sbi = req.url.split("/");
  var body = req.body;
  //console.log(req);
  //console.log(`In postParse: ${sbi}`);

  if (sbi[1] === "son") {
    //console.log("son");
    if (sbi[2] === "cbrs") {
      if (sbi[3] === "cbrsRegistration") {
        //About callback (not sure)
        dp.cbrsRegistration(body, function(result) {
          //Return Code
          cb(result);
          return;
        });
      } else if (sbi[3] === "getFrequency") {
        dp.getFrequency(body, function(result) {
          //Return Code
          cb(result);
          return;
        });
      } else if (sbi[3] === "cbrsDeregistration") {
        dp.cbrsDeregistration(body, function(result) {
          cb(result);
        });
      } else if (sbi[3] === "eNBStopTransmit") {
        dp.cbrsStopTransmit(body, function(result) {
          cb(result);
        });
      } else if (sbi[3] === "changeParameters") {
        dp.changeParameters(body, function(result) {
          cb(result);
        })
      } else {
        console.log("error");
        cb(config.rc.err.errInput);
      }
    }
  } else {
    console.log("error");
    cb(config.rc.err.errInput);
  }
};
