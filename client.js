var http = require("http");
var fs = require("fs");
var zlib = require("zlib");

var post = http.request({
    method: "POST",
    host: "localhost",
    port: 3000,
    url: "/"
}, function (res) {
    res.pipe(process.stdout);
});

fs.createReadStream("./books.import.txt")
    .pipe(zlib.createGzip())
    .pipe(post);