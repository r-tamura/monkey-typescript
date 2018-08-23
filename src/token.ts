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

// デフォルト定義Identifier一覧
// ユーザ定義Identifierとデフォルト定義の区別
const keywords = new Map<string, Tokens>([
  ["fn", Tokens.FUNCTION],
  ["let", Tokens.LET]
]);

function lookupIdent(ident: string): Tokens {
  if (keywords.has(ident)) {
    return keywords.get(ident);
  }
  return Tokens.IDENT;
}

export { TokenType, Token, Tokens, lookupIdent };
