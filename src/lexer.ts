import { Token, TokenType, Tokens, lookupIdent } from "./token";

interface LexerProps {
  input: string;
  position?: number;
  readPosition?: number;
  ch?: string;
}

class Lexer {
  input: string;
  position: number;
  readPosition: number;
  ch: string;
  constructor({
    input = "",
    position = 0,
    readPosition = 0,
    ch = ""
  }: LexerProps) {
    this.input = input;
    this.position = position;
    this.readPosition = readPosition;
    this.ch = ch;

    this.readChar();
  }

  public static of(input: string) {
    return new Lexer({ input });
  }

  public nextToken(): Token {
    let tok: Token;
    this.skipWhiteSpace();
    switch (this.ch) {
      case "=":
        if (this.peekChar() === "=") {
          const ch = this.ch;
          this.readChar();
          tok = this.newToken(Tokens.EQ, ch + this.ch);
        } else {
          tok = this.newToken(Tokens.ASSIGN, this.ch);
        }
        break;
      case ";":
        tok = this.newToken(Tokens.SEMICOLON, this.ch);
        break;
      case "(":
        tok = this.newToken(Tokens.LPAREN, this.ch);
        break;
      case ")":
        tok = this.newToken(Tokens.RPAREN, this.ch);
        break;
      case ",":
        tok = this.newToken(Tokens.COMMA, this.ch);
        break;
      case "+":
        tok = this.newToken(Tokens.PLUS, this.ch);
        break;
      case "-":
        tok = this.newToken(Tokens.MINUS, this.ch);
        break;
      case "!":
        if (this.peekChar() === "=") {
          const ch = this.ch;
          this.readChar();
          tok = this.newToken(Tokens.NOT_EQ, ch + this.ch);
        } else {
          tok = this.newToken(Tokens.BANG, this.ch);
        }
        break;
      case "/":
        tok = this.newToken(Tokens.SLASH, this.ch);
        break;
      case "*":
        tok = this.newToken(Tokens.ASTERISK, this.ch);
        break;
      case "<":
        tok = this.newToken(Tokens.LT, this.ch);
        break;
      case ">":
        tok = this.newToken(Tokens.GT, this.ch);
        break;
      case "{":
        tok = this.newToken(Tokens.LBRACE, this.ch);
        break;
      case "}":
        tok = this.newToken(Tokens.RBRACE, this.ch);
        break;
      case "\0":
        tok = this.newToken(Tokens.EOF, "");
        break;
      default:
        if (this.isLetter(this.ch)) {
          const literal = this.readIdentifier();
          return this.newToken(lookupIdent(literal), literal);
        } else if (this.isDigit(this.ch)) {
          return this.newToken(Tokens.INT, this.readNumber());
        } else {
          return this.newToken(Tokens.ILLEGAL, this.ch);
        }
    }
    this.readChar();
    return tok;
  }

  private readChar() {
    if (this.readPosition >= this.input.length) {
      this.ch = "\0"; // null char
    } else {
      this.ch = this.input[this.readPosition];
    }
    this.position = this.readPosition;
    this.readPosition += 1;
  }

  private peekChar(): string {
    if (this.readPosition >= this.input.length) {
      return "\0";
    }
    return this.input[this.readPosition];
  }

  private newToken(tokenType: TokenType, ch: string): Token {
    return { type: tokenType, literal: ch };
  }

  private readIdentifier(): string {
    const first = this.position;
    while (this.isLetter(this.ch)) {
      this.readChar();
    }
    return this.input.slice(first, this.position);
  }

  private readNumber(): string {
    const first = this.position;
    while (this.isDigit(this.ch)) {
      this.readChar();
    }
    return this.input.slice(first, this.position);
  }

  private isDigit(ch: string): boolean {
    return "0" <= ch && ch <= "9";
  }

  private isLetter(ch: string): boolean {
    return ("a" <= ch && ch <= "z") || ("A" <= ch && ch <= "Z") || ch === "_";
  }

  private skipWhiteSpace() {
    while (
      this.ch === " " ||
      this.ch === "\t" ||
      this.ch === "\n" ||
      this.ch === "\r"
    ) {
      this.readChar();
    }
  }
}

export { Lexer };
