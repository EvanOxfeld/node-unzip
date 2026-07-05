import { test } from "tap";
import fs from "fs";
import { Open } from "../index.js";
import os from "os";
import request from "request";

test("extract zip from url", function (t) {
  const extractPath = os.tmpdir() + "/node-unzip-extract-fromURL"; // Not using path resolve, cause it should be resolved in extract() function
  Open.url(
    request,
    "https://github.com/h5bp/html5-boilerplate/releases/download/v7.3.0/html5-boilerplate_v7.3.0.zip"
  )
    .then(function(d) { return d.extract({ path: extractPath }); })
    .then(function() {
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
