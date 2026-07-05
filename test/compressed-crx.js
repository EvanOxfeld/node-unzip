import { test } from 'tap';
import fs from 'fs';
import temp from 'temp';
import dirdiff from 'dirdiff';
import AWS from 'aws-sdk';
import { Extract, Open } from '../index.js';

test('parse/extract crx archive', function (t) {
  const archive = './testData/compressed-standard-crx/archive.crx';

  temp.mkdir('node-unzip-', function (err, dirPath) {
    if (err) {
      throw err;
    }
    const unzipExtractor = Extract({ path: dirPath });
    unzipExtractor.on('error', function(err) {
      throw err;
    });
    unzipExtractor.on('close', testExtractionResults);

    fs.createReadStream(archive).pipe(unzipExtractor);

    function testExtractionResults() {
      t.same(unzipExtractor.crxHeader.version, 2);
      dirdiff('./testData/compressed-standard-crx/inflated', dirPath, {
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

test('open methods', async function(t) {
  const archive = './testData/compressed-standard-crx/archive.crx';
  const buffer = fs.readFileSync(archive);
  const s3 = new AWS.S3({region: 'us-east-1'});

  // We have to modify the `getObject` and `headObject` to use makeUnauthenticated
  s3.getObject = function(params, cb) {
    return s3.makeUnauthenticatedRequest('getObject', params, cb);
  };

  s3.headObject = function(params, cb) {
    return s3.makeUnauthenticatedRequest('headObject', params, cb);
  };

  const tests = [
    {name: 'buffer', args: [buffer]},
    {name: 'file', args: [archive]},
    // {name: 'url', args: [request, 'https://s3.amazonaws.com/unzipper/archive.crx']},
    // {name: 's3', args: [s3, { Bucket: 'unzipper', Key: 'archive.crx'}]}
  ];

  for (const test of tests) {
    t.test(test.name, async function(t) {
      t.test('opening with crx option', function(t) {
        const method = Open[test.name];
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
  };
  t.end();
});
