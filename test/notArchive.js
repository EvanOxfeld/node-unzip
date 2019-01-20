'use strict';

var test = require('tap').test;
var fs = require('fs');
var path = require('path');
var temp = require('temp');
var unzip = require('../');

var archive = path.join(__dirname, '../package.json');

test('parse a file that is not an archive', function (t) {

  var unzipParser = unzip.Parse();
  fs.createReadStream(archive).pipe(unzipParser);
  unzipParser.on('error', function(err) {
    t.ok(err.message.indexOf('invalid signature: 0x') !== -1);
    t.end();
  });

  unzipParser.on('close', function(d) {
    t.fail('Archive was parsed', d);
  });
});

test('extract a file that is not an archive', function (t) {

  temp.mkdir('node-unzip-', function(err, dirPath) {
    if (err) {
      throw err;
    }
    var unzipExtractor = unzip.Extract({ path: dirPath });
    unzipExtractor.on('error', function(err) {
      t.ok(err.message.indexOf('invalid signature: 0x') !== -1);
      t.end();
    });
    unzipExtractor.on('close', function() {
      t.fail('Archive was extracted');
    });

    fs.createReadStream(archive).pipe(unzipExtractor);
  });
});

test('get content of a single file entry out of a file that is not an archive', function (t) {
  unzip.Open.file(archive)
    .then(function(d) {
      t.fail('Archive was opened', d);
    })
    .catch(function(err) {
      t.equal(err.message, 'FILE_ENDED');
      t.end();
    });
});