'use strict';

const test = require('tap').test;
const fs = require('fs');
const streamBuffers = require("stream-buffers");
const unzipper = require('../index.cjs');

const archive = './testData/compressed-standard/archive.zip';

test("pipe a single file entry out of a zip", function (t) {
  const writableStream = new streamBuffers.WritableStreamBuffer();
  writableStream.on('close', function () {
    const str = writableStream.getContentsAsString('utf8');
    const fileStr = fs.readFileSync('./testData/compressed-standard/inflated/file.txt', 'utf8');
    t.equal(str, fileStr);
    t.end();
  });

  fs.createReadStream(archive)
    .pipe(unzipper.ParseOne('file.txt'))
    .pipe(writableStream);
});

test('errors if file is not found', function (t) {
  fs.createReadStream(archive)
    .pipe(unzipper.ParseOne('not_exists'))
    .on('error', function(e) {
      t.equal(e.message, 'PATTERN_NOT_FOUND');
      t.end();
    });
});

test('error - invalid signature', function(t) {
  unzipper.ParseOne()
    .on('error', function(e) {
      t.equal(e.message.indexOf('invalid signature'), 0);
      t.end();
    })
    .end('this is not a zip file');
});

test('error - file ended', function(t) {
  unzipper.ParseOne()
    .on('error', function(e) {
      if (e.message == 'PATTERN_NOT_FOUND') return;
      t.equal(e.message, 'FILE_ENDED');
      t.end();
    })
    .end('t');
});
