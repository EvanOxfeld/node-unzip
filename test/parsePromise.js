'use strict';

import { test } from 'tap';
import fs from 'fs';
import { Parse } from '../index.js';

let entryRead;

test("promise should resolve when entries have been processed", function (t) {
  const archive = './testData/compressed-standard/archive.zip';

  fs.createReadStream(archive)
    .pipe(Parse())
    .on('entry', function(entry) {
      if (entry.path !== 'file.txt')
        return entry.autodrain();

      entry.buffer()
        .then(function() {
          entryRead = true;
        });
    })
    .promise()
    .then(function() {
      t.equal(entryRead, true);
      t.end();
    }, function() {
      t.fail('This project should resolve');
      t.end();
    });
});

test("promise should be rejected if there is an error in the stream", function (t) {
  const archive = './testData/compressed-standard/archive.zip';

  fs.createReadStream(archive)
    .pipe(Parse())
    .on('entry', function() {
      this.emit('error', new Error('this is an error'));
    })
    .promise()
    .then(function() {
      t.fail('This promise should be rejected');
      t.end();
    }, function(e) {
      t.equal(e.message, 'this is an error');
      t.end();
    });
});