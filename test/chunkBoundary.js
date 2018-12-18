'use strict';

var test = require('tap').test;
var fs = require('fs');
var path = require('path');
var unzip = require('../');

test("parse an archive that has a file that falls on a chunk boundary", {
    timeout: 2000,
}, function (t) {

  // We ignore this test for node v.10
  // see: https://github.com/ZJONSSON/node-unzipper/pull/82
  if (/^v0.10/.test(process.version)) {
    t.comment('Ignore chunkBoundary test for v0.10');
    t.end();
    return;
  }

  var archive = path.join(__dirname, '../testData/chunk-boundary/chunk-boundary-archive.zip');

  // Use an artificially low highWaterMark to make the edge case more likely to happen.
  fs.createReadStream(archive,{ highWaterMark: 256 })
    .pipe(unzip.Parse())
    .on('entry', function(entry) {
        return entry.autodrain();
    }).on("finish", function() {
        t.end();
    });
});