var util = require('util');
var zlib = require('zlib');
var Stream = require('stream');
var binary = require('binary');
var Promise = require('bluebird');
var PullStream = require('./PullStream');

// Backwards compatibility for node 0.8
if (!Stream.Writable)
  Stream = require('readable-stream');

function NoopStream() {
  if (!(this instanceof NoopStream)) {
    return new NoopStream();
  }
  Stream.Transform.call(this);
}
util.inherits(NoopStream,Stream.Transform);

NoopStream.prototype._transform = function(d,e,cb) { cb() ;};
  
function Parse(opts) {
  if (!(this instanceof Parse)) {
    return new Parse(opts);
  }
  var self = this;
  self._opts = opts || { verbose: false };

  PullStream.call(self, self._opts);
  self.on('finish',function() {
    self.emit('close');
  });
  self._readRecord();
}

util.inherits(Parse, PullStream);

Parse.prototype._readRecord = function () {
  var self = this;
  self.pull(4).then(function(data) {
    if (data.length === 0)
      return;

    var signature = data.readUInt32LE(0);
    if (signature === 0x04034b50)
      self._readFile();
    else if (signature === 0x02014b50)
      self._readCentralDirectoryFileHeader();
    else if (signature === 0x06054b50)
      self._readEndOfCentralDirectoryRecord();
    else 
      self.emit('error', Error('invalid signature: 0x' + signature.toString(16)));
  });
};

Parse.prototype._readFile = function () {
  var self = this;
  self.pull(26).then(function(data) {
    var vars = binary.parse(data)
      .word16lu('versionsNeededToExtract')
      .word16lu('flags')
      .word16lu('compressionMethod')
      .word16lu('lastModifiedTime')
      .word16lu('lastModifiedDate')
      .word32lu('crc32')
      .word32lu('compressedSize')
      .word32lu('uncompressedSize')
      .word16lu('fileNameLength')
      .word16lu('extraFieldLength')
      .vars;

    return self.pull(vars.fileNameLength).then(function(fileName) {
      fileName = fileName.toString('utf8');
      var entry = Stream.PassThrough();
      entry.autodrain = function() {
        return new Promise(function(resolve,reject) {
          entry.pipe(NoopStream());
          entry.on('finish',resolve);
          entry.on('error',reject);
        });
      };
      entry.path = fileName;
      entry.props = {};
      entry.props.path = fileName;
      entry.type = (vars.compressedSize === 0 && /[\/\\]$/.test(fileName)) ? 'Directory' : 'File';

      if (self._opts.verbose) {
        if (entry.type === 'Directory') {
          console.log('   creating:', fileName);
        } else if (entry.type === 'File') {
          if (vars.compressionMethod === 0) {
            console.log(' extracting:', fileName);
          } else {
            console.log('  inflating:', fileName);
          }
        }
      }

      self.emit('entry', entry);

      if (self._readableState.pipesCount)
        self.push(entry);
        
      self.pull(vars.extraFieldLength).then(function(extraField) {
        var fileSizeKnown = !(vars.flags & 0x08),
            eof;

        var inflater = vars.compressionMethod ? zlib.createInflateRaw() : Stream.PassThrough();

        if (fileSizeKnown) {
          entry.size = vars.uncompressedSize;
          eof = vars.compressedSize;
        } else {
          eof = new Buffer(4);
          eof.writeUInt32LE(0x08074b50, 0);
        }

        self.stream(eof)
          .pipe(inflater)
          .on('error',function(err) { self.emit('error',err);})
          .pipe(entry)
          .on('finish', function() {
            return fileSizeKnown ? self._readRecord() : self._processDataDescriptor(entry);
          });
      });
    });
  });
};

Parse.prototype._processDataDescriptor = function (entry) {
  var self = this;
  self.pull(16).then(function(data) {
    var vars = binary.parse(data)
      .word32lu('dataDescriptorSignature')
      .word32lu('crc32')
      .word32lu('compressedSize')
      .word32lu('uncompressedSize')
      .vars;

    entry.size = vars.uncompressedSize;
    self._readRecord();
  });
};

Parse.prototype._readCentralDirectoryFileHeader = function () {
  var self = this;
  self.pull(42).then(function(data) {
    
    var vars = binary.parse(data)
      .word16lu('versionMadeBy')
      .word16lu('versionsNeededToExtract')
      .word16lu('flags')
      .word16lu('compressionMethod')
      .word16lu('lastModifiedTime')
      .word16lu('lastModifiedDate')
      .word32lu('crc32')
      .word32lu('compressedSize')
      .word32lu('uncompressedSize')
      .word16lu('fileNameLength')
      .word16lu('extraFieldLength')
      .word16lu('fileCommentLength')
      .word16lu('diskNumber')
      .word16lu('internalFileAttributes')
      .word32lu('externalFileAttributes')
      .word32lu('offsetToLocalFileHeader')
      .vars;

    return self.pull(vars.fileNameLength).then(function(fileName) {
      
      fileName = fileName.toString('utf8');

      self.pull(vars.extraFieldLength).then(function(extraField) {
        self.pull(vars.fileCommentLength).then(function(fileComment) {
          return self._readRecord();
        });
      });
    });
  });
};

Parse.prototype._readEndOfCentralDirectoryRecord = function () {
  var self = this;
  self.pull(18).then(function(data) {
    
    var vars = binary.parse(data)
      .word16lu('diskNumber')
      .word16lu('diskStart')
      .word16lu('numberOfRecordsOnDisk')
      .word16lu('numberOfRecords')
      .word32lu('sizeOfCentralDirectory')
      .word32lu('offsetToStartOfCentralDirectory')
      .word16lu('commentLength')
      .vars;

    if (vars.commentLength) {
        self.pull(vars.commentLength).then(function(comment) {
          comment = comment.toString('utf8');
          self.end();
          self.push(null);
        });
    } else {
      self.end();
      self.push(null);
    }
  });
};

module.exports = Parse;