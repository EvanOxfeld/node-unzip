import { test } from 'tap';
import fs from 'fs';
import streamBuffers from "stream-buffers";
import { Parse } from '../index.js';

test("pipe a single file entry out of a zip", function (t) {
  const archive = './testData/compressed-standard/archive.zip';

  fs.createReadStream(archive)
    .pipe(Parse())
    .on('entry', function(entry) {
      if (entry.path === 'file.txt') {
        const writableStream = new streamBuffers.WritableStreamBuffer();
        writableStream.on('close', function () {
          const str = writableStream.getContentsAsString('utf8');
          const fileStr = fs.readFileSync('./testData/compressed-standard/inflated/file.txt', 'utf8');
          t.equal(str, fileStr);
          t.end();
        });
        entry.pipe(writableStream);
      } else {
        entry.autodrain();
      }
    });
});