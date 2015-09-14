var fs = require("fs");

var emoji = require("./emoji");

var input = fs.readFileSync(process.argv[2]);

console.log(input);

console.log("PARSING");
var ir = emoji.parser.parse(input.toString());

console.log(JSON.stringify(ir, null, 2));

var codegen = require("./codegen");

var compiled = codegen.traverse(ir);

var dest = process.argv[2] + ".js";
console.log("wrote output to " + dest);
fs.writeFileSync(dest, compiled);
