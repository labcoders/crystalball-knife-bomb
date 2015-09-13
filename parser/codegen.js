var fs = require('fs'); // To import/include external files
var sourceExtension = "em"; // Used in file paths
var compiledExtension = "js";

exports.traverse = function(ir) {
	return Program(ir);
}

function Program(program) {
	var o = "";
	program.forEach(function(decl) {
		if (decl.func) {
			o += "function " + decl.func.name.ident + "(";

			var first = true;
			decl.func.params.forEach(function(param) {
				if (first)
					first = false;
				else
					o += ", ";
				o += param.ident;
			});

			o += "){return " + Value(decl.func.body) + ";}";
		} else if (decl.include) {
			var filename = decl.include.source ? decl.include.source.ident + "." + sourceExtension : decl.include.compiled + "." + compiledExtension;

			fs.readFile(filename, 'utf8', function (err,data) {
				if (err)
					return console.error("File not found", err);
				else
					o += data; // Include the file into the source
			});
		} else if (decl.import) {
			var name = decl.import.source ? decl.import.source.ident : decl.import.compiled;
			o += 'var ' + name + ' = require("./' + name + '");'; // Require the file
		} else if (decl.ffi_decl) {
			o += "var " + decl.ffi_decl.name.ident + " = " + decl.ffi_decl.externalName + ";";
		} else
			console.error("declaration type not matched");
	});
	return o;
}

function Value(value) {
	var o = "";
	if (value.invocation) {
		o += Value(value.invocation);
	} else if (value.literal) {
		o += Literal(value.literal);
	} else
		console.error("value type not matched");

	return o;
}

function Literal(literal) {
	var o = "";

	if (literal.int) {
		o += literal.int; // Implicitly converts toString()
	} else if (literal.bool) {
		o += literal.bool ? "true" : "false";
	} else if (literal.str) {
		o += '"' + literal.str + '"';
	} else if (literal.tuple) {
		o += "[";
		var first=true;
		literal.tuple.forEach(function(value) { // For all array elements
			if (first)
				first = false;
			else
				o += ", ";
			o += Value(value);
		});
		o += "]";
	} else if (literal.obj) {
		o += '{name:"' + literal.obj.name + '", value: ' + literal.obj.value + '}';
	} else if (literal.func) {
		o += "function(";
		var first=true;
		literal.func.params.forEach(function(param) { // For all array elements
			if (first)
				first = false;
			else
				o += ", ";
			o += param.ident;
		});
		o += "){return " + Value(literal.func.body) + "}";
	} else
		console.error("literal type not matched");

	return o;
}