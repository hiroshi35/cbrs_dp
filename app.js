"use strict";

var express = require("express");
//var path = require("path");
//var favicon = require('serve-favicon');
//var logger = require('morgan');
var bodyParser = require("body-parser");
const createdb = require('./manager/initDPDB');
var routes = require("./routes/root");

createdb.createdb();
var app = express();

// application/json 解析
app.use(bodyParser.json({ limit: "50mb", parameterLimit: 1000000 }));

// application/x-www-form-urlencoded 解析
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/", routes);

app.use(function(req, res) {
  var err = new Error("Not Found");
  err.status = 404;
});

app.listen(5888, function() {
  console.log("Example app listening on port 5888!");
  //console.log(" _________________ _____  ______                      _        ______                    ");
  //console.log("/  __ | ___ | ___ /  ___| |  _  \                    (_)       | ___ \                   ");
  //console.log("| /  \| |_/ | |_/ \ `--.  | | | |___  _ __ ___   __ _ _ _ __   | |_/ _ __ _____  ___   _ ");
  //console.log("| |   | ___ |    / `--. \ | | | / _ \| '_ ` _ \ / _` | | '_ \  |  __| '__/ _ \ \/ | | | |");
  //console.log("| \__/| |_/ | |\ \/\__/ / | |/ | (_) | | | | | | (_| | | | | | | |  | | | (_) >  <| |_| |");
  //console.log(" \____\____/\_| \_\____/  |___/ \___/|_| |_| |_|\__,_|_|_| |_| \_|  |_|  \___/_/\_\\__, |");
  //console.log("                                                                                    __/ |");
  //console.log("                                                                                   |___/ ");
  console.log("+-+-+-+-+ +-+-+-+-+-+-+ +-+-+-+-+-+");
  console.log("|C|B|R|S| |D|o|m|a|i|n| |P|r|o|x|y|");
  console.log("+-+-+-+-+ +-+-+-+-+-+-+ +-+-+-+-+-+");
});

//module.exports = app;
