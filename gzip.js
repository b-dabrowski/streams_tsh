const fs = require("fs");
const zlib = require("zlib");

// fs.createReadStream("./tmp.log")
//     .pipe(zlib.createGzip())
//     .pipe(fs.createWriteStream("./tmp.log.gz"));

fs.createReadStream("./tmp.log.gz")
    .pipe(zlib.createGunzip())
    .pipe(fs.createWriteStream("./tmp.log.1"));