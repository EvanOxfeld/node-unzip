var Stream = require('stream');
var Promise = require('bluebird');
var util = require('util');
var Buffer = require('buffer').Buffer;

// Backwards compatibility for node 0.8
if (!Stream.Writable)
  Stream = require('readable-stream');

function PullStream() {
  if (!(this instanceof PullStream))
    return new PullStream();

  Stream.Duplex.call(this,{decodeStrings:false, objectMode:true});
  this.buffer = new Buffer(''); 
  var self = this;
  self.on('finish',function() {
    self.finished = true;
    self.emit('chunk',false);
  });
}

util.inherits(PullStream,Stream.Duplex);

PullStream.prototype._write = function(chunk,e,cb) {
  this.buffer = Buffer.concat([this.buffer,chunk]);
  this.cb = cb;
  this.emit('chunk');
};


// The `eof` parameter is interpreted as `file_length` if the type is number
// otherwise (i.e. buffer) it is interpreted as a pattern signaling end of stream
PullStream.prototype.stream = function(eof,includeEof) {
  var p = Stream.PassThrough();
  var count = 0,done,packet,self= this;

  function pull() {
    if (self.buffer && self.buffer.length) {
      if (typeof eof === 'number') {
        packet = self.buffer.slice(0,eof);
        self.buffer = self.buffer.slice(eof);
        eof -= packet.length;
        done = !eof;
      } else {
        var match = self.buffer.indexOf(eof);
        if (match !== -1) {
          if (includeEof) match = match + eof.length;
          packet = self.buffer.slice(0,match);
          self.buffer = self.buffer.slice(match);
          done = true;
        } else {
          var len = self.buffer.length - eof.length;
          packet = self.buffer.slice(0,len);
          self.buffer = self.buffer.slice(len);
        }
      }
      p.write(packet,function() {
        if (self.buffer.length === (eof.length || 0)) self.cb();
      });
    }
    
    if (!done) {
      if (self.finished && !this.__ended) {
        self.removeListener('chunk',pull);
        self.emit('error', new Error('FILE_ENDED'));
        this.__ended = true;
        return;
      }
      
    } else {
      self.removeListener('chunk',pull);
      p.end();
    }
  }

  self.on('chunk',pull);
  pull();
  return p;
};

PullStream.prototype.pull = function(eof,includeEof) {
  if (eof === 0) return Promise.resolve('');

  // If we already have the required data in buffer
  // we can resolve the request immediately
  if (!isNaN(eof) && this.buffer.length > eof) {
    var data = this.buffer.slice(0,eof);
    this.buffer = this.buffer.slice(eof);
    return Promise.resolve(data);
  }

  // Otherwise we stream until we have it
  var buffer = new Buffer(''),
      self = this;

  var concatStream = Stream.Transform();
  concatStream._transform = function(d,e,cb) {
    buffer = Buffer.concat([buffer,d]);
    cb();
  };
  
  return new Promise(function(resolve,reject) {
    if (self.finished)
      return reject(new Error('FILE_ENDED'));
    self.stream(eof,includeEof)
      .on('error',reject)
      .pipe(concatStream)
      .on('finish',function() {resolve(buffer);})
      .on('error',reject);
  });
};

PullStream.prototype._read = function(){};

module.exports = PullStream;
