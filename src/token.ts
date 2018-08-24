type TokenType = string;

interface Token {
  type: TokenType;
  literal: string;
}

enum Tokens {
  ILLEGAL = "ILLEGAL",
  EOF = "EOF",
  // Identifiers + literals
  IDENT = "IDENT",
  INT = "INT",

  // Operators
  ASSIGN = "=",
  PLUS = "+",
  MINUS = "-",
  BANG = "!",
  ASTERISK = "*",
  SLASH = "/",

  LT = "<",
  GT = ">",

  EQ = "==",
  NOT_EQ = "!=",

  // Delimiters
  COMMA = ",",
  SEMICOLON = ";",

  LPAREN = "(",
  RPAREN = ")",
  LBRACE = "{",
  RBRACE = "}",

  // Keywords
  FUNCTION = "FUNCTION",
  LET = "LET",
  IF = "IF",
  ELSE = "ELSE",
  RETURN = "RETURN",
  TRUE = "TRUE",
  FALSE = "FALSE"
}

// デフォルト定義Identifier一覧
// ユーザ定義Identifierとデフォルト定義の区別
const keywords = new Map<string, Tokens>([
  ["fn", Tokens.FUNCTION],
  ["let", Tokens.LET],
  ["if", Tokens.IF],
  ["else", Tokens.ELSE],
  ["return", Tokens.RETURN],
  ["true", Tokens.TRUE],
  ["false", Tokens.FALSE]
]);

function lookupIdent(ident: string): Tokens {
  if (keywords.has(ident)) {
    return keywords.get(ident);
  }
  return Tokens.IDENT;
}

export { TokenType, Token, Tokens, lookupIdent };
