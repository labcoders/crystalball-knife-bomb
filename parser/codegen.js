var fs = require('fs'); // To import/include external files
var jsesc = require('jsesc');
var sourceExtension = "em"; // Used in file paths
var compiledExtension = "js";

var emojiLiterals = {};

emojiLiterals.FOUR_LEAF_CLOVER = "🍀";

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
    o.emit("  this.message = 'There is no binding in scope with name ' + name;");
    o.emit("}");

    // For a given invocation(params), returns the first alternative that matches
    o.emit("function findMatch(alts, params) {");
    o.emit("  for (int i=0; i<alts.length; i++) {");
    o.emit("    if (matchEquation(alts[i].patterns, params) != null)");
    o.emit("      return i;");
    o.emit("  }");
    o.emit("  return -1;");

    // Returns whether params match an equation's pattern list
    o.emit("function matchEquation(patterns, params) {")
    o.emit("  if(patterns.length != params.length) return null;");

    o.emit("  for (int i=0; i<patterns; i++) {");
    o.emit("    if (matchParam(patterns[i], params[i]) == null) return null;");

    o.emit("  return [];");
    o.emit("}");

    // Returns whether a single param matches a single pattern
    o.emit("function matchParam(pat, param) {");
    o.emit("  if(pat.wildcard) return [];");
    o.emit("  if(pat.variable) return [[pat.variable.ident, param]];");

    o.emit("  if(pat.literal) {");
    o.emit("    if(pat.literal.bool === param) return [];");
    o.emit("    if(pat.literal.int === param) return [];");
    o.emit("    if(pat.literal.str === param) return [];");

    o.emit("    if(typeof pat.literal.array_pat !== 'undefined') {");

    o.emit("      if(param instanceof Array) {");
    o.emit("        console.log('array type match failed');");
    o.emit("        return null;");
    o.emit("      }");

    o.emit("      if(param.length !== pat.literal.tuple.length) {");
    o.emit("        console.log('array length match failed');");
    o.emit("        return null;");
    o.emit("      }");

    o.emit("      var bindings = [];");
    o.emit("      for(var i = 0; i < pat.literal.tuple.length; i++)");
    o.emit("        bindings = bindings.concat(")
    o.emit("            matchParam(pat.literal.tuple[i], param[i]));");
    o.emit("      return bindings;");

    o.emit("    }");

    o.emit("    if(typeof pat.literal.obj_pat !== 'undefined') {");
    o.emit("      if(typeof param !== 'object') {");
    o.emit("        console.log('object type match failed');");
    o.emit("        return null;");
    o.emit("      }");
    o.emit("      if(!pat.literal.obj_pat.name.wildcard && ( pat.literal.obj_pat.name.str_lit !== param.name || param.value == null ) )");
    o.emit("        console.log('object pattern value match failed');");
    o.emit("        return null;");
    o.emit("      return matchParam(pat.literal.obj_pat.pattern, param.value);");
    o.emit("    }");

    o.emit("  }");

    o.emit("  console.log('unknown pattern failure');");
    o.emit("  return null;");
    o.emit("}");

    return o.render();
}

function Program(program) {
    var o = new Output();
    o.emit(Setup());

    program.statements.forEach(function(stmt) {
        o.emit(Declaration(stmt));
    });

    program.declarations.forEach(function(decl) {
        o.emit(Declaration(decl));
    });
    o.emit("dispatchEquation('" + emojiLiterals.FOUR_LEAF_CLOVER + "', []);");
    return o.render();
}

function makeFunctionName(func) {
    var i = functionCount;
    functionCount++;
    return func.name.ident;
}

function liftIdentifier(identifier) {
    var lifted = jsesc(identifier, {
      'quotes': 'single',
      'wrap': true
    });
    return lifted; // Bro, do you even?
}

//stackoverflow.com/questions/21647928/javascript-unicode-string-to-hex
function hexify(identifier) {
    var hex, i;
    var result = "";
    for (i=0; i<this.length; i++) {
        hex = this.charCodeAt(i).toString(16);
        result += ("000"+hex).slice(-4);
    }
    return result
}

