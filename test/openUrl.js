'use strict';

var test = require('tap').test;
var fs = require('fs');
var path = require('path');
var unzip = require('../');
var request = require('request');

test("get content of a single file entry out of a 502 MB zip from web", function (t) {
  return unzip.Open.url(request,'http://www2.census.gov/geo/tiger/TIGER2015/ZCTA5/tl_2015_us_zcta510.zip')
    .then(function(d) {
      var file = d.files.filter(function(d) {
        return d.path === 'tl_2015_us_zcta510.shp.iso.xml';
      })[0];
      return file.buffer();
    })
    .then(function(str) {
       var fileStr = fs.readFileSync(path.join(__dirname, '../testData/tl_2015_us_zcta510.shp.iso.xml'), 'utf8');
      t.equal(str.toString(), fileStr);
      t.end();
    });
});