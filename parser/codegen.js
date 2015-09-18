var jison = require('jison');
var fs = require('fs'); // To import/include external files

var grammar = fs.readFileSync('emoji.jison', 'utf8');
var parser = new jison.Parser(grammar);

var INDENT = '  ';

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

/**
 * The type of errors that result from an invalid syntax tree.
 *
 * For example, a syntax tree can be invalid if it contains nodes with
 * unexpected names
 */
function InconsistentSyntaxTree(msg) {
    this.message = msg;
    Error.captureStackTrace(this, this.constructor);
}

InconsistentSyntaxTree.prototype.__proto__ = Error.prototype;
InconsistentSyntaxTree.prototype.name = "InconsistentSyntaxTree";

/**
 * The type of general compilation errors that do not result from invalid
 * syntax trees.
 *
 * More specific object types should be used for more particular kinds of
 * failures, e.g. type errors or name errors.
 */
function CompilationError(msg) {
    this.message = msg
    Error.captureStackTrace(this, this.constructor);
}

CompilationError.prototype.__proto__ = Error.prototype;
CompilationError.prototype.name = "CompilationError";

function repeat(n, s) {
    var s_ = "";
    for(var i = 0; i < n; i++) {
        s_ += s;
    }
    return s;
}

/**
 * Unnecessarily fancy interface for concatenating strings.
 */
function Output(level) {
    this.level = typeof level === 'undefined' ? 0 : level;
    this.o = "";

    /**
     * Return a new Output object whose indentation level is greater than the
     * current one.
     *
     * Note: once the new Output object has been filled with data, it should be
     * embedded back within this object with the {@link embed} method.
     *
     * @param {int} [amount] -- If given, the amount by which the inner Output
     * should be indented by. The default value is one.
     */
    this.createInner = function(amount) {
        return new Output(this.level + 1);
    }

    /**
     * Embed another Output object within this one.
     */
    this.embed = function(inner) {
        this.emitRaw(inner.render());
    }

    /**
     * Simply appends each given argument in turn to the output.
     */
    this.emitRaw = function() {
        for(var i = 0; i < arguments.length; i++)
            this.o += arguments[i];
    };

    /**
     * Appends a new line to the output.
     * Specifically, INDENT is appended _level_ times, followed by the given
     * string, followed by a newline character.
     */
    this.emitLine = function(s) {
        this.emitIndented(s + '\n');
    };

    /**
     * Appends an indented string to the output.
     */
    this.emitIndented = function(s) {
        this.emitRaw(repeat(this.level, INDENT) + s);
    }

    /**
     * Emits a function declaration, correctly increasing the indentation level
     * of the body.
     *
     * @param {string} name -- The name of the function to emit. If falsy, the
     * emitted function is anonymous.
     * @param {array} argNames -- The names of the arguments to the function.
     * If falsy, the emitted function takes no arguments.
     * @param {array} bodyLines -- If an array, each element is emitted as a
     * correctly indented line as the body.
     * @param {int} [indentAmount] -- If given, overrides the default value of
     * 1 for the amount of indents to use for the function body.
     */
    this.emitFunction = function(name, argNames, bodyLines, indentAmount) {
        var indentAmount = typeof indentAmount === 'undefined' ? 1 : indentAmount;
        var args = argNames ?
        var argString = argNames ? argNames.join(', ') : '';
        this.emitLine(
            'function ' + (name ? name : '') + '(' + argString + ') {'
        );
        var body = new Output(this.level + indentAmount);
        bodyLines.forEach(function(line) {
            body.emitLine(line);
        });
        this.emitRaw(body.render());
        this.emitLine('}');
    }

    /**
     * Emits a single variable declaration.
     */
    this.emitVar(name, value) {
        this.emitLine('var ' + name + ' = ' + value + ';');
    }

    /**
     * Emits multiple variable declarations sequentially.
     *
     * This function accepts arbitrarily many arguments. Each argument must be
     * an array of two elements: the first is the name of the variable, the
     * second is the value.
     */
    this.emitVars() {
        this.emitIndented('var ' + arguments[0][0] + ' = ' + arguments[0][1]);
        for(var i = 1; i < arguments.length; i++) {
            this.emitRaw(','); // append comma to previous declaration
            this.emitIndented('    ' + arguments[i][0] + ' = ' + arguments[i][1]);
        }
        this.emitRaw(';'); // terminate declaration
    }

    /**
     * A synonym for {@link emitLine}.
     */
    this.emit = this.emitLine;

    /**
     * Return the output as a string.
     */
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
    o.emit("  for (var i=0; i<alts.length; i++) {");
    o.emit("    console.log('matching params ' + JSON.stringify(params) + ' to pattern ' + JSON.stringify(alts[i]));");
    o.emit("    var bindings = matchEquation(alts[i], params);");
    o.emit("    if(bindings != null) {");
    o.emit("      console.log('matched equation ' + i);");
    o.emit("      return { index: i, bindings: bindings };");
    o.emit("    }");
    o.emit("  }");
    o.emit("  return null;");
    o.emit("}");

    // Returns whether params match an equation's pattern list
    o.emit("function matchEquation(patterns, params) {")
    o.emit("  if(patterns.length != params.length) return null;");

    o.emit("  var bindings = [];");

    o.emit("  for (var i=0; i<patterns.length; i++) {");
    o.emit("    console.log('matching param ' + JSON.stringify(params[i]) + ' to pattern ' + JSON.stringify(patterns[i]));");
    o.emit("    var m = matchParam(patterns[i], params[i]);");
    o.emit("    if (m == null) return null;");
    o.emit("    bindings = bindings.concat(m);");
    o.emit("  }");

    o.emit("  return bindings;");
    o.emit("}");

    // Checks whether a given pattern matchs a value.
    o.emit("function matchParam(pat, param) {");
    o.emit("  console.log('matching param');");

    o.emit("  if(pat.wildcard) {");
    o.emit("    console.log('matched wildcard');");
    o.emit("    return [];");
    o.emit("  }");

    o.emit("  if(pat.variable) {");
    o.emit("    console.log('matched variable');");
    o.emit("    return [[pat.variable.ident, param]];");
    o.emit("  }");

    o.emit("  if(pat.literal) {");
    o.emit("    console.log('matching literal');");

    o.emit("    if(pat.literal.bool === param) {");
    o.emit("      console.log('matched bool');");
    o.emit("      return [];");
    o.emit("    }");

    o.emit("    if(pat.literal.int === param) {");
    o.emit("      console.log('matched int');");
    o.emit("      return [];");
    o.emit("    }");

    o.emit("    if(pat.literal.str === param) {");
    o.emit("      console.log('matched str');");
    o.emit("      return [];");
    o.emit("    }");

    o.emit("    if(typeof pat.literal.array !== 'undefined') {");

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

    o.emit("      console.log('matched array');");
    o.emit("      return bindings;");

    o.emit("    }");

    o.emit("    if(typeof pat.literal.obj !== 'undefined') {");
    o.emit("      if(typeof param !== 'object') {");
    o.emit("        console.log('object type match failed');");
    o.emit("        return null;");
    o.emit("      }");
    o.emit("      if(!pat.literal.obj.name.wildcard && ( pat.literal.obj.name.str_lit !== param.name || param.value == null ) ) {");
    o.emit("        console.log('object pattern value match failed');");
    o.emit("        return null;");
    o.emit("      }");
    o.emit("      console.log('matched object head');");
    o.emit("      return matchParam(pat.literal.obj.pattern, param.value);");
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

    var ir = preprocess(program);

    o.emit(ir.include);

    program.declarations.forEach(function(decl) {
        o.emit(Declaration(decl));
    });

    o.emit("console.log(" + hexify(emojiLiterals.FOUR_LEAF_CLOVER) + "([]));");

    return o.render();
}

