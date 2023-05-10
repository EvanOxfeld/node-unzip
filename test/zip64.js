'use strict';

var t = require('tap');
var path = require('path');
var unzip = require('../');
var fs = require('fs');
var Stream = require('stream');
var temp = require('temp');

var UNCOMPRESSED_SIZE = 5368709120;
var ZIP64_OFFSET = 72;
var ZIP64_SIZE = 36

// Backwards compatibility for node versions < 8
if (!Stream.Writable || !Stream.Writable.prototype.destroy)
  Stream = require('readable-stream');

t.test('Correct uncompressed size for zip64', function (t) {
  var archive = path.join(__dirname, '../testData/big.zip');

  t.test('in unzipper.Open', function(t) {
    unzip.Open.file(archive)
    .then(function(d) {
      var file = d.files[0];
      t.same(file.uncompressedSize, UNCOMPRESSED_SIZE, 'Open: Directory header');
      
      d.files[0].stream()
        .on('vars', function(vars) {
          t.same(vars.uncompressedSize, UNCOMPRESSED_SIZE, 'Open: File header');
          t.end();
        })
        .on('error', function(e) {
          t.same(e.message,'FILE_ENDED');
          t.end();
        });
    });
  });

  t.test('in unzipper.parse', function(t) {
    fs.createReadStream(archive)
      .pipe(unzip.Parse())
      .on('entry', function(entry) {
        t.same(entry.vars.uncompressedSize, UNCOMPRESSED_SIZE, 'Parse: File header');
        t.end();
      });
  });

  t.end();  
});

t.test('Parse files from zip64 format correctly', function (t) {
  var archive = path.join(__dirname, '../testData/zip64.zip');

  t.test('in unzipper.Open', function(t) {
    unzip.Open.file(archive)
    .then(function(d) {
      t.same(d.offsetToStartOfCentralDirectory, ZIP64_OFFSET, 'Open: Directory header');
      t.same(d.files.length, 1, 'Open: Files Size')
      
      d.files[0].stream()
        .on('vars', function(vars) {
          t.same(vars.offsetToLocalFileHeader, 0, 'Open: File header');
          t.same(vars.uncompressedSize, ZIP64_SIZE, 'Open: File header');
          t.same(vars.compressedSize, ZIP64_SIZE, 'Open: File header');
          t.same(vars.path, 'README', 'Open: File header');
          t.end();
        })
        .on('error', function(e) {
          t.same(e.message,'FILE_ENDED');
          t.end();
        });
    });
  });

  t.test('in unzipper.parse', function(t) {
    fs.createReadStream(archive)
      .pipe(unzip.Parse())
      .on('entry', function(entry) {
        t.same(entry.vars.uncompressedSize, ZIP64_SIZE, 'Parse: File header');
      })
      .on('close', function() { t.end(); });
  });

  t.test('in unzipper.extract', function (t) {
    temp.mkdir('node-unzip-', function (err, dirPath) {
      if (err) {
        throw err;
      }
      fs.createReadStream(archive)
        .pipe(unzip.Extract({ path: dirPath }))
        .on('close', function() { t.end(); });
    });
  });

  t.end();  
});
