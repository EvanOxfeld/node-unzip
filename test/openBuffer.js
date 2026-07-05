import { test } from 'tap';
import fs from 'fs';
import { Open } from '../index.js';

test("get content of a single file entry out of a buffer", function (t) {
  const archive = './testData/compressed-standard/archive.zip';
  const buffer = fs.readFileSync(archive);

  return Open.buffer(buffer)
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