/**
 * Produces a list of all declarations in a program prepended to the list of
 * all imported declarations as well as a string which is the concatenation of
 * all transitively textually included files.
 */
function preprocess(program) {
    var decls = [];
    var include = "";

    program.statements.forEach(function(stmt) {
        if(stmt.import) {
            var filename = stmt.import;
            var text = fs.readFileSync(filename, 'utf8');
            var program_ = parser.parse(text);

            var rec = preprocess(program_)
            include = include + rec.include;
            rec.decls.forEach(function(decl) {
                decls.push(decl);
            });
        }
        else if(stmt.include) {
            var filename = stmt.include;
            var text = fs.readFileSync(filename, 'utf8');
            include = include + '\n' + text;
        }
        else
            throw new InconsistentSyntaxTree(
                "unknown statement type: " + JSON.stringify(stmt)
            );
    });

    return { decls: decls.concat(program.declarations), include: include };
}

function makeFunctionName(func) {
    var i = functionCount;
    functionCount++;
    return func.name.ident;
}

//stackoverflow.com/questions/21647928/javascript-unicode-string-to-hex
function hexify(identifier) {
    var hex, i;
    var result = "$";
    for (i=0; i<identifier.length; i++) {
        hex = identifier.charCodeAt(i).toString(16);
        result += ("000"+hex).slice(-4);
    }
    if(result.length === 1) {
        console.trace();
        throw new CompilationError(
            "failed to hexify identifier `" + identifier + "`."
        );
    }
    result = result + ' /*' + identifier + '*/';
    return result
}

