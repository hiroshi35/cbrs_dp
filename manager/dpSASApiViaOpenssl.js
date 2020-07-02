"use strict";

const config = require("../config");
const retry = require("retry");
const path = require("path");
const log4js = require("log4js");
const logger = log4js.getLogger(path.basename(__filename));
logger.level = config.log.level;

const { spawn } = require('child_process');
const ca = config.sas.ca; 
const key = config.sas.key; 
const cert = config.sas.cert; 
const crl = './cert/crlserver.crl';
// const crl = './cert/crl_old.crl';
const ip = config.sas.host + ':5000';
// const sslcmdarr = ['s_client', '-connect', ip, '-tls1_2', '-verify', '1', '-verify_return_error', '-CAfile', ca, '-cert', cert, '-key', key, '-state', '-debug'];
const sslcmdarrcrl2 = ['s_client', '-connect', ip, '-CRL', crl, '-CRLform', 'PEM', '-crl_check', '-tls1_2', '-verify', '1', '-verify_return_error', '-CAfile', ca, '-cert', cert, '-key', key, '-state', '-debug'];
let checkCertError = 0;
function sas_api_redo(procedure, post_data) {
  
  return new Promise((resolve,reject) => {

    var request_timer = setTimeout(() => {
      return;
      //console.log("Request Timeout!");
    }, 3000);

    var tls = spawn('openssl',sslcmdarrcrl2);
    // logger.warn(tls.stderr);
    tls.stdout.on('data', (data) => {
      var str = '';
      var dataparse = data.toString();
      // console.log(dataparse);
      // console.log('----------------------------------------------------------------------');
      if (dataparse.indexOf('deregistrationResponse') > 0) {
        // logger.error(dataparse);
        str = dataparse.substring(dataparse.indexOf('deregistrationResponse')-5,dataparse.lastIndexOf('}')+1);
        logger.warn('deregistrationResponse: \n' + str);
        try {resolve(JSON.parse(str));} catch(e) { reject(1000); }
        tls.kill();
        return;
      } else if (dataparse.indexOf('registrationResponse') > 0) {
        str = dataparse.substring(dataparse.indexOf('registrationResponse')-5,dataparse.lastIndexOf('}')+1); //ok
        logger.warn('registrationResponse: \n' + str);
        try {resolve(JSON.parse(str));} catch(e) { reject(1000); }
        tls.kill();
        return;
      } else if (dataparse.indexOf('spectrumInquiryResponse') > 0) {
        str = dataparse.substring(dataparse.indexOf('spectrumInquiryResponse')-5,dataparse.lastIndexOf('}')+1);
        logger.warn('spectrumInquiryResponse: \n' + str);
        try {resolve(JSON.parse(str));} catch(e) { reject(1000); }
        tls.kill();
        return;
      } else if (dataparse.indexOf('grantResponse') > 0) {
        str = dataparse.substring(dataparse.indexOf('grantResponse')-5,dataparse.lastIndexOf('}')+1);
        logger.warn('grantResponse: \n' + str);
        try {resolve(JSON.parse(str));} catch(e) { reject(1000); }
        tls.kill();
        return;
      } else if (dataparse.indexOf('heartbeatResponse') > 0) {
        str = dataparse.substring(dataparse.indexOf('heartbeatResponse')-5,dataparse.lastIndexOf('}')+1);
        logger.warn('heartbeatResponse: \n' + str);
        try {resolve(JSON.parse(str));} catch(e) { reject(1000); }
        tls.kill();
        return;
      } else if (dataparse.indexOf('relinquishmentResponse') > 0) {
        str = dataparse.substring(dataparse.indexOf('relinquishmentResponse')-5,dataparse.lastIndexOf('}')+1);
        logger.warn('relinquishmentResponse: \n' + str);
        try {resolve(JSON.parse(str));} catch(e) { reject(1000); }
        tls.kill();
        return;
      } else if (dataparse.indexOf('Verification error') > 0) {
        logger.error(dataparse);
        checkCertError = 1;
        if (dataparse.indexOf('certificate has expired') > 0) {
          logger.error('[alert] certificate from SAS has expired');
          resolve(1000);
        } else if (dataparse.indexOf('unable to get local issuer certificate') > 0) {
          // logger.error(dataparse);
          logger.error('[alert] Unknown CA');
          resolve(1000);
        } else if (dataparse.indexOf('certificate signature failure') > 0) {
          logger.error('[alert] certificate has corrupted');
          resolve(1000);
        } else if (dataparse.indexOf('certificate revoked') > 0) {
          logger.error('[alert] certificate has revoked');
          resolve(1000);
        } else {
          logger.error('[alert] ERROR');
          // logger.error(dataparse);
          resolve(1000);
        }
      } else {
        // reject(1000);
        // tls.kill();
      }
    });

    tls.stderr.on('data', (data) => {
      if (data.toString().indexOf('connect:errno') > 0) {
        checkCertError = 0;
        resolve(new Error());
      }
      // if (data.toString()) {} else {
      //   resolve(new Error());
      // }
      // resolve(new Error());
      // logger.error(data.toString());
      // reject(data.toString());
    });


    tls.on('exit', (code) => {
      // logger.error('code = ' + code);
      console.log('close child-process');
      clearTimeout(request_timer);
    })

    tls.stdin.write(sasApiObj(procedure, post_data));
  })
}


const sasApiObj = (procedure, post_data) => {
  return 'POST /v1.2/' + procedure + ' HTTP/1.1\r\nHost: ' + ip + ':5000\r\nAccept: application/json\r\nContent-Type: application/json\r\nContent-Length: '+ Buffer.byteLength(post_data) + '\r\n\r\n' + post_data;
}

//post_data example: '{"registrationRequest":[{"userId":"test","fccId":"test_fcc","cbsdSerialNumber":"0050BA-FAP-000H1148536"}]}'

exports.sas_api = (procedure, post_data) => {
  var FALSE_RSP = {};
  FALSE_RSP[procedure + "Response"] = [{}];
  FALSE_RSP[procedure + "Response"][0]["response"] = {};
  //logger.debug("macy try:" + JSON.stringify(FALSE_RSP));
  
  var operation = retry.operation({
    retries: 2,
    factor: 3,
    minTimeout: 1 * 1000,
    maxTimeout: 60 * 1000,
    randomize: true
  });
  return new Promise((resolve,reject) => {
    operation.attempt((currentAttempt) => {
      logger.debug("Connect Times:" + currentAttempt);
      sas_api_redo(procedure, post_data)
      .then((output) => {
        if (output === 1000) {
          logger.error("certifacate error from SAS!");
          FALSE_RSP[procedure + "Response"][0]["response"]["responseCode"] = 1000;
          output = FALSE_RSP;
          // return;
        } else if (!(output instanceof Error)){
          logger.debug("Get SAS Response successfully");
        } else if (operation.retry(output)){
          // logger.error("response from SAS!");
          if (checkCertError == 1) {
            FALSE_RSP[procedure + "Response"][0]["response"]["responseCode"] = 1000;
          } else {
            FALSE_RSP[procedure + "Response"][0]["response"]["responseCode"] = 610;
          }
          output = FALSE_RSP;
          return;
        } else if (output instanceof Error){
          logger.error('TLS Connection Error');
          output = FALSE_RSP;
        }
        if(output === FALSE_RSP) {
          logger.error('Connection between SAS occur error')
          reject(output[procedure + "Response"][0]["response"]["responseCode"]);
        }
        else {resolve(output);}
      })
      .catch((err) => {
        logger.error("Can't not connect to SAS");
        //logger.error(err);
        reject(err);
        return;
      })
    });
  })
};
