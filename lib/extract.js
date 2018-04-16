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

    entry.pipe(Writer({
      path: extractPath
    }))
    .on('error',function(e) {
      self.emit('error',e);
    });
  });
}
