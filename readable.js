var fs = require("fs");
var stream = fs.createReadStream("./data.txt");

stream.pipe(process.stdout);

stream.on("end", function() {
    console.log("End");
});