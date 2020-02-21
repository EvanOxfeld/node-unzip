'use strict';

var test = require('tap').test;
var fs = require('fs');
var path = require('path');
var Stream = require('stream');
var unzip = require('../');

// Backwards compatibility for node versions < 8
if (!Stream.Writable || !Stream.Writable.prototype.destroy)
  Stream = require('readable-stream');

test("verify that setting the forceStream option emits a data event instead of entry", function (t) {
  var archive = path.join(__dirname, '../testData/compressed-standard/archive.zip');

  var dataEventEmitted = false;
  var entryEventEmitted = false;
  fs.createReadStream(archive)
    .pipe(unzip.Parse({ forceStream: true }))
    .on('data', function(entry) {
      t.equal(entry instanceof Stream.PassThrough, true);
      dataEventEmitted = true;
    })
    .on('entry', function() {
      entryEventEmitted = true;
    })
      .on('finish', function() {
      t.equal(dataEventEmitted, true);
      t.equal(entryEventEmitted, false);
      t.end();
    });
});
