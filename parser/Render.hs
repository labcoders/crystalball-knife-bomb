#!/usr/bin/runhaskell

import Data.List ( intercalate )

sep = "\x1F4CF"
asep = "\x261D"
bind = "\x2b01"
finger = "\x1f4e6"

func params body = "\x1F3F4" ++ intercalate sep params ++ bind ++ body

array elems = lbracket ++ intercalate asep elems ++ rbracket
    where lbracket = "\x1F449"
          rbracket = "\x1F448"

obj :: String -> Maybe String -> String
obj tag m = finger ++ tag ++ case m of
    Just val -> val
    Nothing -> ""

int n = concat (zipWith f (show n) (repeat '\x20E3')) ++ "!"
    where f n box = n:box:[]

main = putStrLn $ concat [ func [ "hi" ] $ obj "asyo" $ Just $ int 5
                         ]
