'use strict';

module.exports = Parse.create = Parse;

var Stream = require('stream').Stream;
var inherits = require('util').inherits;

inherits(Parse, Stream);

function Parse() {
  var self = this;
  if (!(self instanceof Parse)) return new Parse();

  Stream.apply(self);

  self.writable = true;
  self.readable = true;
  self.position = 0;
}

Parse.prototype.write = function (data) {
 console.log('write', data);
  processData(data);
}

Parse.prototype.end = function (data) {
  console.log('end', data);
  processData(data);
}

function processData(data) {
  console.log('processData', data);
}