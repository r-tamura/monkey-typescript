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

  // Delimiters
  COMMA = ",",
  SEMICOLON = ";",

  LPAREN = "(",
  RPAREN = ")",
  LBRACE = "{",
  RBRACE = "}",

  // Keywords
  FUNCTION = "FUNCTION",
  LET = "LET"
}

export { TokenType, Token, Tokens };
