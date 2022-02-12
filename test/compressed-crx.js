'use strict';

var test = require('tap').test;
var fs = require('fs');
var path = require('path');
var temp = require('temp');
var dirdiff = require('dirdiff');
var unzip = require('../');

test('parse/extract crx archive', function (t) {
  var archive = path.join(__dirname, '../testData/compressed-standard-crx/archive.crx');

  temp.mkdir('node-unzip-', function (err, dirPath) {
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
      t.same(unzipExtractor.crxHeader.version,2);
      dirdiff(path.join(__dirname, '../testData/compressed-standard/inflated'), dirPath, {
        fileContents: true
      }, function (err, diffs) {
        if (err) {
          throw err;
        }
        t.equal(diffs.length, 0, 'extracted directory contents');
        t.end();
      });
    }
  });
});

test('open methods', function(t) {
  var archive = path.join(__dirname, '../testData/compressed-standard-crx/archive.crx');
  var buffer = fs.readFileSync(archive);
  var request = require('request');
  var AWS = require('aws-sdk');
  var s3 = new AWS.S3({region: 'us-east-1'});

  // We have to modify the `getObject` and `headObject` to use makeUnauthenticated
  s3.getObject = function(params,cb) {
    return s3.makeUnauthenticatedRequest('getObject',params,cb);
  };

  s3.headObject = function(params,cb) {
    return s3.makeUnauthenticatedRequest('headObject',params,cb);
  };
  
  var tests = [
    {name: 'buffer',args: [buffer]},
    {name: 'file', args: [archive]},
    // {name: 'url', args: [request, 'https://s3.amazonaws.com/unzipper/archive.crx']},
    // {name: 's3', args: [s3, { Bucket: 'unzipper', Key: 'archive.crx'}]}
  ];

  tests.forEach(function(test) {
    t.test(test.name, function(t) {
      t.test('opening with crx option', function(t) {
        var method = unzip.Open[test.name];
        method.apply(method, test.args.concat({crx:true}))
        .then(function(d) {
          return d.files[1].buffer();
        })
        .then(function(d) {
          t.same(String(d), '42\n', test.name + ' content matches');
          t.end();
        });
      });
    });
  });
});
