# Node.js Streams

Unix inspired way to move data from some input to some output.


Unix inspired - connect small programs with pipes

Unix: a | b | c | d

Node.js: a.pipe(b).pipe(c).pipe(d)

## why we need streams?


Because sometimes things don't fit into memory and need to be processed chunk by chunk.

## stream types

* readable - produces data (e.g. fs.createReadStream())
* writable - consumes data (e.g. HTTP response on the server)
* transform - consumes and produces data (e.g. through2)

* readable: `readable.pipe(A)`
* writable: `A.pipe(writable)`
* transform: `A.pipe(transform).pipe(B)`

## writable streams

e.g. HTTP response

* ```res.write(buf)```
* ```res.end()```
* ```res.end(buf)``` - shorthand
* ```res.on('finish', function() {})```
* ```(...).pipe(res)```


## readable streams

e.g. fs.createReadStream()

* ```file.pipe(...)```
* ```file.on("end", function() {})```
* ```file.on("data", function() {})```