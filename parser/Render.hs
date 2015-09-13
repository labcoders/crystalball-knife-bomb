#!/usr/bin/runhaskell

import Data.List ( intercalate )

sep = "\x1F4CF"
asep = "\x261D"
bind = "\x2b01"
finger = "\x1f4e6"

lparen = "\x1F31C"
rparen = "\x1F31B"

wildcard = "\x1F573"

clover = "\x1F340"

func name pats body = "\x1F3F4" ++ name ++ concat pats' ++ bind ++ body
    where pats' = map (\p -> sep ++ lparen ++ p ++ rparen) pats

array elems = lbracket ++ intercalate asep elems ++ rbracket
    where lbracket = "\x1F449"
          rbracket = "\x1F448"

str s = quote ++ s ++ quote
    where quote = "\x270C"

expr e = lparen ++ e ++ rparen

objPat :: String -> Maybe String -> String
objPat tag m = finger ++ str tag ++ case m of
    Just val -> val
    Nothing -> wildcard

obj tag m = finger ++ str tag ++ case m of
    Just val -> val
    Nothing -> ""

int n = concat (zipWith f (show n) (repeat '\x20E3')) ++ "!"
    where f n box = n:box:[]

call args = intercalate sep args

main = putStrLn $ concat [ func "len"g
                                [ objPat "Nil" Nothing ]
                                ( obj "Zero" Nothing )
                         , func "len"g
                                [ objPat "Cons"
                                         (Just $ array [wildcard, "xs"])
                                ]
                                ( obj "Succ"g
                                      (Just $ call [ "len", "xs" ])
                                )
                         , func clover
                                []
                                ( call [ "len"
                                       , obj "Cons"g
                                             ( Just $g
                                               obj "Cons"
                                                   ( Just $g
                                                     obj "Cons"
                                                         ( Just $g
                                                           obj "Nil" Nothing
                                                         )
                                                   )
                                             )
                                       ]
                                )
                         ]
