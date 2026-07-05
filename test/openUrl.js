import { test } from 'tap';
import fs from 'fs';
import { Open } from '../index.js';
import request from 'request';

test("get content of a single file entry out of a 502 MB zip from web", function (t) {
  return Open.url(request, 'https://github.com/twbs/bootstrap/releases/download/v4.0.0/bootstrap-4.0.0-dist.zip')
    .then(function(d) {
      const file = d.files.filter(function(d) {
        return d.path === 'css/bootstrap-reboot.min.css';
      })[0];
      return file.buffer();
    })
    .then(function(str) {
      const fileStr = fs.readFileSync('./testData/bootstrap-reboot.min.css', 'utf8');
      t.equal(str.toString(), fileStr);
      t.end();
    });
});