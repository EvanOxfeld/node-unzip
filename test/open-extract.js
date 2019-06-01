'use strict';

var test = require('tap').test;
var path = require('path');
var temp = require('temp');
var dirdiff = require('dirdiff');
var unzip = require('../');


test("extract compressed archive with open.file.extract", function (t) {
  var archive = path.join(__dirname, '../testData/compressed-standard/archive.zip');

  temp.mkdir('node-unzip-2', function (err, dirPath) {
    if (err) {
      throw err;
    }
    unzip.Open.file(archive)
      .then(function(d) {
        return d.extract({path: dirPath});
      })
      .then(function() {
        dirdiff(path.join(__dirname, '../testData/compressed-standard/inflated'), dirPath, {
          fileContents: true
        }, function (err, diffs) {
          if (err) {
            throw err;
          }
          t.equal(diffs.length, 0, 'extracted directory contents');
          t.end();
        });
      });
    
  });
});