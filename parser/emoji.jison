/* description: An Emoji functional programming language. */

/* lexical grammar */
%lex
%options flex
%%

\s+                   /* skip whitespace */
\u0030\u20E3|\u0031\u20E3|\u0032\u20E3|\u0033\u20E3|\u0034\u20E3|\u0035\u20E3|\u0036\u20E3|\u0037\u20E3|\u0038\u20E3|\u0039\u20E3 return 'DIGIT';
"!"                   return 'END_NUMBER';

"\u{1F1FA}\u{1F1F8}"  return 'FUNC'; /* US flag */
"\uD83D\uDEA2"        return 'IMPORT';
"\u{1F525}"             return 'EXTERN' /* fire */

","                   return 'SEP';
"<"                   return 'BIND';
"("                   return "LPAREN";
")"                   return "RPAREN";

"t"             return 'TRUE';
"f"             return 'FALSE';

((?!\u270C|\u2796|[\u0030-\u0039]\u20E3|\uD83D\uDEA2).)+ return 'IDENT';
/*[a-zA-Z]              return 'IDENT';*/

\u270C[^\u270C]\u270C return 'STR_LIT';
"\u270C"              return 'DQUOTE';
"\u2796"              return 'SEP';

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
     | import_decl { $$ = { import: $1 }; }
     | ffi_decl -> { ffi_decl: $1 }
     ;

func_decl : FUNC idents BIND value %{ $$ = {
    name: $2[0],
    params: $2.splice(0, 1),
    body: $3
}; }% ;

idents : ident (SEP ident)* -> [$1].concat($2)
       ;

import_decl : IMPORT ident { $$ = { name: $2 }; }
            ;

ffi_decl : EXTERN ident str_lit -> { name: $2, externalName: $3 }
         ;

value : LPAREN value RPAREN -> { invocation: $2 }
      | idents
      | literal -> { literal: $1 }
      ;

ident : IDENT { $$ = { ident: $1 }; }
      ;

literal : int_lit -> { int: $1 }
        | bool_lit -> { bool: $1 }
        | str_lit -> { str: $1 }
        ;

int_lit : DIGIT+ END_NUMBER -> Number($1.join(""))
        ;

bool_lit : TRUE -> true
         | FALSE -> false
         ;

str_lit : STR_LIT
        ;
