'use strict';

var test = require('tap').test;
var fs = require('fs');
var path = require('path');
var fstream = require('fstream');
var temp = require('temp');
var unzip = require('../');

test("uncompressed archive", function (t) {
  var archive = path.join(__dirname, './data/uncompressed.zip');

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
    writer.on('end', function() {
      console.error('------------------writer end', arguments);
      t.end();
    });
    writer.on('close', function() {
      console.error('------------------writer close - end test?');
      t.end();
    });

    fs.createReadStream(archive).pipe(unzipParser).pipe(writer);
  });
});

test("compressed archive", function (t) {
  var archive = path.join(__dirname, './data/compressed.zip');

  temp.mkdir('node-unzip-', function (err, dirPath) {
    if (err) {
      t.fail(err);
    }
    var unzipParser = unzip.Parse();
    unzipParser.on('error', function(err) {
      console.log('unzipParser error', err);
      return t.fail(err);
    });
    unzipParser.on('end', function() {
      console.log('unzipParser end');
    });


    var writer = fstream.Writer(dirPath);
    writer.on('error', function(err) {
      t.fail(err);
    });
    writer.on('end', function() {
      console.error('------------------writer end', arguments);
      t.end();
    });
    writer.on('close', function() {
      console.error('------------------writer close - end test?');
      t.end();
    });

    fs.createReadStream(archive).pipe(unzipParser).pipe(writer);
  });
});