#!/usr/bin/runhaskell

import Data.List ( intercalate )

sep = "\x1F4CF"
asep = "\x261D"
bind = "\x2b01"
finger = "\x1f4e6"

lparen = "\x1F31C"
rparen = "\x1F31B"

func name pats body = "\x1F3F4" ++ name ++ sep ++ intercalate sep pats' ++ bind ++ body
    where pats' = map (\p -> lparen ++ p ++ rparen) pats

array elems = lbracket ++ intercalate asep elems ++ rbracket
    where lbracket = "\x1F449"
          rbracket = "\x1F448"

str s = quote ++ s ++ quote
    where quote = "\x270C"

obj :: String -> Maybe String -> String
obj tag m = finger ++ str tag ++ case m of
    Just val -> val
    Nothing -> ""

int n = concat (zipWith f (show n) (repeat '\x20E3')) ++ "!"
    where f n box = n:box:[]

main = putStrLn $ concat [ func "hi" [obj "asyo" $ Just (int 5)] "yo"
                         , func "hi" [array [int 3, int 4]] "asdf"
                         ]
