"use strict";

const test = require("tap").test;
const fs = require("fs");
const unzip = require("../");
const os = require("os");
const request = require("request");

test("extract zip from url", function (t) {
  const extractPath = os.tmpdir() + "/node-unzip-extract-fromURL"; // Not using path resolve, cause it should be resolved in extract() function
  unzip.Open.url(
    request,
    "https://github.com/h5bp/html5-boilerplate/releases/download/v7.3.0/html5-boilerplate_v7.3.0.zip"
  )
    .then((d) => d.extract({ path: extractPath }))
    .then((d) => {
      const dirFiles = fs.readdirSync(extractPath);
      const isPassing =
        dirFiles.length > 10 &&
        dirFiles.indexOf("css") > -1 &&
        dirFiles.indexOf("index.html") > -1 &&
        dirFiles.indexOf("favicon.ico") > -1;

      t.equal(isPassing, true);
      t.end();
    });
});
