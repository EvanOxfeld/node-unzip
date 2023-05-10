'use strict';

var test = require('tap').test;
var fs = require('fs');
var path = require('path');
var unzip = require('../');
var il = require('iconv-lite');
var Promise = require('bluebird');

test("get content of a single file entry out of a zip", function (t) {
  var archive = path.join(__dirname, '../testData/compressed-standard/archive.zip');

  return unzip.Open.file(archive)
    .then(function(d) {
      var file = d.files.filter(function(file) {
        return file.path == 'file.txt';
      })[0];

      return file.buffer()
        .then(function(str) {
          var fileStr = fs.readFileSync(path.join(__dirname, '../testData/compressed-standard/inflated/file.txt'), 'utf8');
          t.equal(str.toString(), fileStr);
          t.end();
        });
    });
});

test("get content of a single file entry out of a DOS zip", function (t) {
  var archive = path.join(__dirname, '../testData/compressed-cp866/archive.zip');

  return unzip.Open.file(archive, { fileNameEncoding: 'cp866' })
    .then(function(d) {
      var file = d.files.filter(function(file) {
        var fileName = file.isUnicode ? file.path : il.decode(file.pathBuffer, 'cp866');
        return fileName == 'Тест.txt';
      })[0];

      return file.buffer()
        .then(function(str) {
          var fileStr = il.decode(fs.readFileSync(path.join(__dirname, '../testData/compressed-cp866/inflated/Тест.txt')), 'cp1251');
          var zipStr = il.decode(str, 'cp1251');
          t.equal(zipStr, fileStr);
          t.equal(zipStr, 'Тестовый файл');
          t.end();
        });
    });
});


test("get multiple buffers concurrently", function (t) {
  var archive = path.join(__dirname, '../testData/compressed-directory-entry/archive.zip');
  return unzip.Open.file(archive)
    .then(function(directory) {
      return Promise.all(directory.files.map(function(file) {
        return file.buffer();
      }))
      .then(function(b) {
        directory.files.forEach(function(file,i) {
          t.equal(file.uncompressedSize,b[i].length);
        });
        t.end();
      });
    });
});