function Statement(stmt) {
    var o = new Output();

    if (stmt.include) {
        var filename = stmt.include.source ? stmt.include.source.ident + "." + sourceExtension : stmt.include.compiled + "." + compiledExtension;

        var data = fs.readFileSync(filename, 'utf8');
        o.emit(data);
    } else if (stmt.import) {
        var name = stmt.import.source ? stmt.import.source.ident : stmt.import.compiled;
        o.emit('var ' + name + ' = require("./' + name + '");'); // Require the file
    } else {
        console.error("declaration type not matched: " + JSON.stringify(decl));
        throw new Error("unmatched declaration");
    }

    return o.render();
}

function Declaration(decl) {
    var o = new Output();

    if (decl.func) { // Function declaration
        console.log("declaring function " + decl.func.name.ident);
        o.emit(FunctionDeclaration(decl.func));
        o.emit("addEquation(\n'" + makeFunctionName(decl.func) + "',\n" +
                emitFunctionLiteral(decl.func) + "\n);");
    } else if (decl.ffi) {
        o.emit("var " + decl.ffi.name.ident + " = " + decl.ffi.externalName + ";");
    } else {
        console.error("declaration type not matched: " + JSON.stringify(decl));
        throw new Error("unmatched declaration");
    }

    return o.render();
}

function FunctionDeclaration(func) {
    var o = new Output();

    var outputAlts = func.alternatives.map(function(alt) { // Traverse values too
        alt.body = Expression(alt.body);
        return alt;
        //return {patterns:alt.patterns,body:Expression(alt.body)};
    }

    o.emit("function func_" + hexify(func.name) + "(params) {");
    o.emit("  var alternatives = " + JSON.stringify(func.alternatives) +";");
    o.emit("  var pmatch = findMatch(alternatives, params);");
    o.emit("  if (pmatch >= 0 && pmatch < alternatives.length)");
    o.emit("    return alternatives[pmatch].body();");
    o.emit("}");

    return o.render();
}

/**
 * Emits a value, i.e. a function call. Sometimes these are calls to nullary
 * functions. When value is called, a Resolver named "resolve" is always in
 * scope to determine which function a name should refer to.
 */
function Expression(value) {
    var o = new Output();

    console.log("Emitting value: " + JSON.stringify(value, null, 2));

    // we have a sequence of elements a, b, c, d, ...
    // we need to render a'(b')(c')(d')(...
    // but actually no because we don't have currying support!
    // so we need to render a'([b', c', d', ...])
    // but actually no because a' will not necessarily be the name of the
    // function *in javascript*. We have to use the resolver on a'
    // so we have:
    //     var f = resolver.resolve(a');
    //     return f([b', c', d', ...]);

    if(value instanceof Array) {
        if(value.length === 0)
            throw new InconsistentSyntaxTree("empty value production");

        var head = value[0];

        o.emit("(function() {");
        o.emit("var head = " + Expression(head) + ";");
        o.emit("return head(["); // begin call to head

        o.emit( // render argument list
                value.slice(1).map(function(b) {
                    var b_ = Expression(b);
                    return b_;
                }).join(',')
        );

        o.emit("]);"); // end call to head
        o.emit("})");
    }
    else { // then the value is an identifier or a literal
        o.emitRaw("(function() { return ");
        if(typeof value.literal !== 'undefined') {
            o.emitRaw(Literal(value.literal);
        }
        else if(typeof value.variable !== 'undefined') {
            o.emitRaw(hexify(value.variable.ident));
        }
        else {
            throw new InconsistentSyntaxTree("unrecognized value node: " +
                    JSON.stringify(value));
        }
        o.emit(";})");
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
            o += Expression(value);
        });
        o += "]";
    } else if (literal.obj) {
        o += '{ name:"' + literal.obj.name + '", ' +
            'value: ' + (literal.obj.value == null ?
                null : Expression(literal.obj.value)) + '}';
    } else if (literal.func) {
        o += emitFunctionLiteral(literal.func);
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
function PatternMatch(patterns) {
    console.log("creating a pattern matcher for " + patterns.length + " patterns");
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
