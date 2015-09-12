/* description: An Emoji functional programming language. */

/* lexical grammar */
%lex
/* %options flex */
%%

\s+                   /* skip whitespace */
"\u0030\u20E3"        return 'ZERO';
"\u0031\u20E3"        return 'ONE';
"\u0032\u20E3"        return 'TWO';
"\u0033\u20E3"        return 'THREE';
"\u0034\u20E3"        return 'FOUR';
"\u0035\u20E3"        return 'FIVE';
"\u0036\u20E3"        return 'SIX';
"\u0037\u20E3"        return 'SEVEN';
"\u0038\u20E3"        return 'EIGHT';
"\u0039\u20E3"        return 'NINE';

"\uD83C\uDDFA\uD83C\uDDF8"    return 'FUNC';   /* US flag \u{1F1FA}\u{1F1F8} */
"\uD83D\uDEA2"             return 'IMPORT'; /* ship/boat \u{1F6A2}*/
"\uD83D\uDD25"             return 'EXTERN';  /* fire \u{1F525}*/


"\uD83D\uDC4D"             return 'TRUE';
"\uD83D\uDC4E"             return 'FALSE';

"\u2796"              return 'SEP';
","                   return 'COMMA';

\u270C[^\u270C]*\u270C return 'STR_LIT';

((?!\u270C|\u2796|[\u0030-\u0039]\u20E3).)+ return 'IDENT';

<<EOF>>               return 'EOF';
.                     return 'INVALID';

/lex

/* operator associations and precedence
%left 'ZERO'
%left 'ONE'
%left 'TWO'
%left 'THREE'
%left 'FOUR'
%left 'FIVE'
%left 'SIX'
%left 'SEVEN'
%left 'EIGHT'
%left 'NINE' */

/* enable EBNF grammar syntax */
%ebnf

%start program

%% /* language grammar */

program : (decl)+ EOF -> console.log(JSON.stringify($1))
        ;

decl : func_decl
     | import_decl
     | ffi_decl
     ;

func_decl : FUNC idents -> "func " + $2
          ;

import_decl : IMPORT IDENT -> "import " + $2
            ;

ffi_decl : EXTERN IDENT str_lit -> "extern " + $2 + $3
         ;

idents : (IDENT SEP)* IDENT -> $1.concat([$2]).join(",")
       ;

literal : int_lit
        | bool_lit
        | str_lit
        ;

int_lit : (digit)+ -> $1.join("")
        ;

bool_lit : TRUE -> "true"
         | FALSE -> "false"
         ;

str_lit : STR_LIT -> '"'+$2+'"'
        ;

digit : ZERO -> 0
      | ONE -> 1
      | TWO -> 2
      | THREE -> 3
      | FOUR -> 4
      | FIVE -> 5
      | SIX -> 6
      | SEVEN -> 7
      | EIGHT -> 8
      | NINE -> 9
      ;