#!/usr/bin/runhaskell

{-# LANGUAGE GADTs, KindSignatures, FlexibleInstances, RankNTypes #-}

import qualified Control.Monad.Writer as W
import           Data.List            ( intercalate )

sep = "\x1F4CF"
asep = "\x261D"
bind = "\x2b01"
finger = "\x1f4e6"

lparen = "\x1F31C"
rparen = "\x1F31B"

lbracket = "\x1F448"
rbracket = "\x1F449"

wildcard = "\x1F573"

clover = "\x1F340"

func = "\x1F3F4"

digitBox = "\x20E3"

lambda = "\x1F4C8"

numEnd = "!"

quote = "\x270C"

alt = "\x21AA\xFE0F"

importS = "\x1F381"
includeS = "\x1F489"

data NonEmpty a = Start a
                | a :> NonEmpty a

infixl 6 :>

data Program = Program { progStmts :: [Stmt]
                       , progDecls :: [Decl]
                       }

-- | A statement in the language, which is performed at compile-time.
data Stmt = Import Ident
          | Include Literal

-- | A declaration in the language.
data Decl = FunctionDecl Ident [Alt]
          | FfiDecl Ident Literal

-- | An alternative of a pattern match.
data Alt = Alt [Pattern] Expr

-- | An identifier.
type Ident = String

data Expr = Call [Expr]
          | Literal Literal
          | Ident Ident

data Literal = IntLit Int
             | StringLit String
             | ArrayLit [Expr]
             | ObjectLit Literal Expr
             | FunctionLit Alt

data Pattern = Wildcard
             | Variable Ident
             | IntPat Int
             | StringPat String
             | ArrayPat [Pattern]
             | ObjectPat Pattern Pattern


renderProgram (Program stmts decls) = concatMap renderStmt stmts ++ concatMap renderDecl decls

renderStmt :: Stmt -> String
renderStmt (Import i) = importS ++ renderIdent i
renderStmt (Include l) = includeS ++ renderLiteral l

renderPattern :: Pattern -> String
renderPattern Wildcard = wildcard
renderPattern (Variable v) = renderIdent v
renderPattern (IntPat i) = renderInteger i
renderPattern (StringPat s) = renderString s
renderPattern (ArrayPat ps) = surroundBracket $ intercalate asep $ map renderPattern ps
renderPattern (ObjectPat p q) = surroundParen $ finger ++ renderPattern p ++ renderPattern q

renderExpr :: Expr -> String
renderExpr (Call es) = concat $ map (surroundParen . renderExpr) es
renderExpr (Literal l) = renderLiteral l
renderExpr (Ident i) = renderIdent i

renderIdent :: Ident -> String
renderIdent s = s

renderDigit :: Char -> String
renderDigit d = d : digitBox

renderInteger :: Int -> String
renderInteger i = concatMap renderDigit (show i) ++ numEnd

renderString :: String -> String
renderString s = quote ++ s ++ quote

renderLiteral (IntLit i) = renderInteger i
renderLiteral (StringLit s) = renderString s
renderLiteral (ArrayLit es) = surroundBracket $ intercalate asep $ map renderExpr es
renderLiteral (ObjectLit l e) = surroundParen $ finger ++ renderLiteral l ++ renderExpr e
renderLiteral (FunctionLit a) = surroundParen $ lambda ++ renderAlt a

renderAlt (Alt ps e) = concat [ alt
                              , intercalate sep (map renderPattern ps)
                              , bind
                              , renderExpr e
                              ]

renderDecl (FunctionDecl i as) = concat [ func
                                        , renderIdent i
                                        , concatMap renderAlt as
                                        ]

surroundParen :: String -> String
surroundParen s = lparen ++ s ++ rparen

surroundBracket :: String -> String
surroundBracket s = lbracket ++ s ++ rbracket

indent :: String -> String
indent s = i ++ s
    where i = "    "

fn name pats body = func ++ name ++ concat pats' ++ bind ++ body
    where pats' = map (\p -> sep ++ lparen ++ p ++ rparen) pats

array elems = lbracket ++ intercalate asep elems ++ rbracket

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

prog = Program []
               [ FunctionDecl "len"
                              [ Alt [ ObjectPat ( StringPat "Nil" )
                                                Wildcard
                                    ]
                                    ( Literal (IntLit 0) )
                              , Alt [ ObjectPat ( StringPat "Cons" )
                                                ( ArrayPat [ Wildcard
                                                           , Variable "xs"
                                                           ]
                                                )
                                    ]
                                    ( Call [ Ident "add"
                                           , Literal ( IntLit 1 )
                                           , Call [ Ident "len"
                                                  , Ident "xs"
                                                  ]
                                           ]
                                    )
                              ]
               ]

e = concat [ func, "test", alt, renderPattern (IntPat 0), bind, renderLiteral (IntLit 0) ]

main = putStrLn $ renderProgram prog
--main = putStrLn e
