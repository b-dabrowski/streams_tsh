const fs = require("fs");
const Transform = require("stream").Transform;

const toUpperStream = new Transform({
    transform(buffer, encoding, next) {
        toUpper(buffer, encoding, next);
    }
});

fs.createReadStream("./data.txt").pipe(toUpperStream).pipe(process.stdout);

function toUpper(buffer, encoding, next) {
    next(null, buffer.toString().toUpperCase());
}