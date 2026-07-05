import { test } from 'tap';
import fs from 'fs';
import temp from 'temp';
import { Parse, Extract } from '../index.js';


test("Parse a broken zipfile", function (t) {
  const archive = './testData/compressed-standard/broken.zip';

  fs.createReadStream(archive)
    .pipe(Parse())
    .on('entry', function(entry) {
      return entry.autodrain();
    })
    .promise()
    .catch(function(e) {
      t.same(e.message, 'FILE_ENDED');
      t.end();
    });
});


test("extract a broken", function (t) {
  const archive = './testData/compressed-standard/broken.zip';

  temp.mkdir('node-unzip-', function (err, dirPath) {
    if (err) {
      throw err;
    }
    const unzipExtractor = Extract({ path: dirPath });

    fs.createReadStream(archive)
      .pipe(unzipExtractor)
      .promise()
      .catch(function(e) {
        t.same(e.message, 'FILE_ENDED');
        t.end();
      });
  });
});