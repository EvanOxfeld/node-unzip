'use strict';

module.exports = Entry;

var Stream = require('stream').Stream;
var inherits = require('util').inherits;

inherits(Entry, Stream);

function Entry () {
  Stream.call(this);

  this.writable = false;
  this.readable = true;

  this.props = {
    type: 'Directory'
  };
  this.header = {
    type: 'Directory'
  };
}

Entry.prototype.pause = function () {
  console.error('pause is a lie');
};

Entry.prototype.resume = function () {
  console.error('resume is also a lie');
};