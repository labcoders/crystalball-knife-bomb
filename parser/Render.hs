#!/usr/bin/runhaskell

import Data.List ( intercalate )

sep = ","
bind = "<"

func params body = "\x1F3F4" ++ intercalate sep params ++ bind ++ body

main = putStrLn $ concat [ func [ "hi", "yo" ] "lol"
                         ]
