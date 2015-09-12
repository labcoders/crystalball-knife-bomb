/* description: An Emoji functional programming language. */

/* lexical grammar */
%lex
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

"\u1F1FA\u1F1F8"      return 'FUNC'; /* US flag */
"\u1F6A2"             return 'IMPORT'; /* ship/boat */
"\u1F525"             return 'EXTERN' /* fire */

","                   return 'COMMA';

"\u1F44D"             return 'TRUE';
"\u1F44E"             return 'FALSE';

(?!(\u270C|\u2796|\u1F6A2|[\u0030-\u0039]\u20E3)) return 'IDENT_CHAR';

"\u270C"              return 'DQUOTE';
"\u2796"              return 'SEP';

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

func_decl : FUNC idents -> "func " + $2.join(",")
          ;

import_decl : IMPORT ident -> "import " + $2
            ;

ffi_decl : EXTERN ident str_lit -> "extern " + $2 + $3
         ;

idents : ident (SEP ident)* -> [$1].concat($2).join(",")
       ;

ident : (IDENT_CHAR)+ -> $1.join("")
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

str_lit : DQUOTE (NOT_DQUOTE)* DQUOTE -> '"'+$2.join("")+'"'
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