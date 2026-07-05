import { test } from 'tap';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { Readable } from 'stream'; // 'node:stream'
import { Open, Extract } from '../index.js';

// Compute CRC32 for STORED zip entries
function crc32(buf) {
  if (!crc32._table) {
    const t = crc32._table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[i] = c;
    }
  }
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) crc = crc32._table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// Build a minimal STORED zip containing a single entry
function makeZip(entryPath, content) {
  const data = Buffer.from(content);
  const name = Buffer.from(entryPath);
  const crc = crc32(data);

  const local = Buffer.alloc(30 + name.length + data.length);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(0, 6);
  local.writeUInt16LE(0, 8);
  local.writeUInt16LE(0, 10);
  local.writeUInt16LE(0, 12);
  local.writeUInt32LE(crc, 14);
  local.writeUInt32LE(data.length, 18);
  local.writeUInt32LE(data.length, 22);
  local.writeUInt16LE(name.length, 26);
  local.writeUInt16LE(0, 28);
  name.copy(local, 30);
  data.copy(local, 30 + name.length);

  const cdOffset = local.length;
  const cd = Buffer.alloc(46 + name.length);
  cd.writeUInt32LE(0x02014b50, 0);
  cd.writeUInt16LE(20, 4);
  cd.writeUInt16LE(20, 6);
  cd.writeUInt16LE(0, 8);
  cd.writeUInt16LE(0, 10);
  cd.writeUInt16LE(0, 12);
  cd.writeUInt16LE(0, 14);
  cd.writeUInt32LE(crc, 16);
  cd.writeUInt32LE(data.length, 20);
  cd.writeUInt32LE(data.length, 24);
  cd.writeUInt16LE(name.length, 28);
  cd.writeUInt16LE(0, 30);
  cd.writeUInt16LE(0, 32);
  cd.writeUInt16LE(0, 34);
  cd.writeUInt16LE(0, 36);
  cd.writeUInt32LE(0, 38);
  cd.writeUInt32LE(0, 42);
  name.copy(cd, 46);

  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(1, 8);
  eocd.writeUInt16LE(1, 10);
  eocd.writeUInt32LE(cd.length, 12);
  eocd.writeUInt32LE(cdOffset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([local, cd, eocd]);
}

let _seq = 0;
function makeTempDir() {
  const dir = path.join(os.tmpdir(), 'unzipper-zipslip-' + process.pid + '-' + (++_seq));
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

test('Extract blocks sibling-prefix path traversal via unzipper.Extract', function(t) {
  const tmpDir = makeTempDir();
  const dest = path.join(tmpDir, 'dest');
  const sibling = path.join(tmpDir, 'dest-evil');
  fs.mkdirSync(dest);

  const zip = makeZip('../dest-evil/escaped.txt', 'pwned');
  const src = new Readable({ read() {} });
  src.push(zip);
  src.push(null);

  const extractor = src.pipe(Extract({ path: dest }));
  extractor.on('close', function() {
    t.notOk(fs.existsSync(path.join(sibling, 'escaped.txt')), 'file must not escape to sibling directory');
    t.end();
  });
  extractor.on('error', function() {
    t.notOk(fs.existsSync(path.join(sibling, 'escaped.txt')), 'file must not escape to sibling directory');
    t.end();
  });
});

test('Extract allows normal entries within destination', function(t) {
  const tmpDir = makeTempDir();
  const dest = path.join(tmpDir, 'dest');
  fs.mkdirSync(dest);

  const zip = makeZip('subdir/file.txt', 'hello');
  const src = new Readable({ read() {} });
  src.push(zip);
  src.push(null);

  const extractor = src.pipe(Extract({ path: dest }));
  extractor.on('close', function() {
    t.ok(fs.existsSync(path.join(dest, 'subdir', 'file.txt')), 'normal entry must be extracted');
    t.end();
  });
  extractor.on('error', t.fail.bind(t));
});

test('Open.extract blocks sibling-prefix path traversal', function(t) {
  const tmpDir = makeTempDir();
  const dest = path.join(tmpDir, 'dest');
  const sibling = path.join(tmpDir, 'dest-evil');
  fs.mkdirSync(dest);

  const zip = makeZip('../dest-evil/escaped.txt', 'pwned');

  Open.buffer(zip)
    .then(function(d) {
      return d.extract({ path: dest });
    })
    .then(function() {
      t.notOk(fs.existsSync(path.join(sibling, 'escaped.txt')), 'file must not escape to sibling directory');
      t.end();
    })
    .catch(function() {
      t.notOk(fs.existsSync(path.join(sibling, 'escaped.txt')), 'file must not escape to sibling directory');
      t.end();
    });
});

test('Open.extract allows normal entries within destination', function(t) {
  const tmpDir = makeTempDir();
  const dest = path.join(tmpDir, 'dest');
  fs.mkdirSync(dest);

  const zip = makeZip('subdir/file.txt', 'hello');

  Open.buffer(zip)
    .then(function(d) {
      return d.extract({ path: dest });
    })
    .then(function() {
      t.ok(fs.existsSync(path.join(dest, 'subdir', 'file.txt')), 'normal entry must be extracted');
      t.end();
    })
    .catch(t.fail.bind(t));
});
