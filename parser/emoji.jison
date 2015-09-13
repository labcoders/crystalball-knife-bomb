/* description: An Emoji functional programming language. */

/* lexical grammar */
%lex
%options flex
%%

\s+                   /* skip whitespace */
[\u0030-\u0039]\u20E3 return 'DIGIT'; /* ASCII digit followed by a square */

"!"                   return 'END_NUMBER';

"\uD83D\uDC89"        return 'INCLUDE'; /* black phone, include library into generated source */
"\uD83C\uDF81"        return 'IMPORT' /* gift, reference to an external library */
"\u2623"              return 'EXTERN' /*radioactive symbol */
"\uD83C\uDFF4"        return 'FUNC'; /* waving black flag */

"\uD83D\uDCCF"        return 'SEP';
"\u2b01"              return 'BIND';
"\uD83C\uDF1C"        return "LPAREN";
"\uD83C\uDF1B"        return "RPAREN";
"\uD83D\uDC48"        return "RBRACKET";
"\uD83D\uDC49"        return "LBRACKET";
"\u261D"              return "ASEP";

"\uD83D\uDC4D"        return 'TRUE';
"\uD83D\uDC4E"        return 'FALSE';

((?!\uD83D\uDC89|\uD83C\uDF1C|\uD83C\uDF1B|\u261D|\uD83D\uDCCF|\u270C|\u2623|[\u0030-\u0039]\u20E3|\uD83C\uDFF4|\uD83C\uDF81|\<|\,|\!|\uD83C\uDCCF|\uD83C\uDF1C|\uD83C\uDF1B|\u261D|\uD83D\uDC48|\uD83D\uDC49|\uD83D\uDCE6|\uD83D\uDCC8|\uD83D\uDD73).)+ return 'IDENT';

\u270C[^\u270C]+\u270C return 'STR_LIT';

"\uD83D\uDCE6"        return 'PACKAGE';
"\uD83D\uDCC8"        return 'FUNCTION';

"\uD83D\uDD73"        return 'WILDCARD';

<<EOF>>               return 'EOF';
.                     return 'INVALID';

/lex

/* enable EBNF grammar syntax */
%ebnf

%start program

%% /* language grammar */

program : (decl)+ EOF { return $1; }
        ;

decl : func_decl -> { func: $1 }
     | import_decl -> { import: $1 }
     | include_decl -> { include: $1 }
     | ffi_decl -> { ffi_decl: $1 }
     ;

func_decl : func ident func_decl_patterns? bind value %{
    $$ = {
        name: $2,
        patterns: $3,
        body: $5
    };
}%        ;

func_decl_patterns : sep patterns -> $2
                   ;

patterns : pattern -> [$1]
         | pattern sep patterns -> [$1].concat($3)
         ;

ident : IDENT %{ 
    console.log($1);
    $$ = { ident: $1 }; 
}
      ;

func : FUNC %{
    console.log($1);
    $$ = $1;
}%   ;

import_decl : IMPORT ident -> { source: $2 } /* import an emoji source file */
            | IMPORT str_lit -> { compiled: $2 } /* import a JS file */
            ;

include_decl : INCLUDE ident -> { source: $2 } /* include an emoji source file */
             | INCLUDE str_lit -> { compiled: $2 } /* include a JS file */
             ;

ffi_decl : EXTERN ident str_lit -> { name: $2, externalName: $3 }
         ;

value : LPAREN value RPAREN -> $2
      | ident sep value -> [$1].concat($3)
      | ident -> [$1]
      | literal -> [$1]
      ;

literal : int_lit -> { int: $1 }
        | bool_lit -> { bool: $1 }
        | str_lit -> { str: $1 }
        | array_lit -> { tuple: $1 }
        | obj_lit -> { obj: $1 }
        | func_lit -> {func: $1 }
        ;

int_lit : DIGIT+ END_NUMBER -> Number($1.map(function(e) { return e[0] }).join(""))
        ;

bool_lit : TRUE -> true
         | FALSE -> false
         ;

str_lit : STR_LIT %{
    console.log($1);
    $$ = $1;
}%      ;

bind : BIND %{
    $$ = $1;
}%
     ;

array_lit : LBRACKET RBRACKET -> []
          | LBRACKET array_content RBRACKET -> $2
          ;

array_content : value -> [$1]
              | value ASEP array_content -> [$1].concat($3)
              ;

obj_lit : package str_lit value -> { name: $2, value: $3 }
        ;

func_lit : FUNCTION patterns BIND value -> {name: null, params: $2, body: $4}
         ;

pattern : wildcard -> { wildcard: true }
        | ident -> { variable: $1 }
        | lit_pat -> { literal: $1 }
        | lparen pattern rparen -> $2
        ;

lit_pat : bool_pat -> { bool: $1 }
        | int_pat -> { int: $1 }
        | str_pat -> { str: $1 }
        | array_pat -> { tuple: $1 }
        | obj_pat -> { obj: $1 }
        ;

bool_pat : bool_lit
         ;

int_pat : int_lit
        ;

str_pat : str_lit
        ;

array_pat : LBRACKET RBRACKET -> []
          | LBRACKET array_pat_contents RBRACKET -> $2
          ;

array_pat_contents : pattern -> [$1]
                   | pattern ASEP array_pat_contents -> [$1].concat($3)
                   ;

obj_pat : package str_lit pattern -> { name: { str_lit: $2 }, pattern: $3.pattern }
        | package wildcard pattern -> { name: { wildcard: true }, pattern: $3.pattern }
        ;

wildcard : WILDCARD %{
    console.log($1);
    $$ = $1;
}%       ; 

package : PACKAGE %{
    console.log($1);
    $$ = $1;
}%      ;

sep : SEP %{
    console.log($1);
    $$ = $1;
}%  ;

lparen : LPAREN %{
    console.log($1);
    $$ = $1;
}%     ;

rparen : RPAREN %{
    console.log($1);
    $$ = $1;
}%     ;
