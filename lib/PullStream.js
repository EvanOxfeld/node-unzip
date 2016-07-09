'use strict';
const Stream = require('stream');
const Promise = require('bluebird');
const util = require('util')
const Buffer = require('buffer').Buffer;

function PullStream() {
  if (!(this instanceof PullStream))
    return new PullStream();

  Stream.Duplex.call(this,{decodeStrings:false});
  this.buffer = new Buffer(''); 
}

util.inherits(PullStream,Stream.Duplex);

PullStream.prototype._write = function(chunk,e,cb) {
  this.buffer = Buffer.concat([this.buffer,chunk]);
  this.cb = cb;
  this.emit('chunk');
};

PullStream.prototype.next = function() {
  if (this.cb) {
    this.cb();
    this.cb = undefined;
  }
  
  if (this.flushcb) {
    this.flushcb();
  }
};

PullStream.prototype.stream = function(len) {
  const p = Stream.PassThrough();
  let count = 0;

  const pull = () =>  {
    if (this.buffer && this.buffer.length) {
      let packet = this.buffer.slice(0,len);
      this.buffer = this.buffer.slice(len);
      len -= packet.length;
      p.write(packet);
    }
    
    if (len) {
      if (this.flushcb) {
        this.removeListener('chunk',pull);
        this.emit('error','FILE_ENDED');
        p.emit('error','FILE_ENDED');
      }
      this.next();
    } else {
      this.removeListener('chunk',pull);
      if (!this.buffer.length)
        this.next();
      p.end();
    }
  };

  this.on('chunk',pull);
  pull();
  return p;
};

PullStream.prototype.pull = function(len) {
  let buffer = new Buffer('');
  
  return new Promise( (resolve,reject) => {
    this.stream(len)
      .pipe(Stream.Transform({
        transform: (d,e,cb) => {
          buffer = Buffer.concat([buffer,d]);
          cb();
        }
      }))
      .on('finish',() => resolve(buffer))
      .on('error',reject);
  });
};

PullStream.prototype._read = function(){};

PullStream.prototype._flush = function(cb) {
  if (!this.buffer.length) 
    cb();
  else
    this.flushcb = cb;
};


module.exports = PullStream;
