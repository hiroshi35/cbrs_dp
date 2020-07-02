"use strict";

var config = require("../config");
var https = require("https");
var retry = require("retry");
var path = require("path");
var log4js = require("log4js");
var logger = log4js.getLogger(path.basename(__filename));
var rs = require('jsrsasign');//to get x509 ext
var asn1js = require("asn1js");//to asn.1 format
var pkijs = require("pkijs");//decode crl file
var fs = require('fs');
var http = require('http');
logger.level = config.log.level;

var download = function(url, dest, cb) {
  var file = fs.createWriteStream(dest);
  var request = http.get(url, function(response) {
    response.pipe(file);
    file.on('finish', function() {
      file.close(cb);  // close() is async, call cb after close completes.
    });
  }).on('error', function(err) { // Handle errors
    fs.unlink(dest,()=>{}); // Delete the file async. (But we don't check the result)
    cb(err);
  });
};

function isEmptyObject(obj) {
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      return false;
    }
  }
  return true;
}

function sas_api_redo(procedure, post_data) {
  //exports.sas_api = function(procedure, post_data, cb) {
  logger.debug("procedure: " + procedure);
  logger.debug("post_data: " + post_data);

  var options = {
    hostname: config.sas.host,
    port: config.sas.port,
    path: "/v1.2/" + procedure,
    method: "POST",
    //timeout: 3000,
    key: config.sas.key,
    cert: config.sas.cert,
    ca: config.sas.ca,
    checkServerIdentity: function() {},//solution to Hostname/IP doesn't match certificate's altnames
 
    requestCert: true,
    rejectUnauthorized: true,//verify server certficate
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "Content-Length": Buffer.byteLength(post_data)
    }
  };

  return new Promise((resolve, reject) => {

    var request_timer = setTimeout(() => {
      sas_req.abort();
      console.log("Request Timeout!");
    }, 3000);

    var sas_req = https.request(options, function(response) {
      var str = [];
  
      // console.log('certificate authorized:' + response.socket.authorized);
      // console.log('getPeerCertificate:' + JSON.stringify(response.socket.getPeerCertificate().serialNumber));
      
      clearTimeout(request_timer);
      response.setEncoding("utf8");
      response.on("data", (data) => {
        str.push(data);
      });
      response.on("end", () => {
        try {
          str = JSON.parse(str[0]);
          //logger.debug("str type :" + typeof str);
          resolve(str);
        }
        catch(e){
          reject(e);
        }
      });
    });
    sas_req.on("error", e => {
      logger.error(`problem with request: ${e.message}`);
      if (e.code === "ECONNRESET") {
        reject(1000); //socket hang up
      } else {
        clearTimeout(request_timer);
        //reject(e.message);
        logger.error(e.message);
        resolve(e);
      }
    });
    sas_req.on("socket", socket => {
      socket.on('secureConnect',()=> {
        if (isEmptyObject(socket.getPeerCertificate())) {
          // console.error("server without certificate!!!");
          // reject("server without certificate!!!!!");
          // clearTimeout(request_timer);
          // return sas_req.abort();
          sas_req.write(post_data);
          sas_req.end();
          return;
        }
        console.log("request.on:"+JSON.stringify(socket.getPeerCertificate()));
        var x = new rs.X509();
        var CertificateRevocationList = pkijs.CertificateRevocationList;
        var sn = socket.getPeerCertificate().serialNumber;
        var revoked_flag = 0;
        console.log('certificate authorized:' + socket.authorized);
        console.log('getPeerCertificate:' + JSON.stringify(socket.getPeerCertificate().serialNumber));
        // console.log('getPeerCertificate:' + JSON.stringify(socket.getPeerCertificate().subject));
        // console.log('getPeerCertificate:' + JSON.stringify(socket.getPeerCertificate().infoAccess));
        console.log('getPeerCertificate:' + JSON.stringify(socket.getPeerCertificate()));
        // console.log('getPeerCertificate:' + JSON.stringify(socket.getPeerCertificate().raw.toString('base64')));
        x.readCertPEM('-----BEGIN CERTIFICATE-----'+socket.getPeerCertificate().raw.toString('base64')+'-----END CERTIFICATE-----');
        console.log('crl :'+x.getExtCRLDistributionPointsURI()+"("+typeof x.getExtCRLDistributionPointsURI()+")");
        if (x.getExtCRLDistributionPointsURI() === undefined) {
          console.log("certificate without crl extention");
          sas_req.write(post_data);
          sas_req.end();
        } else {
          /*download crl file from CRL server*/
          var url = "http://10.101.129.93:8888";//tmp uri
          download(url, config.crl.file_pos, function(err){// to sporton test will be comment
          // download(x.getExtCRLDistributionPointsURI(), config.crl.file_pos, function(err){
            if (err) {
              console.log("download log:"+err);
              return;
            } 
            else {
              /*read crl file*/
              // var cert = fs.readFileSync(config.sas.crl_path).toString();
              try {
                var cert = fs.readFileSync(config.sas.crl_path).toString();//do not remove to config
              }  catch (err) {
                console.log("without file");
              }
              var b64 = cert.replace(/(-----(BEGIN|END) X509 CRL-----|[\n\r])/g, '');
              var der = Buffer.from(b64,'base64');
              var ber = new Uint8Array(der).buffer;
              var asn1 = asn1js.fromBER(ber);
              var crl_full = new CertificateRevocationList({schema: asn1.result});
              // console.log(crl_full.revokedCertificates[0].userCertificate.valueBlock._valueHex);
              /*check if in list*/
              for (var i = 0;i < crl_full.revokedCertificates.length;i++) {
                console.log("sn :"+sn);
                var sn_arr_type = new Uint8Array(crl_full.revokedCertificates[i].userCertificate.valueBlock._valueHex);
                var crl_sn = "";
                sn_arr_type.forEach(function(sn_arr_type){
                  crl_sn += sn_arr_type.toString(16).toUpperCase();
                })
                console.log((new Uint8Array(crl_full.revokedCertificates[i].userCertificate.valueBlock._valueHex)));
                console.log("crl_sn :"+crl_sn);
                console.log(crl_sn.includes(sn));
                if (crl_sn.includes(sn)){
                  revoked_flag = 1;
                } 
              }
              if (revoked_flag) {
                clearTimeout(request_timer);
                reject("revoked!!!!!");
                sas_req.abort();
              } else {
                sas_req.write(post_data);
                sas_req.end();
              }
            }
          });
        }
  
      });
    });
    // sas_req.write(post_data);
    // sas_req.end();
  });
}

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
          logger.error("no response from SAS!");
          FALSE_RSP[procedure + "Response"][0]["response"]["responseCode"] = 1000;
          output = FALSE_RSP;
          return;
        } else if (!(output instanceof Error)){
          logger.debug("Get SAS Response successfully");
        } else if (operation.retry(output)){
          logger.error("no response from SAS!");
          FALSE_RSP[procedure + "Response"][0]["response"]["responseCode"] = 610;
          output = FALSE_RSP;
          return;
        } else if (output instanceof Error){
          logger.error('Error object');
          output = FALSE_RSP;
        }
        if(output === FALSE_RSP) {reject(output[procedure + "Response"][0]["response"]["responseCode"]);}
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