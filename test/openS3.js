import { test } from 'tap';
import fs from 'fs';
import { Open } from '../index.js';
import AWS from 'aws-sdk';
const s3 = new AWS.S3({region: 'us-east-1'});


// We have to modify the `getObject` and `headObject` to use makeUnauthenticated
s3.getObject = function(params, cb) {
  return s3.makeUnauthenticatedRequest('getObject', params, cb);
};

s3.headObject = function(params, cb) {
  return s3.makeUnauthenticatedRequest('headObject', params, cb);
};

test("get content of a single file entry out of a zip", { skip: true }, function(t) {
  return Open.s3(s3, { Bucket: 'unzipper', Key: 'archive.zip' })
    .then(function(d) {
      const file = d.files.filter(function(file) {
        return file.path == 'file.txt';
      })[0];

      return file.buffer()
        .then(function(str) {
          const fileStr = fs.readFileSync('./testData/compressed-standard/inflated/file.txt', 'utf8');
          t.equal(str.toString(), fileStr);
          t.end();
        });
    });
});
