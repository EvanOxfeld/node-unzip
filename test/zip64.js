'use strict';

import t from 'tap';
import { Parse, Extract, Open } from '../index.js';
import fs from 'fs';
import temp from 'temp';

const UNCOMPRESSED_SIZE = 5368709120;
const ZIP64_OFFSET = 72;
const ZIP64_SIZE = 36;
const ZIP64_EXTRA_FIELD_OFFSET = 0;

t.test('Correct uncompressed size for zip64', function (t) {
  const archive = './testData/big.zip';

  t.test('in unzipper.Open', function(t) {
    Open.file(archive)
      .then(function(d) {
        const file = d.files[0];
        t.same(file.uncompressedSize, UNCOMPRESSED_SIZE, 'Open: Directory header');

        d.files[0].stream()
          .on('vars', function(vars) {
            t.same(vars.uncompressedSize, UNCOMPRESSED_SIZE, 'Open: File header');
            t.end();
          })
          .on('error', function(e) {
            t.same(e.message, 'FILE_ENDED');
            t.end();
          });
      });
  });

  t.test('in unzipper.parse', function(t) {
    fs.createReadStream(archive)
      .pipe(Parse())
      .on('entry', function(entry) {
        t.same(entry.vars.uncompressedSize, UNCOMPRESSED_SIZE, 'Parse: File header');
        t.end();
      });
  });

  t.end();
});

t.test('Parse files with all zip64 extra fields correctly', function (t) {
  const archive = './testData/zip64-allextrafields.zip';

  t.test('in unzipper.Open', function(t) {
    Open.file(archive)
      .then(function(d) {
        d.files[0].stream()
          .on('vars', function(vars) {
            t.same(vars.extra.uncompressedSize, ZIP64_SIZE, 'Open: Extra field');
            t.same(vars.extra.compressedSize, ZIP64_SIZE, 'Open: Extra field');
            t.same(vars.extra.offsetToLocalFileHeader, ZIP64_EXTRA_FIELD_OFFSET, 'Open: Extra field');
            t.same(vars.uncompressedSize, ZIP64_SIZE, 'Open: File header');
            t.same(vars.compressedSize, ZIP64_SIZE, 'Open: File header');
            t.same(vars.offsetToLocalFileHeader, ZIP64_EXTRA_FIELD_OFFSET, 'Open: File header');
            t.end();
          })
          .on('error', function(e) {
            t.same(e.message, 'FILE_ENDED');
            t.end();
          });
      });
  });

  t.test('in unzipper.extract', function (t) {
    temp.mkdir('node-unzip-', function (err, dirPath) {
      if (err) {
        throw err;
      }
      fs.createReadStream(archive)
        .pipe(Extract({ path: dirPath }))
        .on('close', function() { t.end(); });
    });
  });

  t.end();
});

t.test('Parse files with zip64 extra field with only offset length correctly', function (t) {
  const archive = './testData/zip64-extrafieldoffsetlength.zip';

  t.test('in unzipper.Open', function(t) {
    Open.file(archive)
      .then(function(d) {
        d.files[0].stream()
          .on('vars', function(vars) {
            t.same(vars.extra.offsetToLocalFileHeader, ZIP64_EXTRA_FIELD_OFFSET, 'Open: Extra field');
            t.same(vars.offsetToLocalFileHeader, ZIP64_EXTRA_FIELD_OFFSET, 'Open: File header');
            t.end();
          })
          .on('error', function(e) {
            t.same(e.message, 'FILE_ENDED');
            t.end();
          });
      });
  });

  t.test('in unzipper.extract', function (t) {
    temp.mkdir('node-unzip-', function (err, dirPath) {
      if (err) {
        throw err;
      }
      fs.createReadStream(archive)
        .pipe(Extract({ path: dirPath }))
        .on('close', function() { t.end(); });
    });
  });

  t.end();
});

t.test('Parse files from regular zip64 format correctly', function (t) {
  const archive = './testData/zip64.zip';

  t.test('in unzipper.Open', function(t) {
    Open.file(archive)
      .then(function(d) {
        t.same(d.offsetToStartOfCentralDirectory, ZIP64_OFFSET, 'Open: Directory header');
        t.same(d.files.length, 1, 'Open: Files Size');

        d.files[0].stream()
          .on('vars', function(vars) {
            t.same(vars.offsetToLocalFileHeader, 0, 'Open: File header');
            t.same(vars.uncompressedSize, ZIP64_SIZE, 'Open: File header');
            t.same(vars.compressedSize, ZIP64_SIZE, 'Open: File header');
            t.same(vars.path, 'README', 'Open: File header');
            t.end();
          })
          .on('error', function(e) {
            t.same(e.message, 'FILE_ENDED');
            t.end();
          });
      });
  });

  t.test('in unzipper.parse', function(t) {
    fs.createReadStream(archive)
      .pipe(Parse())
      .on('entry', function(entry) {
        t.same(entry.vars.uncompressedSize, ZIP64_SIZE, 'Parse: File header');
      })
      .on('close', function() { t.end(); });
  });

  t.test('in unzipper.extract', function (t) {
    temp.mkdir('node-unzip-', function (err, dirPath) {
      if (err) {
        throw err;
      }
      fs.createReadStream(archive)
        .pipe(Extract({ path: dirPath }))
        .on('close', function() { t.end(); });
    });
  });

  t.end();
});
