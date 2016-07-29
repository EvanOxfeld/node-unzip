'use strict';

module.exports = Extract;

var Parse = require('./parse');
var Writer = require('fstream').Writer;
var util = require('util');
var path = require('path');

util.inherits(Extract, Parse);

function Extract (opts) {
  if (!(this instanceof Extract))
    return new Extract(opts);

  Parse.call(this);

  this.on('entry', entry => {
    if (entry.type == 'Directory') return;
    entry.pipe(Writer({
      path: path.join(opts.path,entry.path)
    }))
    .on('error',e => this.emit('error',e));
  });
}
