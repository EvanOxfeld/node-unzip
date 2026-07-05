import { test } from 'tap';
import fs from 'fs';
import streamBuffers from "stream-buffers";
import { Parse } from '../index.js';
import Stream from 'stream';

test("pipe a single file entry out of a zip", function (t) {
  const receiver = Stream.Transform({objectMode:true});
  receiver._transform = function(entry, e, cb) {
    if (entry.path === 'file.txt') {
      const writableStream = new streamBuffers.WritableStreamBuffer();
      writableStream.on('close', function () {
        const str = writableStream.getContentsAsString('utf8');
        const fileStr = fs.readFileSync('./testData/compressed-standard/inflated/file.txt', 'utf8');
        t.equal(str, fileStr);
        t.end();
        cb();
      });
      entry.pipe(writableStream);
    } else {
      entry.autodrain();
      cb();
    }
  };

  const archive = './testData/compressed-standard/archive.zip';

  fs.createReadStream(archive)
    .pipe(Parse())
    .pipe(receiver);

});
