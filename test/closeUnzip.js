'use strict';

var test = require('tap').test;
var fs = require('fs');
var path = require('path');
var temp = require('temp');
var streamBuffers = require("stream-buffers");
var unzip = require('../');

test("prematurely end unzipping", function (t) {
  var archive = path.join(__dirname, '../testData/compressed-standard/archive.zip');

  var unzipClosed = false;
  
  var readStream = fs.createReadStream(archive);
  readStream
    .pipe(unzip.Parse())
    .on('entry', function(entry) {
      if(!unzipClosed) {
        unzipClosed = true;
        readStream.close();
        this.close();
      }
      else {
        throw new Error('Unzip did not end');
      }
    })
    .on('finish', function() {
      t.end();
    });
});
