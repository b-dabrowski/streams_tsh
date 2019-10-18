# Node.js Streams

Unix inspired way to move data from some input to some output.

Unix inspired - connect small programs with pipes

Unix: a | b | c | d

Node.js: a.pipe(b).pipe(c).pipe(d)

## why we need streams?

Because sometimes things don't fit into memory and need to be processed chunk by chunk.

why_buffering.js
```
var http = require('http');
var fs = require('fs');

var server = http.createServer(function (req, res) {
    fs.readFile('./data.txt', function (err, data) {
        res.end(data);
    });
});
server.listen(8080);
```

If data.txt is huge it may cause out of memory errors.

Here's a streaming version

why_streaming.js
```
var http = require('http');
var fs = require('fs');

var server = http.createServer(function (req, res) {
    var stream = fs.createReadStream('./data.txt');
    stream.pipe(res);
});
server.listen(8080);
```

## fs

fs.js
```
var fs = require('fs');
fs.createReadStream('./data.txt').pipe(process.stdout);
// fs.createReadStream(process.argv[2]).pipe(process.stdout);
```

This is Unix cat command in Node.js

## transform with through2

Now let's upper case the input data.

transform_through2.js
```
var fs = require('fs');
var through = require('through2');

fs.createReadStream('./data.txt').pipe(through(toUpper)).pipe(process.stdout);

function toUpper(buffer, encoding, next) {
    next(null, buffer.toString().toUpperCase());
}
```
buffer is Node.js Buffer object, encoding can be mostly ignored, next is called when you need next piece of data.
null is standing for error here. It's the errback pattern.
through2 library is turning a function into a transform stream.

## transform with core stream module

transform_core.js
```
var fs = require('fs');
var Transform = require('stream').Transform;

const toUpperStream = new Transform({
    transform(buf, enc, next) {
        toUpper(buf, enc, next);
    }
});
fs.createReadStream('./data.txt').pipe(toUpperStream).pipe(process.stdout);

function toUpper(buffer, encoding, next) {
    next(null, buffer.toString().toUpperCase());
}
```

## separating read and write

The way we call next is both reading next data chunk and writing transformed data.
Sometimes we may want to buffer more data (call next several times) before we push it further.

transform_through2.js
```
function toUpper(buffer, encoding, next) {
    // next(null, buffer.toString().toUpperCase());
    this.push(buffer.toString().toUpperCase()); // from readable
    next();
}
```

If you push null it means the end of stream.

## stream types

* readable - produces data (e.g. fs.createReadStream())
* writable - consumes data (e.g. HTTP response on the server)
* transform - consumes and produces data (e.g. through2)
* duplex - consumes data separately from producing data (bidirectional network protocols)



* readable: `readable.pipe(A)`
* writable: `A.pipe(writable)`
* transform: `A.pipe(transform).pipe(B)`
* duplex: `A.pipe(duplex).pipe(A)`

## writable streams

e.g. HTTP response

* ```res.write(buf)```
* ```res.end()```
* ```res.end(buf)``` - shorthand
* ```res.on('finish', function() {})```
* ```(...).pipe(res)```

writable.js
```
var fs = require("fs");
var stream = fs.createWriteStream("./tmp.log");
stream.on('finish', function() {
    console.log("finish");
});
stream.write("line 1\n");
stream.write("line 2\n");
stream.write("line 3\n");
stream.end();
```

## readable streams

e.g. fs.createReadStream()

* ```file.pipe(...)```
* ```file.on("end", function() {})```
* ```file.on("data", function() {})```

Please note it's end, not finish this time.

readable.js
```
var fs = require("fs");
var stream = fs.createReadStream("./data.txt");

stream.pipe(process.stdout);

stream.on("end", function() {
    console.log("End");
});
```

readable.js
```
stream.on("data", function(chunk) {
    console.log("Read chunk: ", chunk.length);
});
```

### readable modes

* paused/pulling mode - default, with automatic backpressure
* flowing/pushing mode - no backpressure, data consumed as soon as chunks are available

