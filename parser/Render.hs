#!/usr/bin/runhaskell

import Data.List ( intercalate )

sep = ","
bind = "<"

func params body = "\x1F3F4" ++ intercalate sep params ++ bind ++ body

int n = concat (zipWith f (show n) (repeat '\x20E3')) ++ "!"
    where f n box = n:box:[]

main = putStrLn $ concat [ func [ "hi", "yo" ] $ int 525
                         ]
