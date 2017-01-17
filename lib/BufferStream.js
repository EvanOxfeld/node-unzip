var Promise = require('bluebird');
var Buffer = require('buffer').Buffer;
var Stream = require('stream');

// Backwards compatibility for node 0.8
if (!Stream.Writable)
  Stream = require('readable-stream');

module.exports = function(entry) {
  return new Promise(function(resolve,reject) {
    var buffer = new Buffer(''),
        bufferStream = Stream.Transform()
          .on('finish',function() {
            resolve(buffer);
          })
          .on('error',reject);
        
    bufferStream._transform = function(d,e,cb) {
      buffer = Buffer.concat([buffer,d]);
      cb();
    };
    entry.pipe(bufferStream);
  });
};