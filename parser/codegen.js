var fs = require('fs'); // To import/include external files
var sourceExtension = "em"; // Used in file paths
var compiledExtension = "js";

exports.traverse = function(ir) {
    console.log("BEGIN CODE GEN");
    return Program(ir);
}

var functionCount = 0;

function raise(e) {
    throw e;
}

function InconsistentSyntaxTree(msg) {
    return {
        name: "Inconsistent Syntax Tree",
        message: msg
    };
}

function Output() {
    this.o = "";

    this.emitRaw = function(s) {
        this.o = this.o + s;
    };

    this.emit = function(s) {
        this.o = this.o + s + '\n';
    };

    this.render = function() {
        return this.o;
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
    o.emit("  this.name = 'No such binding';");
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

    o.emit("      if(param instanceof Array)");
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
    o.emit("      if(!pat.literal.obj_pat.name.wildcard && pat.literal.obj_pat.name.str_lit !== param.name) throw new PatternMatchError();") ;
    o.emit("      return checkParam(pat.literal.obj_pat.pattern, param.value);");
    o.emit("    }");

    o.emit("  }");

    o.emit("  throw new PatternMatchError();");
    o.emit("}");

    // the resolver finds a function with a given name. If such a function
    // exists, it is returned. All such functions take one argument, which is
    // in fact an array.
    o.emit("function Resolver(locals) {");
    o.emit("  this.resolve = function(name) {");
    o.emit("    if(typeof locals[name] !== 'undefined') return locals[name];");
    o.emit("    if(typeof _equations[name] !== 'undefined')");
    o.emit("      return function(params) {");
    o.emit("        return dispatchEquation(name, params);");
    o.emit("      }");
    o.emit("    throw new NameError(name);");
    o.emit("  }"); // TODO implement module function checking !
    o.emit("}");

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
    return func.name.ident;
}

function Declaration(decl) {
    var o = new Output();

    if (decl.func) { // Function declaration
        o.emit("addEquation(\n'" + makeFunctionName(decl.func) + "',\n" +
                emitFunctionLiteral(decl.func) + "\n);");
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

/**
 * Emits a value, i.e. a function call. Sometimes these are calls to nullary
 * functions. When value is called, a Resolver named "resolve" is always in
 * scope to determine which function a name should refer to.
 */
function Value(value) {
    var o = new Output();

    // we have a sequence of elements a, b, c, d, ...
    // we need to render a'(b')(c')(d')(...
    // but actually no because we don't have currying support!
    // so we need to render a'([b', c', d', ...])
    // but actually no because a' will not necessarily be the name of the
    // function *in javascript*. We have to use the resolver on a'
    // so we have:
    //     var f = resolver.resolve(a');
    //     return f([b', c', d', ...]);

    console.log(typeof value);

    if(value instanceof Array) {
        if(value.length === 0)
            throw new InconsistentSyntaxTree("empty value production");

        var head = value[0];

        o.emit("(function() {");
        o.emit("var head = resolver.resolve(" + Value(head) + ");");
        o.emit("return head(["); // begin call to head

        o.emit( // render argument list
                value.slice(1).map(function(b) {
                    var b_ = Value(b);
                    return b_;
                }).join(',')
        );

        o.emit("]);"); // end call to head
        o.emit("})()");
    }
    else { // then the value is an identifier or a literal
        var a_ = null;
        if(typeof value.literal !== 'undefined') {
            a_ = Literal(value.literal);
        }
        else if(typeof value.variable !== 'undefined') {
            a_ = "resolver.resolve('" + value.variable.ident + "')([])";
        }
        else {
            throw new InconsistentSyntaxTree("unrecognized value node: " +
                    JSON.stringify(value));
        }
        o.emit(a_);
    }

    return o.render();
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
        o += emitFunctionLiteral(literal.func);
    } else
        console.error("literal type not matched");

    return o;
}

function emitFunctionLiteral(flit) {
    var o = new Output();

    o.emit("function(params) {");
    o.emit("  var pmatch = " + PatternMatch(flit.patterns) + ";");
    o.emit("  var locals = pmatch(params);");
    o.emit("  var resolver = new Resolver(locals);");
    o.emit("  return " + Value(flit.body) + ";");
    o.emit("}");

    return o.render();
}

/**
 * Emit a function definition to check a pattern match.
 * On failure, a PatternMatchError exception is thrown.
 * On success, an association list of strings to values is created,
 * representing a map from names to the matched values.
 */
function PatternMatch(patterns) {
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
