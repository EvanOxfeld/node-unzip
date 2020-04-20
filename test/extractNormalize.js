'use strict';

var test = require('tap').test;
var fs = require('fs');
var os = require('os');
var path = require('path');
var temp = require('temp');
var unzip = require('../');
var Stream = require('stream');


test("Extract should normalize the path option", function (t) {
  var archive = path.join(__dirname, '../testData/compressed-standard/archive.zip');

  temp.mkdir('node-unzip-normalize-', function (err, dirPath) {
    if (err) {
      throw err;
    }

    var filesDone = 0;

    function getWriter() {
      var delayStream = new Stream.Transform();

      delayStream._transform = function(d, e, cb) {
        setTimeout(cb, 500);
      };

      delayStream._flush = function(cb) {
        filesDone += 1;
        cb();
        delayStream.emit('close');
      };

      return delayStream;
    }

    // don't use path.join, it will normalize the path which defeats
    // the purpose of this test
    var extractPath = os.tmpdir() + "/unzipper\\normalize/././extract\\test";

    var unzipExtractor = unzip.Extract({ getWriter: getWriter, path: extractPath });
    unzipExtractor.on('error', function(err) {
      throw err;
    });
    unzipExtractor.on('close', function() {
      t.same(filesDone,2);
      t.end();
    });

    fs.createReadStream(archive).pipe(unzipExtractor);
  });
});

test("Extract should resolve after normalize the path option", function (t) {
  var archive = path.join(__dirname, '../testData/compressed-standard/archive.zip');

  temp.mkdir('node-unzip-normalize-2-', function (err, dirPath) {
    if (err) {
      throw err;
    }

    var filesDone = 0;

    function getWriter() {
      var delayStream = new Stream.Transform();

      delayStream._transform = function(d, e, cb) {
        setTimeout(cb, 500);
      };

      delayStream._flush = function(cb) {
        filesDone += 1;
        cb();
        delayStream.emit('close');
      };

      return delayStream;
    }

    var unzipExtractor = unzip.Extract({ getWriter: getWriter, path: '.' });
    unzipExtractor.on('error', function(err) {
      throw err;
    });
    unzipExtractor.on('close', function() {
      t.same(filesDone,2);
      t.end();
    });

    fs.createReadStream(archive).pipe(unzipExtractor);
  });
});