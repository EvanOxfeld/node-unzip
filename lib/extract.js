'use strict';

module.exports = Extract;

var Parse = require("../unzip").Parse;
var Writer = require("fstream").Writer;
var Writable = require('readable-stream/writable');
var path = require('path');
var inherits = require('util').inherits;

inherits(Extract, Writable);

function Extract (opts) {
  var self = this;
  if (!(this instanceof Extract)) {
    return new Extract(opts);
  }

  Writable.apply(this);

  this._parser = Parse();
  this._parser.on('error', function(err) {
    self.emit('error', err);
  });
  this.on('finish', function() {
    self._parser.end();
  });

  var writer = Writer(opts);
  writer.on('error', function(err) {
    self.emit('error', err);
  });
  writer.on('close', function() {
    self.emit('close')
  });

  this._parser.pipe(writer);
}

Extract.prototype._write = function (chunk, callback) {
  if (this._parser.write(chunk)) {
    return callback();
  }

  return this._parser.once('drain', callback);
};
