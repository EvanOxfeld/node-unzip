'use strict';

var test = require('tap').test;
var fs = require('fs');
var path = require('path');
var fstream = require('fstream');
var temp = require('temp');
var dirdiff = require('dirdiff');
var unzip = require('../');

test("uncompressed archive", function (t) {
  var archive = path.join(__dirname, '../testData/uncompressed/archive.zip');

  temp.mkdir('node-unzip-', function (err, dirPath) {
    if (err) {
      t.fail(err);
    }
    var unzipParser = unzip.Parse();
    unzipParser.on('error', function(err) {
      return t.fail(err);
    });

    var writer = fstream.Writer(dirPath);
    writer.on('error', function(err) {
      t.fail(err);
    });
    writer.on('close', testExtractionResults);

    fs.createReadStream(archive).pipe(unzipParser).pipe(writer);

    function testExtractionResults() {
      dirdiff(path.join(__dirname, '../testData/uncompressed/inflated'), dirPath, {
        fileContents: true
      }, function (err, diffs) {
        if (err) {
          return t.fail(err);
        }
        t.equal(0, diffs.length, 'archive directory incorrect');
        return t.end();
      });
    }
  });
});

test("compressed archive", function (t) {
  var archive = path.join(__dirname, '../testData/compressed/archive.zip');

  temp.mkdir('node-unzip-', function (err, dirPath) {
    if (err) {
      t.fail(err);
    }
    var unzipParser = unzip.Parse();
    unzipParser.on('error', function(err) {
      return t.fail(err);
    });

    var writer = fstream.Writer(dirPath);
    writer.on('error', function(err) {
      t.fail(err);
    });
    writer.on('close', testExtractionResults);

    fs.createReadStream(archive).pipe(unzipParser).pipe(writer);

    function testExtractionResults() {
      dirdiff(path.join(__dirname, '../testData/compressed/inflated'), dirPath, {
        fileContents: true
      }, function (err, diffs) {
        if (err) {
          return t.fail(err);
        }
        t.equal(0, diffs.length, 'archive directory incorrect');
        return t.end();
      });
    }
  });
});