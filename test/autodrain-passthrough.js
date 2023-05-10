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
      entry.autodrain()
        .on('finish', function() {
          t.equal(entry.__autodraining, true);
        });
    })
    .on('finish', function() {
      t.end();
    });
});

test("verify that autodrain promise works", function (t) {
  var archive = path.join(__dirname, '../testData/compressed-standard/archive.zip');

  fs.createReadStream(archive)
    .pipe(unzip.Parse())
    .on('entry', function(entry) {
      entry.autodrain()
        .promise()
        .then(function() {
          t.equal(entry.__autodraining, true);
        });
    })
    .on('finish', function() {
      t.end();
    });
});

test("verify that autodrain resolves after it has finished", function (t) {
  var archive = path.join(__dirname, '../testData/compressed-standard/archive.zip');

  fs.createReadStream(archive)
    .pipe(unzip.Parse())
    .on('entry', function(entry) {
      entry.autodrain()
        .promise()
        .then(function() {
          entry.autodrain()
          .promise()
          .then(function() {
            t.end();
          });
        });
    })
});
