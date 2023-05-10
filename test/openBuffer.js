'use strict';

var test = require('tap').test;
var fs = require('fs');
var path = require('path');
var unzip = require('../');

test("get content of a single file entry out of a buffer", function (t) {
  var archive = path.join(__dirname, '../testData/compressed-standard/archive.zip');
  var buffer = fs.readFileSync(archive);

  return unzip.Open.buffer(buffer)
    .then(function(d) {
      var file = d.files.filter(function(file) {
        return file.path == 'file.txt';
      })[0];

      return file.buffer()
        .then(function(str) {
          var fileStr = fs.readFileSync(path.join(__dirname, '../testData/compressed-standard/inflated/file.txt'), 'utf8');
          t.equal(str.toString(), fileStr);
          t.end();
        });
    });
});