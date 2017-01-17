var PullStream = require('../PullStream');
var Stream = require('stream');
var binary = require('binary');
var zlib = require('zlib');

// Backwards compatibility for node 0.8
if (!Stream.Writable)
  Stream = require('readable-stream');

module.exports = function unzip(source,offset) {
  var file = PullStream(),
      entry = Stream.PassThrough(),
      vars;

  var req = source.stream(offset);
  req.pipe(file);

  entry.vars = file.pull(30)
    .then(function(data) {
      var vars = binary.parse(data)
        .word32lu('signature')
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
      return file.pull(vars.fileNameLength)    
        .then(function(fileName) {
          vars.fileName = fileName.toString('utf8');
          return file.pull(vars.extraFieldLength);
        })
        .then(function(extraField) {
          var extra = binary.parse(extraField)
            .word16lu('signature')
            .word16lu('partsize')
            .word64lu('uncompressedSize')
            .word64lu('compressedSize')
            .word64lu('offset')
            .word64lu('disknum')
            .vars;
         
          if (vars.compressedSize === 0xffffffff)
            vars.compressedSize = extra.compressedSize;
          
          if (vars.uncompressedSize  === 0xffffffff)
            vars.uncompressedSize= extra.uncompressedSize;

          entry.emit('vars',vars);
          return vars;
        });
    });

    entry.vars.then(function(vars) {
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

      file.stream(eof)
        .pipe(inflater)
        .on('error',function(err) { entry.emit('error',err);})
        .pipe(entry)
        .on('finish', function() {
          if (req.abort)
            req.abort();
          else if (req.close)
            req.close();
          else if (req.push)
            req.push();
          else
            console.log('warning - unable to close stream');
        });
    })
    .catch(function(e) {
      entry.emit('error',e);
    });

  return entry;       
};