Turn flowing mode with:
* stream.on('data', function(chunk) {})
* stream.resume()

Prefer pulling mode and pipe. Pushing mode is for historical reasons and has no backpressure.

## transform streams

Stream that is readable and writable. Methods and events from readable (e.g. this.push(buf)) and writable (e.g. write) are available.

## duplex streams

Every time you see: ```a.pipe(stream).pipe(a)``` it's a duplex stream. Both a and stream are duplex streams.

duplex.js
```
var net = require('net');
net.createServer(function(stream) {
    // echo server
    stream.pipe(stream);
}).listen(5000);
```

```nc localhost 5000```

proxy.js
```
var net = require("net");
net.createServer(function(stream) {
    stream.pipe(net.connect(5000, "localhost")).pipe(stream);
}).listen(5001);
```

```nc localhost 5001```


### exercise

Part 1:
* Create TCP server (net.createServer)
* read file tmp.log as a stream
* pipe it to TCP client
* test with nc

Part 2:
* when the readable stream emits end event add "\nDONE" to the TCP response (socket.end("\nDONE"))
* what error do you observe?

Part 3:
* readable.pipe(writable, {end: false}); prevents writable stream from ending when the readable stream ends

solution:
alive.js

## object streams

Typically we work with buffers and strings in streams. However there's also object mode.

object.js
```
var through = require("through2");
var size = 0;

process.stdin.pipe(through.obj(write)).pipe(through.obj(totalSize, end));

function write(chunk, encoding, next) {
    next(null, {length: chunk.length});
}

function totalSize(obj, encoding, next) {
    size += obj.length;
    next();
}

function end() {
    console.log("Total size is: ", size);
}
```

## http core streams

server side: req is readable, res is writable
```
http.createServer(function(req, res) {})
```

client side: req is writable, res is readable
```
var req = http.request(options, function(res) {});
```

http-server.js
```
var http = require("http");
var fs = require("fs");

var server = http.createServer(function(req, res) {
   if(req.method === "POST") {
       req.pipe(process.stdout);
       req.on("end", function() {
           res.end("ok\n");
       });
   } else {
       res.setHeader("content-type", "text/plain");
       fs.createReadStream("./tmp.log").pipe(res);
   }
});
server.listen(3000);
```

http-client.js
```
var http = require("http");
var post = http.request({
    method: "POST",
    host: "localhost",
    port: 3000,
    url: "/"
}, function (res) {
    console.log(res.statusCode);
    res.pipe(process.stdout);
});
post.end("client data\n");

var get = http.request({
    method: "GET",
    host: "localhost",
    port: 3000,
    url: "/"
}, function (res) {
    console.log(res.statusCode);
    res.pipe(process.stdout);
});
get.end();
```

## zlib core streams

gzip.js
```
var fs = require("fs");
var zlib = require("zlib");


fs.createReadStream("./tmp.log").pipe(zlib.createGzip()).pipe(fs.createWriteStream("./tmp.log.gz"));
```

gunzip.js
```
var fs = require("fs");
var zlib = require("zlib");


fs.createReadStream("./tmp.log.gz").pipe(zlib.createGunzip()).pipe(fs.createWriteStream("./tmp.log.1"));
```

## exercise

HTTP client should read books.import.txt, gzip it, send a POST request
to the server and print response to stdout.

HTTP server should gunzip request, split it on new lines, filter out only books
with javascript in the title
and return a newline delimited JSON of objects with title property.

Expected output:
```
{"title":"Secrets of the JavaScript Ninja"}
{"title":"Third-Party JavaScript "}
{"title":"Building Well-Structured JavaScript Applications"}
{"title":"Secrets of the JavaScript Ninja pBook upgrade"}
{"title":"JavaScript Application Design"}
```

Hints:
* use those modules: http, fs, zlib, split2, through2 (in object mode)
* how to separate read and write: next() and this.push()

## error handling

```
var pump = require("pump");

pump(stream1, stream2, stream3, onError)
```


