# unzipper [![Build Status](https://api.travis-ci.org/ZJONSSON/node-unzipper.png?branch=master)](https://travis-ci.org/ZJONSSON/node-unzipper?branch=master)

This is a fork of [node-unzip](https://github.com/EvanOxfeld/node-unzip) which has not been maintained in a while.  This fork addresses the following issues:
* finish/close events are not always triggered, particular when the input stream is slower than the receivers
* Any files are buffered into memory before passing on to entry

The stucture of this fork is similar to the original, but uses Promises and inherit guarantees provided by node streams to ensure low memory footprint and guarantee finish/close events at the end of processing.   The new `Parser` will push any parsed `entries` downstream if you pipe from it, while still supporting the legacy `entry` event as well.   

Breaking changes: The new `Parser` will not automatically drain entries if there are no listeners or pipes in place.

Unzipper provides simple APIs similar to [node-tar](https://github.com/isaacs/node-tar) for parsing and extracting zip files.
There are no added compiled dependencies - inflation is handled by node.js's built in zlib support. 

Please note:  Methods that use the Central Directory instead of parsing entire file can be found under [`Open`](#open)

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
contents. Otherwise the stream will halt.   `.autodrain()` returns an empty stream that provides `error` and `finish` events.
Additionally you can call `.autodrain().promise()` to get the promisified version of success or failure of the autodrain.

```
// If you want to handle autodrain errors you can either:
entry.autodrain().catch(e => handleError);
// or
entry.autodrain().on('error' => handleError);
```

Here is a quick example:


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
    transform: function(entry,e,cb) {
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

## Open
Previous methods rely on the entire zipfile being received through a pipe.  The Open methods load take a different approach: load the central directory first (at the end of the zipfile) and provide the ability to pick and choose which zipfiles to extract, even extracting them in parallel.   The open methods return a promise on the contents of the directory, with individual `files` listed in an array.   Each file element has the following methods:
* `stream([password])` - returns a stream of the unzipped content which can be piped to any destination
* `buffer([password])` - returns a promise on the buffered content of the file)
If the file is encrypted you will have to supply a password to decrypt, otherwise you can leave blank.   
Unlike adm-zip the Open methods will never read the entire zipfile into buffer.

### Open.file([path])
Returns a Promise to the central directory information with methods to extract individual files.   `start` and `end` options are used to avoid reading the whole file.

Example:
```js
unzipper.Open.file('path/to/archive.zip')
  .then(function(d) {
    console.log('directory',d);
    return new Promise(function(resolve,reject) {
      d.files[0].stream()
        .pipe(fs.createWriteStream('firstFile'))
        .on('error',reject)
        .on('finish',resolve)
     });
  });
```

### Open.url([requestLibrary], [url | options])
This function will return a Promise to the central directory information from a URL point to a zipfile.  Range-headers are used to avoid reading the whole file. Unzipper does not ship with a request library so you will have to provide it as the first option.

Live Example: (extracts a tiny xml file from the middle of a 500MB zipfile)

```js
var request = require('request');
var unzipper = require('./unzip');

unzipper.Open.url(request,'http://www2.census.gov/geo/tiger/TIGER2015/ZCTA5/tl_2015_us_zcta510.zip')
  .then(function(d) {
    var file = d.files.filter(function(d) {
      return d.path === 'tl_2015_us_zcta510.shp.iso.xml';
    })[0];
    return file.buffer();
  })
  .then(function(d) {
    console.log(d.toString());
  });
```


This function takes a second parameter which can either be a string containing the `url` to request, or an `options` object to invoke the supplied `request` library with. This can be used when other request options are required, such as custom heders or authentication to a third party service.

```js
const request = require('google-oauth-jwt').requestWithJWT();

const googleStorageOptions = {
    url: `https://www.googleapis.com/storage/v1/b/m-bucket-name/o/my-object-name`,
    qs: { alt: 'media' },
    jwt: {
        email: google.storage.credentials.client_email,
        key: google.storage.credentials.private_key,
        scopes: ['https://www.googleapis.com/auth/devstorage.read_only']
    }
});

return unzipper.Open.url(request, googleStorageOptions).then((zip) => {
    const file = zip.files.find((file) => file.path === 'my-filename');
    return file.stream().pipe(res);
});
```

### Open.s3([aws-sdk], [params])
This function will return a Promise to the central directory information from a zipfile on S3.  Range-headers are used to avoid reading the whole file.    Unzipper does not ship with with the aws-sdk so you have to provide an instanciated client as first arguments.    The params object requires `Bucket` and `Key` to fetch the correct file.

Example:

```js
var unzipper = require('./unzip');
var AWS = require('aws-sdk');
var s3Client = AWS.S3(config);

unzipper.Open.s3(s3Client,{Bucket: 'unzipper', Key: 'archive.zip'})
  .then(function(d) {
    console.log('directory',d);
    return new Promise(function(resolve,reject) {
      d.files[0].stream()
        .pipe(fs.createWriteStream('firstFile'))
        .on('error',reject)
        .on('finish',resolve)
     });
  });
```

### Open.buffer(buffer)
If you already have the zip file in-memory as a buffer, you can open the contents directly.

Example:

```js
// never use readFileSync - only used here to simplify the example
var buffer = fs.readFileSync('path/to/arhive.zip');  

unzipper.Open.buffer(buffer)
  .then(function(d) {
    console.log('directory',d);
    return new Promise(function(resolve,reject) {
      d.files[0].stream()
        .pipe(fs.createWriteStream('firstFile'))
        .on('error',reject)
        .on('finish',resolve)
     });
  });
```

## Licenses
See LICENCE
