# unzipper [![Build Status](https://api.travis-ci.org/ZJONSSON/node-unzipper.png)](https://api.travis-ci.org/ZJONSSON/node-unzipper)

This is a fork of [node-unzip](https://github.com/EvanOxfeld/node-pullstream) which has not been maintained in a while.  This fork addresses the following issues:
* finish/close events are not always triggered, particular when the input stream is slower than the receivers
* Any files are buffered into memory before passing on to entry

The stucture of this fork is similar to the original, but uses Promises and inherit guarantees provided by node streams to ensure low memory footprint and guarantee finish/close events at the end of processing.   The new `Parser` will push any parsed `entries` downstream if you pipe from it, while still supporting the legacy `entry` event as well.   

Breaking changes: The new `Parser` will not automatically drain entries if there are no listeners or pipes in place.

Unzipper provides simple APIs similar to [node-tar](https://github.com/isaacs/node-tar) for parsing and extracting zip files.
There are no added compiled dependencies - inflation is handled by node.js's built in zlib support.  

## Installation

```bash
$ npm install unzipper
```

## Options
The following options can be passed to the parser:
* `verbose : boolean` - logs information to screen
* `bypassDirectory : boolean` - stop parsing when we reach the central directory

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
contents. Otherwise you the stream will halt.

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
### Parse zip by piping entries downstream

If you `pipe` from unzipper the downstream components will receive each `entry` for further processing.   This allows for clean pipelines transforming zipfiles into unzipped data.

Example using `stream.Transform`:

```js
fs.createReadStream('path/to/archive.zip')
  .pipe(unzipper.Parse())
  .pipe(stream.Transform({
    objectMode: true,
    _transform: function(entry,e,cb) {
      var fileName = entry.path;
      var type = entry.type; // 'Directory' or 'File'
      var size = entry.size;
      if (fileName === "this IS the file I'm looking for") {
        entry.pipe(fs.createWriteStream('output/path'))
          .on('finish',cb);
      } else {
        entry.autodrain();
        cb();
      }
    }
  }
  }));
```

Example using [etl](https://www.npmjs.com/package/etl):

```js
fs.createReadStream('path/to/archive.zip')
  .pipe(unzipper.Parse())
  .pipe(etl.map(entry => {
    if (entry.path == "this IS the file I'm looking for")
      return entry
        .pipe(etl.toFile('output/path'))
        .promise();
    else
      entry.autodrain();
  }))
  
```

### Parse a single file and pipe contents

`unzipper.parseOne([regex])` is a convenience method that unzips only one file from the archive and pipes the contents down (not the entry itself).  If no serch criteria is specified, the first file in the archive will be unzipped.  Otherwise, each filename will be compared to the criteria and the first one to match will be unzipped and piped down.  If no file matches then the the stream will end without any content.

Example:

```js
fs.createReadStream('path/to/archive.zip')
  .pipe(unzipper.ParseOne())
  .pipe(fs.createReadStream('firstFile.txt'));
```

### Buffering the content of an entry into memory

While the recommended strategy of consuming the unzipped contents is using streams, it is sometimes convenient to be able to get the full buffered contents of each file .  Each `entry` provides a `.buffer` function that consumes the entry by buffering the contents into memory and returning a promise to the complete buffer.  

```js
fs.createReadStream('path/to/archive.zip')
  .pipe(unzipper.Parse())
  .pipe(etl.map(entry => {
    if (entry.path == "this IS the file I'm looking for")
      entry
        .buffer()
        .then(content => fs.writeFile('output/path',content))
    else
      entry.autodrain();
  }))
```

### Parse.promise() syntax sugar

The parser emits `finish` and `error` events like any other stream.  The parser additionally provides a promise wrapper around those two events to allow easy folding into existing Promise based structures.

Example:

```js
fs.createReadStream('path/to/archive.zip')
  .pipe(unzipper.Parse()
  .on('entry', entry => entry.autodrain())
  .promise()
  .then( () => console.log('done'), e => console.log('error',e));
```


## Licenses
See LICENCE