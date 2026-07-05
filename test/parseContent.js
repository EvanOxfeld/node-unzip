import { test } from 'tap';
import fs from 'fs';
import { Parse } from '../index.js';

test("get content of a single file entry out of a zip", function (t) {
  const archive = './testData/compressed-standard/archive.zip';

  fs.createReadStream(archive)
    .pipe(Parse())
    .on('entry', function(entry) {
      if (entry.path !== 'file.txt')
        return entry.autodrain();

      entry.buffer()
        .then(function(str) {
          const fileStr = fs.readFileSync('./testData/compressed-standard/inflated/file.txt', 'utf8');
          t.equal(str.toString(), fileStr);
          t.end();
        });
    });
});