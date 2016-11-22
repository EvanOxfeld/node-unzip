'use strict';

var test = require('tap').test;
var fs = require('fs');
var path = require('path');
var temp = require('temp');
var unzip = require('../');
var entryRead ;

test("promise should resolve when entries have been processed", function (t) {
  var archive = path.join(__dirname, '../testData/compressed-standard/archive.zip');

  fs.createReadStream(archive)
    .pipe(unzip.Parse())
    .on('entry', function(entry) {
      if (entry.path !== 'file.txt')
        return entry.autodrain();

      entry.buffer()
        .then(function(str) {
          entryRead = true;
        });
    })
    .promise()
    .then(function() {
      t.equal(entryRead,true);
      t.end();
    },function() {
      t.fail('This project should resolve');
      t.end();
    });
});

test("promise should be rejected if there is an error in the stream", function (t) {
  var archive = path.join(__dirname, '../testData/compressed-standard/archive.zip');

  fs.createReadStream(archive)
    .pipe(unzip.Parse())
    .on('entry', function(entry) {
      this.emit('error',new Error('this is an error'));
    })
    .promise()
    .then(function() {
      t.fail('This promise should be rejected');
      t.end();
    },function(e) {
      t.equal(e.message,'this is an error');
      t.end();
    });
});