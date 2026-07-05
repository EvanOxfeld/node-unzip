import { PassThrough, Transform } from 'stream'; // 'node:stream'
import duplexer2 from 'duplexer2';

import Parse from './parse.js';
import BufferStream from './BufferStream.js';

export default function parseOne(match, opts) {
  const inStream = new PassThrough({objectMode:true});
  const outStream = new PassThrough();

  const transformer = new Transform({
    objectMode: true,
    transform
  });

  const re = match instanceof RegExp ? match : (match && new RegExp(match));
  let found;

  function transform(entry, e, cb) {
    if (found || (re && !re.exec(entry.path))) {
      entry.autodrain();
      return cb();
    } else {
      found = true;
      out.emit('entry', entry);
      entry.on('error', function(e) {
        outStream.emit('error', e);
      });
      entry.pipe(outStream)
        .on('error', function(err) {
          cb(err);
        })
        .on('finish', function(d) {
          cb(null, d);
        });
    }
  };

  inStream.pipe(Parse(opts))
    .on('error', function(err) {
      outStream.emit('error', err);
    })
    .pipe(transformer)
    .on('error', Object) // Silence error as its already addressed in transform
    .on('finish', function() {
      if (!found)
        outStream.emit('error', new Error('PATTERN_NOT_FOUND'));
      else
        outStream.end();
    });

  // Create a combined stream
  const out = duplexer2(inStream, outStream);

  out.buffer = function() {
    return BufferStream(outStream);
  };

  return out;
}
