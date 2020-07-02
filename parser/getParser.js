"use strict";

const out = {
  name: "Yoshi",
  number: "123456"
};

exports.getParse = function(url, cb) {
  //var method = url.split('/');
  console.log(`In getParse: ${url}`);

  if (url === "/") {
    console.log("In method");
    cb(out);
  }
};
