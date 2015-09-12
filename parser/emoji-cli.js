var fs = require("fs");

var emoji = require("./emoji");

var input = fs.readFileSync(process.argv[2]);

console.log(input);

console.log("PARSING");
var ir = emoji.parser.parse(input.toString());

console.log(ir);
console.log(JSON.stringify(ir));
