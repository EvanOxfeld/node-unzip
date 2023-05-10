'use strict';

var test = require('tap').test;
var fs = require('fs');
var path = require('path');
var unzip = require('../');
var request = require('request');

test("get content of a single file entry out of a 502 MB zip from web", function (t) {
  return unzip.Open.url(request,'https://github.com/twbs/bootstrap/releases/download/v4.0.0/bootstrap-4.0.0-dist.zip')
    .then(function(d) {
      var file = d.files.filter(function(d) {
        return d.path === 'css/bootstrap-reboot.min.css';
      })[0];
      return file.buffer();
    })
    .then(function(str) {
       var fileStr = fs.readFileSync(path.join(__dirname, '../testData/bootstrap-reboot.min.css'), 'utf8');
      t.equal(str.toString(), fileStr);
      t.end();
    });
});