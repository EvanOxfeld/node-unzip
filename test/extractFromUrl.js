"use strict";

var test = require("tap").test;
var fs = require("fs");
var unzip = require("../");
var os = require("os");
var request = require("request");

test("extract zip from url", function (t) {
  var extractPath = os.tmpdir() + "/node-unzip-extract-fromURL"; // Not using path resolve, cause it should be resolved in extract() function
  unzip.Open.url(
    request,
    "https://github.com/h5bp/html5-boilerplate/releases/download/v7.3.0/html5-boilerplate_v7.3.0.zip"
  )
    .then(function(d) { return d.extract({ path: extractPath }); })
    .then(function(d) {
      var dirFiles = fs.readdirSync(extractPath);
      var isPassing =
        dirFiles.length > 10 &&
        dirFiles.indexOf("css") > -1 &&
        dirFiles.indexOf("index.html") > -1 &&
        dirFiles.indexOf("favicon.ico") > -1;

      t.equal(isPassing, true);
      t.end();
    });
});