function Statement(stmt) {
    var o = new Output();

    if (stmt.include) {

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
    } else if (decl.ffi) {
        o.emit("function " + hexify(decl.ffi.name.ident) + "(params) {");
        o.emit("  return " + decl.ffi.externalName + ".apply(this, params);");
        o.emit("};");
    } else {
        console.error("declaration type not matched: " + JSON.stringify(decl));
        throw new Error("unmatched declaration");
    }

    return o.render();
}

function FunctionDeclaration(func) {
    var name = func.name.ident;
    var o = new Output();

    console.log('emitting function ' + name);

    o.emit("function " + hexify(name) + "(params) {");

    o.emit("console.log('invoking function " + name + ".');");

    var equations = func.alternatives.map(
        function(alt) {
            var bs = determineBindings(alt.patterns);
            return "function (" +
                bs.map(hexify).join(', ') +
                ") {" +
                "return " + Expression(alt.body) +
                "}";
        }
    ).join(',');

    // Render each function body into an array
    var fns = "var functions = [" + equations + '];';

    //console.log("functions: " + fns);
    o.emit(fns);

    var alternatives = JSON.stringify(func.alternatives.map(function(alt) {
        return alt.patterns;
    }));

    o.emit("  var alternatives = " + alternatives +";");
    o.emit("  var pmatch = findMatch(alternatives, params);");
    o.emit("  if(pmatch != null)");
    o.emit("    return functions[pmatch.index].apply(this, pmatch.bindings);");
    o.emit("  else");
    o.emit("    throw new PatternMatchError();");
    o.emit("}");

    return o.render();
}

/**
 * From a list of patterns, determine the sequence of bindings that it should
 * generate.
 * The result is a list of identifiers, which must be hexified before being
 * emitted.
 */
function determineBindings(patterns, depth) {
    var d = typeof depth === 'undefined' ? 0 : depth;
    console.log('determineBindings ' + d + ': ' + JSON.stringify(patterns));
    if(patterns.length !== 0) {
        var p = patterns[0];
        if(p.variable) {
            var v = p.variable.ident;
            console.log('determineBindings ' + d + ': found variable ' + v);
            return [v].concat(
                determineBindings(patterns.slice(1), d + 1)
            );
        }
        else if(p.literal) {
            console.log('determineBindings ' + d + ': found literal');
            var l = p.literal;
            if(l.tuple)
                return determineBindings(l.tuple, d + 1);
            else if(l.obj) {
                var o = l.obj;
                if(typeof o.pattern !== 'undefined')
                    return determineBindings([o.pattern], d + 1);
            }
        }
    }
    else return [];

    console.log('determineBindings ' + d + ': no bindings');

    return determineBindings(patterns.slice(1)); // no bindings
}

/**
 * Emits a value, i.e. a function call. Sometimes these are calls to nullary
 * functions. When value is called, a Resolver named "resolve" is always in
 * scope to determine which function a name should refer to.
 */
function Expression(value) {
    var o = new Output();

    if(value instanceof Array) {
        if(value.length === 0)
            throw new InconsistentSyntaxTree("empty value production");
        else if(value.length === 1)
            return Expression(value[0])

        var head = value[0];

        o.emit("(" + Expression(head) + ")([" + 
               value.slice(1).map(function(b) {
                   var b_ = Expression(b);
                   return b_;
               }).join(', ') +
                   "])"
        );
    }
    else { // then the value is an identifier or a literal
        if(typeof value.literal !== 'undefined') {
            o.emitRaw(Literal(value.literal));
        }
        else if(typeof value.variable !== 'undefined') {
            o.emitRaw(hexify(value.variable.ident));
        }
        else {
            throw new InconsistentSyntaxTree("unrecognized value node: " +
                    JSON.stringify(value));
        }
    }

    return o.render();
}

function Literal(literal) {
    var o = "";

    if (typeof literal.int !== 'undefined') {
        o += literal.int; // Implicitly converts toString()
    } else if (typeof literal.str !== 'undefined') {
        o += '"' + literal.str + '"';
    } else if (typeof literal.tuple !== 'undefined') {
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
    } else if (typeof literal.obj !== 'undefined') {
        o += '{ name:"' + literal.obj.name + '", ' +
            'value: ' + (literal.obj.value == null ?
                null : Expression(literal.obj.value)) + '}';
    } else if (typeof literal.func !== 'undefined') {
        o += emitFunctionLiteral(literal.func);
    } else {
        throw new InconsistentSyntaxTree(
            "unknown literal type " + JSON.stringify(literal)
        );
    }

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
