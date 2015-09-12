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

"\u1F44D"             return 'TRUE';
"\u1F44E"             return 'FALSE';

"\u270C"              return 'DQUOTE';
"\u1F535"             return 'SEP';

<<EOF>>               return 'EOF';

/lex

%start program

%% /* language grammar */

program : int_lit EOF {$$ = console.log($1)}
        ;

int_lit : digit {$$ = Number($1)}
       | digit int_lit {$$ = Number($1) + $2}
       ;

digit : ZERO {$$ = 0}
      | ONE {$$ = 1}
      | TWO {$$ = 2}
      | THREE {$$ = 3}
      | FOUR {$$ = 4}
      | FIVE {$$ = 5}
      | SIX {$$ = 6}
      | SEVEN {$$ = 7}
      | EIGHT {$$ = 8}
      | NINE {$$ = 9}
      ;