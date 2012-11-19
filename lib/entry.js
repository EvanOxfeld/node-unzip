'use strict';

module.exports = Entry;

var PassThrough = require('readable-stream/passthrough');
var inherits = require('util').inherits;

inherits(Entry, PassThrough);

function Entry () {
  PassThrough.call(this, { lowWaterMark: 0 });
  this.props = {};
}
