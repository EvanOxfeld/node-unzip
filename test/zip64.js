'use strict';

var t = require('tap');
var path = require('path');
var unzip = require('../');
var fs = require('fs');
var Stream = require('stream');

var UNCOMPRESSED_SIZE = 5368709120;

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
