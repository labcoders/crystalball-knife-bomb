Crystalball Knife Bomb
======================

Crystalball Knife Bomb (CBKB) is the reference implementation of the Functional
Emoji Programming Language (FEPL). 

FEPL is a complete functional programming language. Specifically, it is an
untyped ML-like language. It has a small feature set but is still very
expressive. CBKB adds some extra features on top of the core FEPL language.

Features
========

The core FEPL features are the following.

* Pattern matching
* Functions defined by equations
* Ad hoc algebraic datatypes
* Simple module system

CBKB adds the following additional feature.

* Two-way FFI with JavaScript

Language overview
=================

The syntax of the language is very simple. We will give a short overview here,
but we invite you to read through the official grammar used to build the
parser. It's only about 200 lines.

In this overview, we will use a grammar pseudocode. Names in *bold* refer to
reserved words in FEPL, and names in _italics_ refer to programmer inputs.

A module is a sequence of statements followed by a sequence of declarations.

A statement is either an import statement (FEPL modules) or an include
statement (CBKB JavaScript FFI).

* *import* _name_ imports the module _name_ into the current module. All
  declarations made within _name_ are now available in the current module.
* *include* _path_ requires the given javascript file within the current
  module. Specifically, a line of the form `var p = require(path)` is emitted,
  where `p` is the final component of _path_, i.e. the file name.
  This type of statement is added by CBKB to allow for FFI with JavaScript.

A declaration is either an FFI declaration or a function declaration.

* *ffi* _ident_ _string_ makes the JavaScript function identified by _string_
  available as an FEPL function identified by _ident_. In CBKB this emits a
  wrapper function that marshals FEPL data to JavaScript and back.
  The marshalling rules are at this time not clear.
* *fn* _ident_ (*alt* _pattern_ (*sep* _pattern_)\* *bind* _expr_)+ defines a
  function called _ident_ with at least one equation.

An _expr_ is either a literal or a function application. A function application
is just a sequence of expressions.

FEPL has the following literals.

* _digit_+ *end_number* is an integer literal.
* *quote* _non-quote_+ *quote* is a string literal.
* *true*|*false* is a boolean literal.
* *lbracket* *rbracket* | *lbracket* _expr_ (*asep* _expr_)\* *rbracket* is
  a tuple.
* *package* _string_ _expr_? is an ad-hoc sum type with constructor _string_
  and optionally with wrapped value _expr_.
* *lambda* _pattern_ (*sep* _pattern_)\* *bind* _expr_ is a function literal or
  lambda function. Notice that lambda functions cannot perform case analysis in
  their definition.

Patterns are the basis for pattern matching, which is how choice is encoded in
FEPL. Patterns are very similar to literals.

* *wild* matches anything but does not create a binding to the matched
  expression's value.
* _ident_ matches anything and creates a binding of _ident_ to the matched
  value.
* _integer_ matches an equal integer.
* _string_ matches an equal string.
* _bool_ matches an equal boolean.
* *lbracket* *rbracket* | *lbracket* _pattern_ (*asep* _pattern_)\* *rbracket*
  matches a tuple of same length, and sub-patterns must match elements of the
  value.
* *package* _pattern_ _pattern_? matches an ad hoc sum type. If the second
  pattern is omitted, then only empty sum types are matched. If the second
  pattern is given as a wildcard, then both empty and non-empty sum types are
  matched.

Functions can only be matched by identifiers and wildcards.
