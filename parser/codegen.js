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
    return s_;
}

/**
 * Unnecessarily fancy interface for concatenating strings.
 */
function Output(indentLevel, parent) {
    this.level = typeof indentLevel === 'undefined' ? 0 : indentLevel;
    this.o = "";
    this.parent = typeof parent === 'undefined' ? null : parent;

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
        var indent = typeof amount === 'undefined' ? 1 : amount;
        console.log('nesting to indent ' + (this.level + indent));
        return new Output(this.level + indent, this);
    }

    this.pop = function() {
        return this.parent.embed(this);
    }

    /**
     * Embed another Output object within this one.
     */
    this.embed = function(inner) {
        return this.emitRaw(inner.render());;
    }

    /**
     * Simply appends each given argument in turn to the output.
     */
    this.emitRaw = function() {
        for(var i = 0; i < arguments.length; i++) {
            process.stdout.write(arguments[i]);
            this.o += arguments[i];
        }
        return this;
    };

    /**
     * Appends an indented string to the output.
     */
    this.emitIndented = function(s) {
        return this.emitRaw(repeat(this.level, INDENT) + s);
    }

    /**
     * Appends a new line to the output.
     * Specifically, INDENT is appended _level_ times, followed by the given
     * string, followed by a newline character.
     */
    this.emitLine = function(s) {
        return this.emitIndented(s + '\n');
    };

    /**
     * Appends a statement as a line to the output.
     * Specifically, a semicolon is inserted prior to the newline.
     */
    this.emitStmt = function(s) {
        return this.emitLine(s + ';');
    }

    /**
     * Emits a return statement of a given expression.
     */
    this.emitReturn = function(s) {
        return this.emitStmt('return ' + s);
    }

    this.pushFor = function(stmts) {
        this.emitLine('for(' + stmts.join(';') + ') {');

        var p = this.createInner();
        p.pop = function() {
            var r = this.parent.embed(p).emitLine('}');
            console.error('pop to ' + p.level + ' -> ' + this.parent.level);
            return r;
        };
        return p;
    }

    this.pushIf = function(cond) {
        this.emitLine('if(' + cond + ') {');

        var p = this.createInner();
        p.pop = function() {
            var r = this.parent.embed(p).emitLine('}');
            console.error('pop to ' + p.level + ' -> ' + this.parent.level);
            return r;
        };
        return p;
    }

    this.pushFunction = function(name, argNames, indentAmount) {
        var indentAmount = typeof indentAmount === 'undefined' ? 1 : indentAmount;
        var argString = argNames ? argNames.join(', ') : '';
        this.emitLine(
            'function ' + (name ? name : '') + '(' + argString + ') {'
        );

        var p = this.createInner();
        p.pop = function() {
            var r = this.parent.embed(p).emitLine('}');
            console.error('pop to ' + p.level + ' -> ' + this.parent.level);
            return r;
        };

        return p;
    }

    /**
     * Return an inner Output object augmented with a pop method allowing to
     * return to the current Output object. When the inner Output object is
     * popped, it is embedded in its parent.
     */
    this.push = function(amount) {
        var p = this.createInner();
        p.pop = function() {
            var r = this.parent.embed(p);
            console.error('pop to ' + p.level + ' -> ' + this.parent.level);
            return r;
        };
        return p;
    }

    /**
     * Emits a single variable declaration.
     */
    this.emitVar = function(name, value) {
        return this.emitLine('var ' + name + ' = ' + value + ';');
    }

    /**
     * Emits multiple variable declarations sequentially.
     *
     * This function accepts arbitrarily many arguments. Each argument must be
     * an array of two elements: the first is the name of the variable, the
     * second is the value.
     */
    this.emitVars = function() {
        this.emitIndented('var ' + arguments[0][0] + ' = ' + arguments[0][1]);
        for(var i = 1; i < arguments.length; i++) {
            this.emitRaw(','); // append comma to previous declaration
            this.emitIndented('    ' + arguments[i][0] + ' = ' + arguments[i][1]);
        }
        this.emitRaw(';'); // terminate declaration
        return this;
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

/**
 * From a list of patterns, determine the sequence of bindings that it should
 * generate.
 * The result is a list of identifiers, which must be hexified before being
 * emitted.
 */
function determineBindings(patterns, depth) {
    var d = typeof depth === 'undefined' ? 0 : depth;
    //console.log('determineBindings ' + d + ': ' + JSON.stringify(patterns));
    if(patterns.length !== 0) {
        var p = patterns[0];
        if(p.variable) {
            var v = p.variable.ident;
            //console.log('determineBindings ' + d + ': found variable ' + v);
            return [v].concat(
                determineBindings(patterns.slice(1), d + 1)
            );
        }
        else if(p.literal) {
            //console.log('determineBindings ' + d + ': found literal');
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

    //console.log('determineBindings ' + d + ': no bindings');

    return determineBindings(patterns.slice(1)); // no bindings
}

/**
 * Emits the global environment to be placed at the beginning of a module.
 */
function Setup() {
    return new Output()

    .pushFunction('PatternMatchError', [ 'msg' ])
        .emitStmt('this.message = msg')
        .emitStmt('Error.captureStackTrace(this, this.constructor)')
    .pop()

    .emitStmt('PatternMatchError.prototype.__proto__ = error.prototype')
    .emitStmt('PatternMatchError.prototype.name = "PatternMatchError"')

    .pushFunction('findMatch', ['alts', 'params'])
        .pushFor(['var i = 0', 'i < alts.length', 'i++'])
            //.emitstmt([
            //    'console.log("match> matching params " + json.stringify(params)',
            //    '+ " to pattern " + json.stringify(alts[i]))'
            //].join(''))
            //.emitstmt('console.log("equation> " + i)')
            .emitVar('bindings', 'matchEquation(alts[i], params)')
            .pushIf('bindings != null')
                //.emitstmt('console.log("match> matched equation " + i)')
                .emitReturn('{ index: i, bindings: bindings }')
            .pop()
        .pop()
        .emitReturn('null')
    .pop()


    .pushFunction('matchEquation', ['patterns', 'params'])
        .pushIf('patterns.length != params.length')
            .emitReturn('null')
        .pop()
        .emitVar('bindings', '[]')
        .pushFor(['var i = 0', 'i < patterns.length', 'i++'])
            .emitVar('m', 'matchParam(patterns[i], params[i])')
            .pushIf('m == null').emitReturn('null').pop()
            .emitStmt('bindings = bindings.concat(m)')
        .pop()
        .emitReturn('bindings')
    .pop()

    // // returns whether params match an equation's pattern list
    // o.emit("function matchequation(patterns, params) {")
    // o.emit("  if(patterns.length != params.length) return null;");

    // o.emit("  var bindings = [];");

    // o.emit("  for (var i=0; i<patterns.length; i++) {");
    // o.emit("    var m = matchparam(patterns[i], params[i]);");
    // o.emit("    if (m == null) return null;");
    // o.emit("    bindings = bindings.concat(m);");
    // o.emit("  }");

    // o.emit("  return bindings;");
    // o.emit("}");

    .pushFunction('matchparam', ['pat', 'param'])
        .pushIf('pat.wildcard')
            .emitReturn('[]')
        .pop()
        .pushIf('pat.variable')
            .emitReturn('[[pat.variable.ident, param]]')
        .pop()
        .pushIf('pat.literal')
            .pushIf('pat.literal.int === param')
                .emitReturn('[]')
            .pop()
            .pushIf('pat.literal.str === param')
                .emitReturn('[]')
            .pop()
            .pushIf('pat.literal.tuple !== "undefined"')
                .pushIf('!param instanceof array')
                    .emitReturn('null')
                .pop()
                .pushIf('param.length !== pat.literal.tuple.length')
                    .emitReturn('null')
                .pop()
                .emitVar('bindings', '[]')
                .pushFor(['var i = 0', 'i < param.length', 'i++'])
                    .emitStmt(
                        [
                            'bindings = bindings.concat(',
                            '  matchParam(pat.literal.tuple[i], param[i])',
                            ')'
                        ].join('')
                    )
                .pop()
                .emitReturn('bindings')
            .pop()
            .pushIf('typeof pat.literal.obj !== "undefined"')
                .emitVar('objpat', 'pat.literal.obj')
                .pushIf('typeof param !== "object"')
                    .emitReturn('null')
                .pop()
                .pushIf(
                    [
                        '!objpat.name.wildcard && objpat.name.str_lit',
                        '!=',
                        'param.name'
                    ].join(' ')
                )
                    .emitReturn('null')
                .pop()
                .pushIf('!objpat.pattern.wildcard && param.value == null')
                    .pop('null')
                .pop()
                .emitReturn('matchParam(pat.literal.obj.pattern, param.value)')
            .pop()
        .pop()
        .emitReturn('null')
    .pop()
    .render()
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

function Declaration(decl) {
    var o = new Output();

    if (decl.func) { // Function declaration
        o.emit(FunctionDeclaration(decl.func));
    } else if (decl.ffi) {
        o.pushFunction(hexify(decl.ffi.name.ident), ['params'])
            .emitReturn(decl.ffi.externalName + ".apply(this, params)")
        .pop();
    } else {
        console.error("declaration type not matched: " + JSON.stringify(decl));
        throw new CompilationError("unmatched declaration");
    }

    return o.render();
}

function FunctionDeclaration(func) {
    var name = func.name.ident;
    var o = new Output();

    o.emit("function " + hexify(name) + "(params) {");

    //o.emit("console.log('invoking function " + name + ".');");

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
    o.emit("  if(pmatch != null) {");
    o.emit("    var args = pmatch.bindings.map(function(b) { return b[1]; });");
    o.emit("    return functions[pmatch.index].apply(this, args);");
    o.emit("  }");
    o.emit("  else");
    o.emit("    throw new PatternMatchError();");
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

    if(value instanceof Array) {
        if(value.length === 0)
            throw new InconsistentSyntaxTree("empty value production");
        else if(value.length === 1)
            return Expression(value[0])

        var head = value[0];

        var e = Expression(head);

        o.emit("(function() {");
        //o.emit("  console.log('invoking function " + e + ".');");
        o.emit("  var r = (" + e + ")([" +
               value.slice(1).map(function(b) {
                   return Expression(b);
               }).join(', ') +
                   "])"
        );
        //o.emit("  console.log('result ' + JSON.stringify(r) + '.');");
        o.emit("  return r;");
        o.emit("})()");
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
