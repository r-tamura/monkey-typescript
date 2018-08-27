import Lexer from "./lexer";
import { Token, Tokens, TokenType } from "./token";
import {
  Program,
  LetStatement,
  Identifier,
  Statement,
  ReturnStatement
} from "./ast";

class Parser {
  private l: Lexer;
  private curToken: Token;
  private peekToken: Token;

  constructor(l: Lexer) {
    this.l = l;
    this.nextToken();
    this.nextToken();
  }

  static of(l: Lexer) {
    return new Parser(l);
  }

  parseProgram(): Program {
    const program = new Program();
    program.statements = [];

    while (!this.curTokenIs(Tokens.EOF)) {
      const stmt = this.parseStatement();
      if (stmt !== null) {
        program.statements.push(stmt);
      }
      this.nextToken();
    }

    return program;
  }

  private parseStatement(): Statement {
    switch (this.curToken.type) {
      case Tokens.LET:
        return this.parseLetStatement();
      case Tokens.RETURN:
        return this.parseReturnStatement();
      default:
        return null;
    }
  }

  private parseLetStatement(): LetStatement {
    const stmt = LetStatement.of({ token: this.curToken });
    if (!this.expectPeek(Tokens.IDENT)) {
      return null;
    }

    stmt.name = Identifier.of({
      token: this.curToken,
      value: this.curToken.literal
    });

    if (!this.expectPeek(Tokens.ASSIGN)) {
      return null;
    }

    // TODO
    while (!this.curTokenIs(Tokens.SEMICOLON)) {
      this.nextToken();
    }

    return stmt;
  }

  private parseReturnStatement(): ReturnStatement {
    const returnStmt = ReturnStatement.of({ token: this.curToken });
    this.nextToken();

    // TODO
    while (!this.curTokenIs(Tokens.SEMICOLON)) {
      this.nextToken();
    }

    return returnStmt;
  }

  private nextToken() {
    this.curToken = this.peekToken;
    this.peekToken = this.l.nextToken();
  }

  private expectPeek(t: TokenType): boolean {
    if (this.peekToken.type === t) {
      this.nextToken();
      return true;
    } else {
      return false;
    }
  }

  private curTokenIs(t: TokenType): boolean {
    return this.curToken.type === t;
  }

  private peekTokenIs(t: TokenType): boolean {
    return this.peekToken.type === t;
  }
}

export { Parser };
