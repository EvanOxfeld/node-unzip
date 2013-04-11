'use strict';

var test = require('tap').test;
var fs = require('fs');
var path = require('path');
var temp = require('temp');
var dirdiff = require('dirdiff');
var streamBuffers = require("stream-buffers");
var unzip = require('../');


function testParsing(filename) {
  test('parse compressed archive: ' + filename, function(t) {
    var archive = path.join(__dirname, '../testData/' + filename + '/archive.zip');

    var unzipParser = unzip.Parse();
    fs.createReadStream(archive).pipe(unzipParser);
    unzipParser.on('error', function(err) {
      throw err;
    });

    unzipParser.on('close', t.end.bind(this));
  });
}

function testExtraction(filename) {
  test('extract compressed archive: ' + filename, function(t) {
    var archive = path.join(__dirname, '../testData/' + filename + '/archive.zip');

    temp.mkdir('node-unzip-', function(err, dirPath) {
      if (err) {
        throw err;
      }
      var unzipExtractor = unzip.Extract({ path: dirPath });
      unzipExtractor.on('error', function(err) {
        throw err;
      });
      unzipExtractor.on('close', testExtractionResults);

      fs.createReadStream(archive).pipe(unzipExtractor);

      function testExtractionResults() {
        dirdiff(path.join(__dirname, '../testData/' + filename + '/inflated'), dirPath, {
          fileContents: true
        }, function(err, diffs) {
          if (err) {
            throw err;
          }
          t.equal(diffs.length, 0, 'extracted directory contents');
          t.end();
        });
      }
    });
  });
}

// test all archive parsing and extraction
fs.readdir(path.join(__dirname, '../testData/'), function(err, files) {
  files.forEach(function(filename) {
    if (/^compressed/.test(filename)) {
      testParsing(filename);
      testExtraction(filename);
    }
  });
});

test('pipe a single file entry out of a zip', function (t) {
  var archive = path.join(__dirname, '../testData/compressed-standard/archive.zip');

  fs.createReadStream(archive)
    .pipe(unzip.Parse())
    .on('entry', function(entry) {
      if (entry.path === 'file.txt') {
        var writableStream = new streamBuffers.WritableStreamBuffer();
        writableStream.on('close', function () {
          var str = writableStream.getContentsAsString('utf8');
          var fileStr = fs.readFileSync(path.join(__dirname, '../testData/compressed-standard/inflated/file.txt'), 'utf8')
          t.equal(str, fileStr);
          t.end();
        });
        entry.pipe(writableStream);
      } else {
        entry.autodrain();
      }
    });
});

