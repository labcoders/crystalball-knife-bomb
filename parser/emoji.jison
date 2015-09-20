/* description: An Emoji functional programming language. */

/* lexical grammar */
%lex
%options flex
%%

\s+                   /* skip whitespace */
[\u0030-\u0039]\u20E3 return 'DIGIT'; /* ASCII digit followed by a square */

"!"                   return 'END_NUMBER';

"\uD83D\uDC89"        return 'INCLUDE'; /* syringe */
"\uD83C\uDF81"        return 'IMPORT' /* gift, reference to an external library */
"\u26A0"              return 'EXTERN' /*warning symbol */
"\uD83C\uDFF4"        return 'FUNC'; /* waving black flag */
"\u21AA\uFE0F"        return 'ALT'; /* right hook arrow */

"\uD83D\uDCCF"        return 'SEP'; /* straight_ruler */
"\u2196"              return 'BIND'; /* arrow_upper_left */
"\uD83C\uDF1C"        return "LPAREN";
"\uD83C\uDF1B"        return "RPAREN";
"\uD83D\uDC49"        return "LBRACKET";
"\uD83D\uDC48"        return "RBRACKET";
"\u261D"              return "ASEP";

"\uD83D\uDC4D"        return 'TRUE';
"\uD83D\uDC4E"        return 'FALSE';

((?!\uD83D\uDC89|\uD83D\uDC4D|\uD83C\uDF1C|\uD83D\uDCCF|\u270C|\u26A0|[\u0030-\u0039]\u20E3|\uD83C\uDFF4|\uD83C\uDF81|\<|\,|\!|\uD83C\uDCCF|\uD83C\uDF1B|\u261D|\uD83D\uDC48|\uD83D\uDC49|\uD83D\uDCE6|\uD83D\uDCC8|\u2744|\u2196|\u21AA\uFE0F).)+ { return 'IDENT'};

\u270C[^\u270C]+\u270C return 'STR_LIT';

"\uD83D\uDCE6"        return 'PACKAGE'; /* :package: */
"\uD83D\uDCC8"        return 'FUNCTION'; /* chart_with_upwards_trend */

"\u2744"              return 'WILDCARD'; /* snowflake */

<<EOF>>               return 'EOF';
.                     return 'INVALID';

/lex

/* enable EBNF grammar syntax */
%ebnf

%start program

%% /* language grammar */

program : (stmt)* (decl)+ EOF %{
    var stmts = typeof $1 === 'undefined' ? [] : $1;
    return {statements: stmts, declarations: $2};
    }%
        ;

stmt : import_stmt -> { import: $1 }
     | include_stmt -> { include: $1 }
     ;

decl : ffi_decl -> { ffi: $1 }
     | func_decl -> { func: $1 }
     ;

func_decl : func ident alt+ -> {name: $2, alternatives: $3}
          ;

alt : alt_tok lambda %{
    console.log($lambda);
    $$ = $2;
}%  ;

lambda : patterns? bind expr %{
    var pats = typeof $1 === 'undefined' ? [] : $1;
    console.log("> pattern match with " + pats.length + " arguments");
    $$ = {
        patterns: pats,
        body: $3
    };
}%        ;

patterns : pattern -> [$1]
         | pattern sep patterns -> [$1].concat($3)
         ;

ident : IDENT %{ 
    console.log("ident: " + $1);
    $$ = { ident: $1 }; 
}
      ;

func : FUNC %{
    console.log("func");
    $$ = $1;
}%   ;

import_stmt : IMPORT ident -> $2 /* import an emoji source file */
            ;

include_stmt : INCLUDE str_lit -> $2 /* include a JS file */
             ;

ffi_decl : EXTERN ident str_lit -> { name: $2, externalName: $3 }
         ;

expr : lparen expr rparen expr? %{
    $$ = typeof $4 === 'undefined' ? [$2] : [$2].concat($4);
}%
     | ident sep expr -> [{variable: $1}].concat($3)
     | ident -> [{variable: $1}]
     | literal -> [{literal: $1}]
     ;

literal : int_lit -> { int: $1 }
        | str_lit -> { str: $1 }
        | array_lit -> { tuple: $1 }
        | obj_lit -> { obj: $1 }
        | func_lit -> {func: $1 }
        ;

int_lit : digit+ end_number %{
    var n = Number($1.map(function(e) { return e[0] }).join(""));
    console.log("number: " + n);
    $$ = n;
}%      ;

digit : DIGIT %{
    $$ = $1;
}%    ;

end_number : END_NUMBER %{
    $$ = $1;
}%         ;

str_lit : STR_LIT %{
    var s = $1.slice(1, -1);
    console.log("str: " + s);
    $$ = s;
}%      ;

bind : BIND %{
    console.log("bind");
    $$ = $1;
}%
     ;

array_lit : LBRACKET RBRACKET -> []
          | LBRACKET array_content RBRACKET -> $2
          ;

array_content : expr -> [$1]
              | expr ASEP array_content -> [$1].concat($3)
              ;

obj_lit : package str_lit expr? %{ 
    $$ = { 
        name: $2, 
        value: typeof $3 === 'undefined' ? null : $3
    };
}%      ;

func_lit : FUNCTION lambda
         ;

pattern : wildcard -> { wildcard: true }
        | ident -> { variable: $1 }
        | lit_pat { console.log("pattern " + JSON.stringify($1)) ; $$ = { literal: $1 }; }
        | lparen pattern rparen %{ 
            console.log("nested pattern: " + JSON.stringify($2));
            $$ = $2;
        }%
        ;

lit_pat : int_pat -> { int: $1 }
        | str_pat -> { str: $1 }
        | array_pat -> { tuple: $1 }
        | obj_pat -> { obj: $1 }
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

obj_pat : package str_lit pattern? -> { name: { str_lit: $2 }, pattern: $3 }
        | package wildcard pattern? -> { name: { wildcard: true }, pattern: $3.pattern }
        ;

wildcard : WILDCARD %{
    console.log("wildcard");
    $$ = $1;
}%       ; 

package : PACKAGE %{
    console.log("package");
    $$ = $1;
}%      ;

sep : SEP %{
    console.log("sep");
    $$ = $1;
}%  ;

lparen : LPAREN %{
    console.log("lparen");
    $$ = $1;
}%     ;

rparen : RPAREN %{
    console.log("rparen");
    $$ = $1;
}%     ;

lbracket : LBRACKET %{
    console.log("lbracket");
    $$ = $1;
}%       ;

rbracket : RBRACKET %{
    console.log("rbracket");
    $$ = $1;
}%       ;

alt_tok : ALT %{
    console.log("alt");
    $$ = $1;
}%      ;
