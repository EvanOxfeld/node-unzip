'use strict';

var test = require('tap').test;
var path = require('path');
var unzip = require('../');


test("get comment out of a zip", function (t) {
  var archive = path.join(__dirname, '../testData/compressed-comment/archive.zip');

  unzip.Open.file(archive)
    .then(function(d) {
        t.equal('Zipfile has a comment', d.comment);
        t.end();
    });
});