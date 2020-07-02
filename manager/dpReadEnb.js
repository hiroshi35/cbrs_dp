var fs = require('fs');
var log4js = require("log4js");
var config = require("../config");
var path = require("path");
var logger = log4js.getLogger(path.basename(__filename));
logger.level = config.log.level;

exports.ReadEnodebGPS = (sn) => {
  logger.debug('ReadEnodebGPS: ' + sn);
  return new Promise((resolve,reject) => {
    fs.readFile('./eNB.json', 'utf8', (err, data) => {  
      if (err) {
        reject(err);
      }
      //logger.debug(data);
      try {
        if(undefined == JSON.parse(data)[sn]) {
          reject(new Error('Undefined enodeB'));
        } else {
          resolve(JSON.parse(data)[sn]);
        }
      } catch(e) {
        reject(new Error('Undefined enodeB'));
      }
    })
  });
}


