import { test } from 'tap';
import { Open, ParseOne } from '../index.js';
import fs from 'fs';

const archive = './testData/compressed-standard/archive.zip';

test('parse datetime using Open', function (t) {
  return Open.file(archive)
    .then(function(d) {
      const file = d.files.filter(function(file) {
        return file.path == 'file.txt';
      })[0];
      t.same(file.lastModifiedDateTime, new Date('2012-08-08T11:21:10.000Z'));
      t.end();
    });
});

test('parse datetime using Parse', function(t) {
  fs.createReadStream(archive)
    .pipe(ParseOne('file.txt'))
    .on('entry', function(entry) {
      if (entry.path !== 'file.txt')
        return entry.autodrain();
      t.same(entry.vars.lastModifiedDateTime, new Date('2012-08-08T11:21:10.000Z'));
      t.end();
    });
});
