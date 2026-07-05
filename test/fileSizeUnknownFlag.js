import { test } from 'tap';
import fs from 'fs';
import temp from 'temp';
import dirdiff from 'dirdiff';
import { Parse, Extract } from '../index.js';

test("parse archive w/ file size unknown flag set (created by OS X Finder)", function (t) {
  const archive = './testData/compressed-OSX-Finder/archive.zip';

  const unzipParser = Parse();
  fs.createReadStream(archive).pipe(unzipParser);
  unzipParser.on('error', function(err) {
    throw err;
  });

  unzipParser.on('close', t.end.bind(this));
});

test("extract archive w/ file size unknown flag set (created by OS X Finder)", function (t) {
  const archive = './testData/compressed-OSX-Finder/archive.zip';

  temp.mkdir('node-unzip-', function (err, dirPath) {
    if (err) {
      throw err;
    }
    const unzipExtractor = Extract({ path: dirPath });
    unzipExtractor.on('error', function(err) {
      throw err;
    });
    unzipExtractor.on('close', testExtractionResults);

    fs.createReadStream(archive).pipe(unzipExtractor);

    function testExtractionResults() {
      dirdiff('./testData/compressed-OSX-Finder/inflated', dirPath, {
        fileContents: true
      }, function (err, diffs) {
        if (err) {
          throw err;
        }
        t.equal(diffs.length, 0, 'extracted directory contents');
        t.end();
      });
    }
  });
});

test("archive w/ language encoding flag set", function (t) {
  const archive = './testData/compressed-flags-set/archive.zip';

  temp.mkdir('node-unzip-', function (err, dirPath) {
    if (err) {
      throw err;
    }
    const unzipExtractor = Extract({ path: dirPath });
    unzipExtractor.on('error', function(err) {
      throw err;
    });
    unzipExtractor.on('close', testExtractionResults);

    fs.createReadStream(archive).pipe(unzipExtractor);

    function testExtractionResults() {
      dirdiff('./testData/compressed-flags-set/inflated', dirPath, {
        fileContents: true
      }, function (err, diffs) {
        if (err) {
          throw err;
        }
        t.equal(diffs.length, 0, 'extracted directory contents');
        t.end();
      });
    }
  });
});