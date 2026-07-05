import { test } from 'tap';
import path from 'path';
import temp from 'temp';
import dirdiff from 'dirdiff';
import { Open } from '../index.js';
import fs from 'fs';


test("extract compressed archive with open.file.extract", function (t) {
  const archive = './testData/compressed-standard/archive.zip';

  temp.mkdir('node-unzip-2', function (err, dirPath) {
    if (err) {
      throw err;
    }
    Open.file(archive)
      .then(function(d) {
        return d.extract({path: dirPath});
      })
      .then(async function() {
        const root = './testData/compressed-standard/inflated';

        // since empty directories can not be checked into git we have to
        // create them
        await fs.promises.mkdir(path.resolve(root, 'emptydir'), { recursive: true });
        await fs.promises.mkdir(path.resolve(root, 'emptyroot/emptydir'), { recursive: true });

        dirdiff('./testData/compressed-standard/inflated', dirPath, {
          fileContents: true
        }, function (err, diffs) {
          if (err) {
            throw err;
          }
          t.equal(diffs.length, 0, 'extracted directory contents');
          t.end();
        });
      });
  });
});