'use strict';

var test = require('tap').test;
var fs = require('fs');
var path = require('path');
var streamBuffers = require("stream-buffers");
var unzip = require('../');
var Stream = require('stream');

// Backwards compatibility for node 0.8
if (!Stream.Writable)
  Stream = require('readable-stream');

var archive = path.join(__dirname, '../testData/compressed-standard/archive.zip');

test("pipe a single file entry out of a zip", function (t) {
  var writableStream = new streamBuffers.WritableStreamBuffer();
  writableStream.on('close', function () {
    var str = writableStream.getContentsAsString('utf8');
    var fileStr = fs.readFileSync(path.join(__dirname, '../testData/compressed-standard/inflated/file.txt'), 'utf8');
    t.equal(str, fileStr);
    t.end();
  });

  fs.createReadStream(archive)
    .pipe(unzip.ParseOne('file.txt'))
    .pipe(writableStream);
});

test('errors if file is not found', function (t) {
  fs.createReadStream(archive)
    .pipe(unzip.ParseOne('not_exists'))
    .on('error',function(e) {
      t.equal(e.message,'PATTERN_NOT_FOUND');
      t.end();
    });
});

test('error - invalid signature', function(t) {
  unzip.ParseOne()
    .on('error',function(e) {
      t.equal(e.message.indexOf('invalid signature'),0);
      t.end();
    })
    .end('this is not a zip file');
});

test('error - file ended', function(t) {
  unzip.ParseOne()
    .on('error',function(e) {
      t.equal(e.message,'FILE_ENDED');
      t.end();
    })
    .end('t');
});