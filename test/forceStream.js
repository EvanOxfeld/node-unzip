import { test } from 'tap';
import fs from 'fs';
import Stream from 'stream';
import { Parse } from '../index.js';

test("verify that setting the forceStream option emits a data event instead of entry", function (t) {
  const archive = './testData/compressed-standard/archive.zip';

  let dataEventEmitted = false;
  let entryEventEmitted = false;
  fs.createReadStream(archive)
    .pipe(Parse({ forceStream: true }))
    .on('data', function(entry) {
      t.equal(entry instanceof Stream.PassThrough, true);
      dataEventEmitted = true;
    })
    .on('entry', function() {
      entryEventEmitted = true;
    })
    .on('finish', function() {
      t.equal(dataEventEmitted, true);
      t.equal(entryEventEmitted, false);
      t.end();
    });
});
