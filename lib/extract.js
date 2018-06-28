module.exports = Extract;

var Parse = require('./parse');
var Writer = require('fstream').Writer;
var util = require('util');
var path = require('path');

util.inherits(Extract, Parse);

function Extract (opts) {
  if (!(this instanceof Extract))
    return new Extract(opts);

  var self = this;
  
  var finishCb;
  var pending = 0;
  var _final = typeof this._final === 'function' ? this._final : undefined;

  function checkFinished() {
    if (pending === 0 && finishCb) {
      _final ? _final(finishCb) : finishCb();
    }
  }

  this._final = function(cb) {
    finishCb = cb;
    checkFinished();
  };

  Parse.call(self,opts);

  self.on('entry', function(entry) {
    if (entry.type == 'Directory') return;

    // to avoid zip slip (writing outside of the destination), we resolve
    // the target path, and make sure it's nested in the intended
    // destination, or not extract it otherwise.
    var extractPath = path.join(opts.path, entry.path);
    if (extractPath.indexOf(opts.path) != 0) {
      return;
    }

    const writer = opts.getWriter ? opts.getWriter({path: extractPath}) :  Writer({ path: extractPath });

    pending += 1;
    entry.pipe(writer)
    .on('error',function(e) {
      self.emit('error',e);
      pending -= 1;
      checkFinished();
    })
    .on('close', function() {
      pending -= 1;
      checkFinished();
    });
  });
}
