import fsExtra from 'fs-extra';
import fs from 'fs'; // 'node:fs'
import path from 'path'; // 'node:path'
import { Writable } from 'stream'; // 'node:stream'
import duplexer2 from 'duplexer2';

import Parse from './parse.js';

export default function Extract (opts) {
  // make sure path is normalized before using it
  opts.path = path.resolve(path.normalize(opts.path));

  const parser = Parse(opts);

  const outStream = new Writable({
    objectMode: true,
    write
  });

  async function write(entry, encoding, cb) {
    // to avoid zip slip (writing outside of the destination), we resolve
    // the target path, and make sure it's nested in the intended
    // destination, or not extract it otherwise.
    // NOTE: Need to normalize to forward slashes for UNIX OS's to properly
    // ignore the zip slipped file entirely
    const extractPath = path.join(opts.path, entry.path.replace(/\\/g, '/'));
    const rel = path.relative(opts.path, extractPath);
    if (rel === '' || rel.startsWith('..') || path.isAbsolute(rel)) {
      return cb();
    }

    if (entry.type == 'Directory') {
      await fsExtra.ensureDir(extractPath);
      return cb();
    }

    await fsExtra.ensureDir(path.dirname(extractPath));

    const writer = opts.getWriter ? opts.getWriter({path: extractPath}) : fs.createWriteStream(extractPath);

    entry.pipe(writer)
      .on('error', cb)
      .on('close', cb);
  };

  // Create a combined stream
  const extract = duplexer2(parser, outStream);

  parser.once('crx-header', function(crxHeader) {
    extract.crxHeader = crxHeader;
  });

  parser
    .pipe(outStream)
    .on('finish', function() {
      extract.emit('close');
    });

  extract.promise = function() {
    return new Promise(function(resolve, reject) {
      extract.on('close', resolve);
      extract.on('error', reject);
    });
  };

  return extract;
}
