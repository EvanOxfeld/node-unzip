import { test } from 'tap';
import { Open } from '../index.js';


test("get comment out of a zip", function (t) {
  const archive = './testData/compressed-comment/archive.zip';

  Open.file(archive)
    .then(function(d) {
      t.equal('Zipfile has a comment', d.comment);
      t.end();
    });
});