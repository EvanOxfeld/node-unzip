import { Transform } from 'stream'; // 'node:stream'

export default class NoopStream extends Transform {
  _transform(d, e, cb) { cb() ;};
}