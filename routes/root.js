var express = require("express");
//var config = require('./config');
var getParser = require("../parser/getParser");
var postParser = require("../parser/postParser");
var path = require('path');
var log4js = require('log4js');
var logger = log4js.getLogger(path.basename(__filename));
logger.level = "debug";

var router = express.Router();

router.get("/*", function(req, res) {
  var url = req.url;
  console.log(`Request: ${url}`);

  getParser.getParse(url, function(res1) {
    //result = JSON.parse(res1);
    //console.log();
    res.status(200).json(res1);
  });
});

router.post("/*", function(req, res) {
  //var url = req.url;
  //logger.debug(`Request: ${url}`);
  //logger.debug(`Body: ${JSON.stringify(req.body)}`);
  //console.log(`Request: ${url}`);
  //console.log(`Body: ${JSON.stringify(req.body)}`);

  postParser.postParse(req, function(res1) {
    //result = JSON.parse(res1);
    //res.status(200).json(JSON.parse(res1));
    res.status(200).json(JSON.parse(res1));
  });
});

module.exports = router;