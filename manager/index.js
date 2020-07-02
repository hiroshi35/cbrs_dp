/*
"use strict";

var send = require("./dp_sas_api.js");
var procedure = "registration";
var data = JSON.stringify({
  registrationRequest: [
    {
      userId: "test",
      fccId: "test_fcc",
      cbsdSerialNumber: "D823956047"
    }
  ]
});

send.sas_api(procedure, data, function(res) {
  //  var data = JSON.parse(res);
  console.log("index:" + JSON.stringify(res));
  console.log(`code:${res["registrationResponse"][0]["response"]["responseCode"]}`);
});
*/

var test3 = require("./dpHBTHandler");
var test2 = require("./dpACSPath");

test3.handler_hbt;
test2.changeTransmitPostParam;
