/* description: An Emoji functional programming language. */

/* lexical grammar */
%lex
%options flex
%%

\s+                   /* skip whitespace */
\u0030\u20E3|\u0031\u20E3|\u0032\u20E3|\u0033\u20E3|\u0034\u20E3|\u0035\u20E3|\u0036\u20E3|\u0037\u20E3|\u0038\u20E3|\u0039\u20E3 return 'DIGIT';
"!"                   return 'END_NUMBER';

"\uD83C\uDFF4"        return 'FUNC'; /* waving black flag */
"\u260E\uFE0F"        return 'IMPORT'; /* black telephone*/ 
"\u{2623}"            return 'EXTERN' /*radioactive symbol */

"\uD83D\uDCCF"        return 'SEP';
"\u27A1\uFE0F"        return 'BIND';
"\uD83C\uDF1Cs"       return "LPAREN";
"\uD83C\uDF1B"        return "RPAREN";
"\uD83D\uDC48"        return "RBRACKET";
"\uD83D\uDC49"        return "LBRACKET";
"\u261D\uFE0F"        return "ASEP"; 

"\uD83D\uDC4D"             return 'TRUE';
"\uD83D\uDC4E"             return 'FALSE';

((?!\u270C|\u2796|[\u0030-\u0039]\u20E3|\uD83D\uDEA2|\uD83C\uDFF4|\<|\,).)+ return 'IDENT';

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

func_decl : FUNC idents BIND value %{ 
    // console.log($2);
    $$ = {
        name: $2[0],
        params: $2.slice(1),
        body: $4
    }; 
}% ;

idents : ident { console.log($1) ; $$ = [$1] }
       | ident SEP idents -> [$1].concat($3)
       ;

import_decl : IMPORT ident { $$ = { name: $2 }; }
            ;

ffi_decl : EXTERN ident str_lit -> { name: $2, externalName: $3 }
         ;

value : LPAREN value RPAREN -> { invocation: $2 }
      | idents
      | literal -> { literal: $1 }
      ;

ident : IDENT %{ 
    // console.log($1);
    $$ = { ident: $1 }; 
}%
      ;

literal : int_lit -> { int: $1 }
        | bool_lit -> { bool: $1 }
        | str_lit -> { str: $1 }
        | array_lit -> {tuple: $1}
        ;

int_lit : DIGIT+ END_NUMBER -> Number($1.map(function(e) { return e[0] }).join(""))
        ;

bool_lit : TRUE -> true
         | FALSE -> false
         ;

str_lit : STR_LIT
      

array_lit : LBRACKET array_content RBRACKET -> $2
          ;
array_content : value -> [$1]
              | value ASEP array_content -> [$1].concat[$3]
              ; 
