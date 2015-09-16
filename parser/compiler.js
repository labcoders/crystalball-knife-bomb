var jison = require('jison');
var fs = require('fs');
var codegen = require('./codegen');

var grammar = fs.readFileSync('emoji.jison');
var parser = new jison.Parser(grammar.toString());

var input = fs.readFileSync(process.argv[2]);
var ast = parser.parse(input.toString());

var output = codegen.traverse(ast);

var dest = null;
if(typeof process.argv[3] === 'undefined')
    dest = process.argv[2] + '.js';
else
    dest = process.argv[3];

fs.writeFileSync(dest, output);

