import { test } from 'tap';
import fs from 'fs';
import os from 'os';
import path from 'path';
import temp from 'temp';
import dirdiff from 'dirdiff';
import { Extract, Parse } from '../index.js';

test("parse uncompressed archive", function (t) {
  const archive = './testData/uncompressed/archive.zip';

  const unzipParser = Parse();
  fs.createReadStream(archive).pipe(unzipParser);
  unzipParser.on('error', function(err) {
    throw err;
  });

  unzipParser.on('close', t.end.bind(this));
});

test("extract uncompressed archive", function (t) {
  const archive = './testData/uncompressed/archive.zip';

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
      dirdiff('./testData/uncompressed/inflated', dirPath, {
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

test("do not extract zip slip archive", function (t) {
  const archive = './testData/zip-slip/zip-slip.zip';

  temp.mkdir('node-zipslip-', function (err, dirPath) {
    if (err) {
      throw err;
    }
    const unzipExtractor = Extract({ path: dirPath });
    unzipExtractor.on('error', function(err) {
      throw err;
    });
    unzipExtractor.on('close', testNoSlip);

    fs.createReadStream(archive).pipe(unzipExtractor);

    function testNoSlip() {
      const mode = fs.F_OK | (fs.constants && fs.constants.F_OK);
      return fs.access(path.join(os.tmpdir(), 'evil.txt'), mode, evilFileCallback);
    }

    function evilFileCallback(err) {
      if (err) {
        t.pass('no zip slip');
      } else {
        t.fail('evil file created');
      }
      return t.end();
    }

  });
});

function testZipSlipArchive(t, slipFileName, attackPathFactory){
  const archive = path.join('./testData/zip-slip', slipFileName);

  temp.mkdir('node-zipslip-' + slipFileName, function (err, dirPath) {
    if (err) {
      throw err;
    }
    const attackPath = attackPathFactory(dirPath);
    CheckForSlip(attackPath, function(slipAlreadyExists){
      if(slipAlreadyExists){
        t.fail('Cannot check for slip because the slipped file already exists at "' + attackPath+ '"');
        t.end();
      }
      else{
        const unzipExtractor = Extract({ path: dirPath });
        unzipExtractor.on('error', function(err) {
          throw err;
        });
        unzipExtractor.on('close', testNoSlip);

        fs.createReadStream(archive).pipe(unzipExtractor);
      }
    });

    function CheckForSlip(path, resultCallback) {
      const fsCallback = function(err){ return resultCallback(!err); };
      const mode = fs.F_OK | (fs.constants && fs.constants.F_OK);
      return fs.access(path, mode, fsCallback);
    }

    function testNoSlip() {
      CheckForSlip(attackPath, function(slipExists) {
        if (slipExists) {
          t.fail('evil file created from ' + slipFileName + ' at "' + attackPath + '"');
          fs.unlinkSync(attackPath);
        } else {
          t.pass('no zip slip from ' + slipFileName);
        }
        return t.end();
      });
    }
  });
}

test("do not extract zip slip archive(Windows)", function (t) {
  let pathFactory;
  if(process.platform === "win32") {
    pathFactory = function() { return '\\Temp\\evil.txt'; };
  }
  else{
    // UNIX should treat the backslashes as escapes not directory delimiters
    // will be a file with slashes in the name. Looks real weird.
    pathFactory = function(dirPath) { return path.join(dirPath, '..\\..\\..\\..\\..\\..\\..\\..\\..\\..\\..\\..\\..\\..\\..\\..\\..\\..\\..\\..\\..\\..\\..\\..\\..\\..\\..\\..\\..\\..\\..\\..\\..\\..\\..\\..\\..\\..\\..\\..\\Temp\\evil.txt'); };
  }

  testZipSlipArchive(t, 'zip-slip-win.zip', pathFactory);
});
