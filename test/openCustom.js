import { test } from 'tap';
import fs from 'fs';
import { Open } from '../index.js';

test("get content of a single file entry out of a zip", function (t) {
  const archive = './testData/compressed-standard/archive.zip';

  const customSource = {
    stream: function(offset, length) {
      return fs.createReadStream(archive, {start: offset, end: length && offset+length});
    },
    size: function() {
      return new Promise(function(resolve, reject) {
        fs.stat(archive, function(err, d) {
          if (err)
            reject(err);
          else
            resolve(d.size);
        });
      });
    }
  };

  return Open.custom(customSource)
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