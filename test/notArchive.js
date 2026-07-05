import { test } from 'tap';
import fs from 'fs';
import temp from 'temp';
import { Parse, Extract, Open } from '../index.js';

const archive = './package.json';

test('parse a file that is not an archive', function (t) {

  const unzipParser = Parse();
  fs.createReadStream(archive).pipe(unzipParser);
  unzipParser.on('error', function(err) {
    t.ok(err.message.indexOf('invalid signature: 0x') !== -1);
    t.end();
  });

  unzipParser.on('close', function(d) {
    t.fail('Archive was parsed', d);
  });
});

test('extract a file that is not an archive', function (t) {

  temp.mkdir('node-unzip-', function(err, dirPath) {
    if (err) {
      throw err;
    }
    const unzipExtractor = Extract({ path: dirPath });
    unzipExtractor.on('error', function(err) {
      t.ok(err.message.indexOf('invalid signature: 0x') !== -1);
      t.end();
    });
    unzipExtractor.on('close', function() {
      t.fail('Archive was extracted');
    });

    fs.createReadStream(archive).pipe(unzipExtractor);
  });
});

test('get content of a single file entry out of a file that is not an archive', function (t) {
  Open.file(archive)
    .then(function(d) {
      t.fail('Archive was opened', d);
    })
    .catch(function(err) {
      t.equal(err.message, 'FILE_ENDED');
      t.end();
    });
});