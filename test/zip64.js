'use strict';

var test = require('tap').test;
var path = require('path');
var unzip = require('../');
var Stream = require('stream');

// Backwards compatibility for node versions < 8
if (!Stream.Writable || !Stream.Writable.prototype.destroy)
  Stream = require('readable-stream');


test("Correct uncompressed size for zip64", function (t) {

  process.on('uncaughtException', function(e) {
    t.error('Uncaught Exception: '+e.message);
    t.end();
  });


  
  var countStream = Stream.Transform();
  countStream._transform = function(d, e, cb) {
    this.length = (this.length || 0) + d.length;
    cb();
  };

  var archive = path.join(__dirname, '../testData/big.zip');
  return unzip.Open.file(archive)
  .then(function(d) {
    var file = d.files[0];
    file.stream()
      .on('error', (e) => {
        t.same(e.message,'FILE_ENDED');
        t.end();
      })
      .pipe(countStream)
      .on('error', function(e) {
        return Promise.reject('Error: '+e.message);
      })
      .on('finish', function() {
        t.same(countStream.length,file.uncompressedSize);
        t.end();
      });
  });
});
