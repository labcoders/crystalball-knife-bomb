var fs = require('fs'); // To import/include external files
var sourceExtension = "em"; // Used in file paths
var compiledExtension = "js";

exports.traverse = function(ir) {
    return Program(ir);
}

var functionCount = 0;

function raise(e) {
    throw e;
}

function Output() {
    this.o = "";

    this.emitRaw = function(s) {
        o = o + s;
    };

    this.emit = function(s) {
        o = o + s + '\n';
    };

    this.render = function() {
        return o;
    };
}

/**
 * Emits the global environment to be placed at the beginning of a module.
 */
function Setup() {
    var o = new Output();

    o.emit("function PatternMatchError() {");
    o.emit("  this.name = \"Pattern Match Failed\";");
    o.emit("  this.message = \"The given parameters did not match the function's \" +");
    o.emit("    \"pattern specification.\";");
    o.emit("}");

    o.emit("function NameError(name) {");
    o.emit("  this.name = 'No such binding';);
    o.emit("  this.message = 'There is no binding in scope with the name ' + name;");
    o.emit("}");

    o.emit("var _equations = {}");

    o.emit("var addEquation = function(name, eqn) {");
    o.emit("  if(typeof _equations[name] === 'undefined')");
    o.emit("    _equations[name] = [];");
    o.emit("  _equations[name].push(eqn);");
    o.emit("}");

    o.emit("var dispatchEquation = function(name, params, index) {");
    o.emit("  var i = typeof index === 'undefined' ? 0 : index;");

    // no such equation
    o.emit("  if(typeof _equations[name] === 'undefined')")
    o.emit("    throw new NameError(name);");

    // ran out of equations
    o.emit("  if(i >= _equations[name].length)")
    o.emit("    throw new PatternMatchError();");

    o.emit("  var f = _equations[name][i];");
    o.emit("  try {");
    o.emit("    return f(params);");
    o.emit("  }");
    o.emit("  catch(e) {");
    o.emit("    if(e instanceof PatternMatchError) {");
    o.emit("      return dispatchEquation(name, params, i + 1);");
    o.emit("    }");
    o.emit("    else throw e;");
    o.emit("  }");

    o.emit("}");

    o.emit("var checkParam = function(pat, param) {");
    o.emit("  if(pat.wildcard) return [];");
    o.emit("  if(pat.variable) return [[pat.variable.ident, param]];");

    o.emit("  if(pat.literal) {");
    o.emit("    if(pat.literal.bool === param) return [];");
    o.emit("    if(pat.literal.int === param) return [];");
    o.emit("    if(pat.literal.str === param) return [];");

    o.emit("    if(typeof pat.literal.array_pat !== 'undefined') {");

    o.emit("      if(typeof param !== 'array')");
    o.emit("        throw new PatternMatchError();");

    o.emit("      if(param.length !== pat.literal.tuple.length)")
    o.emit("        throw new PatternMatchError();");

    o.emit("      var bindings = [];");
    o.emit("      for(var i = 0; i < pat.literal.tuple.length; i++)");
    o.emit("        bindings = bindings.concat(")
    o.emit("            checkParam(pat.literal.tuple[i], param[i]));");
    o.emit("      return bindings;");

    o.emit("    }");

    o.emit("    if(typeof pat.literal.obj_pat !== 'undefined') {");
    o.emit("      if(typeof param !== 'object') throw new PatternMatchError();");
    o.emit("      if(!pat.literal.obj_pat.name.wildcard && pat.literal.obj_pat.name.str_lit !== param.tag) throw new PatternMatchError();") ;
    o.emit("      return checkParam(pat.literal.obj_pat.pattern, param.value);");
    o.emit("    }");

    o.emit("  }");

    o.emit("  throw new PatternMatchError();");
    o.emit("}");

    o.emit("function Resolver(locals) {");
    o.emit("  this.resolve = function(name, params) {");
    o.emit("    if(typeof locals[name] !== 'undefined') return locals[name];");
    // unfinished resolver

    return o.render();
}

function Program(program) {
    var o = new Output();
    o.emit(Setup());
    program.forEach(function(decl) {
        o.emit(Declaration(decl));
    });
    return o.render();
}

function makeFunctionName(func) {
    var i = functionCount;
    functionCount++;
    return func.name.ident + '_' + i;
}

function Declaration(decl) {
    var o = new Output();

    if (decl.func) { // Function declaration
        var functionName = makeFunctionName(decl.func);
        o.emit("var f = function(params) {");
        o.emit("  var pmatch = " + PatternMatch() + ";");
        o.emit("  var locals = pmatch(params);");
        o.emit("  var resolver = new Resolver(locals);");
        o.emit("  return " + Value(decl.func.body) + ";");
        o.emit("};");
    } else if (decl.include) {
        var filename = decl.include.source ? decl.include.source.ident + "." + sourceExtension : decl.include.compiled + "." + compiledExtension;

        var data = fs.readFileSync(filename, 'utf8');
        o.emit(data);

    } else if (decl.import) {
        var name = decl.import.source ? decl.import.source.ident : decl.import.compiled;
        o.emit('var ' + name + ' = require("./' + name + '");'); // Require the file
    } else if (decl.ffi_decl) {
        o.emit("var " + decl.ffi_decl.name.ident + " = " + decl.ffi_decl.externalName + ";");
    } else {
        console.error("declaration type not matched: " + JSON.stringify(decl));
        throw new Error("unmatched declaration");
    }

    return o.render();
}

function Value(value) {
    var o = new Output();

    if(value.length > 1) {
    }
    else {
        var v = value[0];
        if(typeof v.ident !== 'undefined') {
            o.emit(v.ident);
        }
        else {
        }
    }

    return o.render;
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

/**
 * Emit a function definition to check a pattern match.
 * On failure, a PatternMatchError exception is thrown.
 * On success, an association list of strings to values is created,
 * representing a map from names to the matched values.
 */
function PatternMatch(options) {
    var patterns = options.patterns ||
        raise(new Error("Invalid patternspec."));

    var o = new Output();

    o.emit("function (params) {");

    o.emit("  if(params.length !== " + patterns.length + ")");
    o.emit("    throw new PatternMatchError();");

    o.emit("  var bindings = [];");

    for(var i = 0; i < patterns.length; i++) {
        o.emit("  bindings = bindings.concat(checkParam(" +
                JSON.stringify(patterns[i]) + ", " +
                "params[" + i + "]));"
        );
    }

    o.emit("  return bindings;");
    o.emit("}");

    return o.render();
}
