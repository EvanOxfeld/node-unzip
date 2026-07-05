import { test } from 'tap';
import fs from 'fs';
import { Parse } from '../index.js';

test("verify that immediate autodrain does not unzip", function (t) {
  const archive = './testData/compressed-standard/archive.zip';

  fs.createReadStream(archive)
    .pipe(Parse())
    .on('entry', function(entry) {
      entry.autodrain()
        .on('finish', function() {
          t.equal(entry.__autodraining, true);
        });
    })
    .on('finish', function() {
      t.end();
    });
});

test("verify that autodrain promise works", function (t) {
  const archive = './testData/compressed-standard/archive.zip';

  fs.createReadStream(archive)
    .pipe(Parse())
    .on('entry', function(entry) {
      entry.autodrain()
        .promise()
        .then(function() {
          t.equal(entry.__autodraining, true);
        });
    })
    .on('finish', function() {
      t.end();
    });
});

test("verify that autodrain resolves after it has finished", function (t) {
  const archive = './testData/compressed-standard/archive.zip';

  fs.createReadStream(archive)
    .pipe(Parse())
    .on('entry', entry => entry.autodrain())
    .on('end', () => t.end());
});
