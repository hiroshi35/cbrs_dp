var http = require("http");
var config = require("../config");
var path = require("path");
var retry = require("retry");
var log4js = require("log4js");
var logger = log4js.getLogger(path.basename(__filename));
logger.level = config.log.level;

function acs_api_get_redo(acsStr) {
  let str = [];
  var options = {
    hostname: config.acs.host,
    port: config.acs.port,
    path: acsStr,
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    }
  };

  return new Promise ((resolve, reject) => {
    const acs_req = http.request(options, res => {
      res.setEncoding("utf8");
      res.on("data", chunk => {
        str.push(chunk);
      });
      res.on("end", () => {
        var data = str[1];
        try{
          data = JSON.parse(data);
          //logger.debug("acs_api_get: " + str[1]);
          resolve(data);
        }
        catch(e){
          reject(e);
        }
      });
    });

    acs_req.on("error", (e) => {
      resolve(e);
    })
    acs_req.end();
  });
}

function acs_api_post_redo(path, postdata) {
  let str = [];
  var options = {
    hostname: config.acs.host,
    port: config.acs.port,
    path: path,
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    }
  };

  return new Promise ((resolve, reject) => {
    const acs_req = http.request(options, res => {
      res.setEncoding("utf8");
      res.on("data", chunk => {
        str.push(chunk);
      });
      res.on("end", () => {
        try{
          var data = JSON.parse(str[0]);
          resolve(data);
        }
        catch(e){
          reject(e);
        }
      });
      acs_req.on("error", (e) => {
        resolve(e);
      });
    });
    acs_req.write(postdata); //JSON
    acs_req.end();
  });
}

exports.acs_api_get = (acsStr) => {
  var operation = retry.operation({
    retries: 2,
    factor: 3,
    minTimeout: 1 * 1000,
    maxTimeout: 60 * 1000,
    randomize: true
  });

  return new Promise((resolve, reject) => {
    operation.attempt((currentAttempt) => {
      logger.debug("Connect Times:" + currentAttempt);
      acs_api_get_redo(acsStr)
      .then((data) => {
        if(!(data instanceof Error))
        logger.debug('GET acs rsp successlly');
        //resolve(data);
        else if (operation.retry(data)) {
          data = null;
          logger.error("can't not connect to ACS");
          return;
        }
        if(data instanceof Error) {
          reject(620);
        } else {
          resolve(data);
        };
      })
      .catch((err) => {
        logger.error("Can't not connect to ACS");
        reject(new Error("[GET] Can't not connect to ACS"));
        return;
      })
    });
  });
};

exports.acs_api_post = (path, postdata, cb) => {
  var operation = retry.operation({
    retries: 2,
    factor: 3,
    minTimeout: 1 * 1000,
    maxTimeout: 60 * 1000,
    randomize: true
  });

  return new Promise((resolve, reject) => {
    operation.attempt((currentAttempt) => {
      logger.debug("Connect Times:" + currentAttempt);

      acs_api_post_redo(path, postdata)
      .then((data) => {
        if(!(data instanceof Error)) {
          logger.debug('[POST] acs rsp successlly')
          resolve(data);
        } else if (operation.retry(data)) {
          data = null;
          logger.error("can't not connect to ACS");
          return;
        }
        if(data instanceof Error) {
          reject(620);
        } else {
          resolve(data);
        };
      })
      .catch((err) => {
        logger.error("[POST] can't not connect to ACS");
        reject(new Error("[POST] Can't not connect to ACS"));
        return;
      })
    });
  });
};

exports.acs_api_resToObj = function(acs_result) {
  var obj = {};
  logger.debug(
      JSON.stringify(acs_result["Device"]["X_VENDOR"]["Location"]["Latitude"]) +
      JSON.stringify(acs_result["Device"]["X_VENDOR"]["Location"]["Longitude"])
  ); //["_value"]);
  if (acs_result["Device"]["X_VENDOR"]["Location"]["Latitude"]["_value"]) {
    obj["latitude"] = acs_result["Device"]["X_VENDOR"]["Location"]["Latitude"]["_value"];
  }
  if (acs_result["Device"]["X_VENDOR"]["Location"]["Longitude"]["_value"]) {
    obj["longitude"] = acs_result["Device"]["X_VENDOR"]["Location"]["Longitude"]["_value"];
  }
  /*
  if (acs_result["Device"]["Services"]["X_VENDOR_CBSD"]["FccId"]["_value"]) {
    obj["FccId"] = acs_result["Device"]["Services"]["X_VENDOR_CBSD"]["FccId"]["_value"];
  }
  if (acs_result["Device"]["Services"]["X_VENDOR_CBSD"]["CallSign"]["_value"]) {
    obj["CallSign"] = acs_result["Device"]["Services"]["X_VENDOR_CBSD"]["CallSign"]["_value"];
  }
  if (acs_result["Device"]["Services"]["FAPService"]["FAPControl"]["LTE"]["AdminState"]) {
    obj["Adminstate"] = acs_result["Device"]["Services"]["FAPService"]["FAPControl"]["LTE"]["AdminState"];
  }
  if (acs_result["Device"]["Services"]["FAPService"]["CellConfig"]["LTE"]["RAN"]["RF"]["X_VENDOR_TxPower"]) {
    obj["TxPower"] =
      acs_result["Device"]["Services"]["FAPService"]["CellConfig"]["LTE"]["RAN"]["RF"]["X_VENDOR_TxPower"];
  }
  */
  return obj;
};
