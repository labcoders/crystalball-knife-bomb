var process = require("process");
var fs = require("fs");

var emoji = require("emoji");

var input = fs.readFileSync(process.argv[1]);

var ir = emoji.parse(input);

console.log(JSON.stringify(ir));
