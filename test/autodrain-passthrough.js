'use strict';

var test = require('tap').test;
var fs = require('fs');
var path = require('path');
var unzip = require('../');

test("verify that immediate autodrain does not unzip", function (t) {
  var archive = path.join(__dirname, '../testData/compressed-standard/archive.zip');

  fs.createReadStream(archive)
    .pipe(unzip.Parse())
    .on('entry', function(entry) {
      entry.autodrain();
      entry.on('finish', function() {
        t.equal(entry.__autodraining, true);
      });
    })
    .on('finish', function() {
      t.end();
    });
});