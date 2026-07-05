'use strict';

import { test } from 'tap';
import fs from 'fs';
import { Open } from '../index.js';
import il from 'iconv-lite';

test("get content of a single file entry out of a zip", function (t) {
  const archive = './testData/compressed-standard/archive.zip';

  return Open.file(archive)
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

test("get content of a single file entry out of a DOS zip", function (t) {
  const archive = './testData/compressed-cp866/archive.zip';

  return Open.file(archive, { fileNameEncoding: 'cp866' })
    .then(function(d) {
      const file = d.files.filter(function(file) {
        const fileName = file.isUnicode ? file.path : il.decode(file.pathBuffer, 'cp866');
        return fileName == 'Тест.txt';
      })[0];

      return file.buffer()
        .then(function(str) {
          const fileStr = il.decode(fs.readFileSync('./testData/compressed-cp866/inflated/Тест.txt'), 'cp1251');
          const zipStr = il.decode(str, 'cp1251');
          t.equal(zipStr, fileStr);
          t.equal(zipStr, 'Тестовый файл');
          t.end();
        });
    });
});


test("get multiple buffers concurrently", function (t) {
  const archive = './testData/compressed-directory-entry/archive.zip';
  return Open.file(archive)
    .then(function(directory) {
      return Promise.all(directory.files.map(function(file) {
        return file.buffer();
      }))
        .then(function(b) {
          directory.files.forEach(function(file, i) {
            t.equal(file.uncompressedSize, b[i].length);
          });
          t.end();
        });
    });
});