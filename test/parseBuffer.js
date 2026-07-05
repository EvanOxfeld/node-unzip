'use strict';

import { test } from 'tap';
import parseBuffer from '../lib/parseBuffer.js';

const buf = Buffer.from([
  0x62,
  0x75,
  0x66,
  0x68,
  0x65,
  0x72,
  0xFF,
  0xAE,
  0x00,
  0x11,
  0x99,
  0xD7,
  0x7B,
  0x13,
  0x35
]);

test(`parse little endian values for increasing byte size`, function (t) {
  const result = parseBuffer(buf, [
    ['key1', 1],
    ['key2', 2],
    ['key3', 4],
    ['key4', 8],
  ]);
  t.same(result, {
    key1: 98,
    key2: 26229,
    key3: 4285687144,
    key4: 3824536674483896300
  });
  t.end();
});

test(`parse little endian values for decreasing byte size`, function (t) {
  const result = parseBuffer(buf, [
    ['key1', 8],
    ['key2', 4],
    ['key3', 2],
    ['key4', 1],
  ]);
  t.same(result, {
    key1: 12609923261529487000,
    key2: 3617132800,
    key3: 4987,
    key4: 53
  });
  t.end();
});

test(`parse little endian values with null keys due to small buffer`, function (t) {
  const result = parseBuffer(buf, [
    ['key1', 8],
    ['key2', 8],
    ['key3', 8],
    ['key4', 8],
  ]);
  t.same(result, {
    key1: 12609923261529487000,
    key2: null,
    key3: null,
    key4: null
  });
  t.end();
});