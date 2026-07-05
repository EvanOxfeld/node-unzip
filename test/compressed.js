import { test } from 'tap';
import fs from 'fs';
import path from 'path';
import temp from 'temp';
import dirdiff from 'dirdiff';
import { Parse, Extract } from '../index.js';
import il from 'iconv-lite';

test("parse compressed archive (created by POSIX zip)", function (t) {
  const archive = './testData/compressed-standard/archive.zip';

  const unzipParser = Parse();
  fs.createReadStream(archive).pipe(unzipParser);
  unzipParser.on('error', function(err) {
    throw err;
  });

  unzipParser.on('close', t.end.bind(this));
});

test("parse compressed archive (created by DOS zip)", function (t) {
  const archive = './testData/compressed-cp866/archive.zip';

  const unzipParser = Parse();
  fs.createReadStream(archive).pipe(unzipParser);
  unzipParser.on('entry', function(entry) {
    const fileName = entry.props.flags.isUnicode ? entry.path : il.decode(entry.props.pathBuffer, 'cp866');
    t.equal(fileName, 'Тест.txt');
  });
  unzipParser.on('error', function(err) {
    throw err;
  });

  unzipParser.on('close', t.end.bind(this));
});

test("extract compressed archive w/ file sizes known prior to zlib inflation (created by POSIX zip)", function (t) {
  const archive = './testData/compressed-standard/archive.zip';

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

    async function testExtractionResults() {
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
    }
  });
});