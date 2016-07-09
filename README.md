# unzipper [![Build Status](https://api.travis-ci.org/ZJONSSON/node-unzipper.png)](https://api.travis-ci.org/ZJONSSON/node-unzipper)

This is a fork of [node-unzip](https://github.com/EvanOxfeld/node-pullstream) which has not been maintained in a while.  This fork addresses the following issues:
* finish/close events are not always triggered, particular when the input stream is slower than the receivers
* Any files are buffered into memory before passing on to entry

The stucture of this fork is identical to the original, but uses ES6, Promises and inherit guarantees provided by node streams to ensure low memory footprint and guarantee finish/close events at the end of processing. 

Unzipper provides simple APIs similar to [node-tar](https://github.com/isaacs/node-tar) for parsing and extracting zip files.
There are no added compiled dependencies - inflation is handled by node.js's built in zlib support.  

## Installation

```bash
$ npm install unzipper
```

## Quick Examples

### Extract to a directory
```js
fs.createReadStream('path/to/archive.zip')
  .pipe(unzipper.Extract({ path: 'output/path' }));
```

Extract emits the 'close' event once the zip's contents have been fully extracted to disk.

### Parse zip file contents

Process each zip file entry or pipe entries to another stream.

__Important__: If you do not intend to consume an entry stream's raw data, call autodrain() to dispose of the entry's
contents. Otherwise you risk running out of memory.

```js
fs.createReadStream('path/to/archive.zip')
  .pipe(unzipper.Parse())
  .on('entry', function (entry) {
    var fileName = entry.path;
    var type = entry.type; // 'Directory' or 'File'
    var size = entry.size;
    if (fileName === "this IS the file I'm looking for") {
      entry.pipe(fs.createWriteStream('output/path'));
    } else {
      entry.autodrain();
    }
  });
```

Or pipe the output of unzipper.Parse() to fstream

```js
var readStream = fs.createReadStream('path/to/archive.zip');
var writeStream = fstream.Writer('output/path');

readStream
  .pipe(unzipper.Parse())
  .pipe(writeStream)
```

## Licenses
See LICENCE