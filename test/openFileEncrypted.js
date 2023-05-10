'use strict';

var test = require('tap').test;
var fs = require('fs');
var path = require('path');
var unzip = require('../');

var archive = path.join(__dirname, '../testData/compressed-encrypted/archive.zip');

test("get content of a single file entry out of a zip", function (t) {
  return unzip.Open.file(archive)
    .then(function(d) {
      var file = d.files.filter(function(file) {
        return file.path == 'file.txt';
      })[0];

     return file.buffer('abc123')
        .then(function(str) {
          var fileStr = fs.readFileSync(path.join(__dirname, '../testData/compressed-standard/inflated/file.txt'), 'utf8');
          t.equal(str.toString(), fileStr);
          t.end();
        });
    });
});

test("error if password is missing", function (t) {
  return unzip.Open.file(archive)
    .then(function(d) {
      var file = d.files.filter(function(file) {
        return file.path == 'file.txt';
      })[0];

     return file.buffer()
      .then(function() {
        t.error('should error');
      },function(e) {
        t.equal(e.message,'MISSING_PASSWORD');
      })
      .then(function() {
        t.end();
      });
        
    });
});

test("error if password is wrong", function (t) {
  return unzip.Open.file(archive)
    .then(function(d) {
      var file = d.files.filter(function(file) {
        return file.path == 'file.txt';
      })[0];

     return file.buffer('abc1')
      .then(function() {
        t.error('should error');
      },function(e) {
        t.equal(e.message,'BAD_PASSWORD');
      })
      .then(function() {
        t.end();
      });
        
    });
});