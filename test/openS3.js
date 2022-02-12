'use strict';

var test = require('tap').test;
var fs = require('fs');
var path = require('path');
var unzip = require('../');
var AWS = require('aws-sdk');
var s3 = new AWS.S3({region: 'us-east-1'});


// We have to modify the `getObject` and `headObject` to use makeUnauthenticated
s3.getObject = function(params,cb) {
  return s3.makeUnauthenticatedRequest('getObject',params,cb);
};

s3.headObject = function(params,cb) {
  return s3.makeUnauthenticatedRequest('headObject',params,cb);
};

test("get content of a single file entry out of a zip", { skip: true }, function(t) {
  return unzip.Open.s3(s3,{ Bucket: 'unzipper', Key: 'archive.zip' })
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
