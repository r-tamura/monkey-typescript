import Lexer from "./lexer";
import { Token, Tokens, TokenType } from "./token";
import * as ast from "./ast";

type PrefixParseFn = () => ast.Expression;
type InfixParseFn = (left: ast.Expression) => ast.Expression;

enum Precedences {
  LOWEST = 1,
  EQUALS,
  LESSGREATER,
  SUM,
  PRODUCT,
  PREFIX,
  CALL
}

class Parser {
  private l: Lexer;
  private curToken: Token;
  private peekToken: Token;

  private errors: string[] = [];

  // index signatureはaliasが使えない TokenType を string とする
  private prefixParseFns: { [s: string]: PrefixParseFn };
  private infixParseFns: { [s: string]: InfixParseFn };

  constructor(l: Lexer) {
    this.l = l;
    this.nextToken();
    this.nextToken();

    this.prefixParseFns = {};
    this.registerPrefix(Tokens.IDENT, this.parseIdentifier);
    this.registerPrefix(Tokens.INT, this.parseIntegerLiteral);
    this.registerPrefix(Tokens.BANG, this.parsePrefixExpression);
    this.registerPrefix(Tokens.MINUS, this.parsePrefixExpression);
  }

  static of(l: Lexer) {
    return new Parser(l);
  }

  parseProgram(): ast.Program {
    const program = new ast.Program();
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

  getErrors(): string[] {
    return this.errors;
  }

  private parseStatement(): ast.Statement {
    switch (this.curToken.type) {
      case Tokens.LET:
        return this.parseLetStatement();
      case Tokens.RETURN:
        return this.parseReturnStatement();
      default:
        return this.parseExpressionStatement();
    }
  }

  private parseLetStatement(): ast.LetStatement {
    const stmt = ast.LetStatement.of({ token: this.curToken });
    if (!this.expectPeek(Tokens.IDENT)) {
      return null;
    }

    stmt.name = ast.Identifier.of({
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

  private parseReturnStatement(): ast.ReturnStatement {
    const returnStmt = ast.ReturnStatement.of({ token: this.curToken });
    this.nextToken();

    // TODO
    while (!this.curTokenIs(Tokens.SEMICOLON)) {
      this.nextToken();
    }

    return returnStmt;
  }

  private parseExpressionStatement(): ast.ExpressionStatement {
    const stmt = ast.ExpressionStatement.of({
      token: this.curToken,
      expression: this.parseExpression(Precedences.LOWEST)
    });

    if (this.peekTokenIs(Tokens.SEMICOLON)) {
      this.nextToken();
    }

    return stmt;
  }

  private noPrefixParseFnError(t: TokenType) {
    this.errors.push(`no prefix function for ${t} found`);
  }

  private parseExpression(precedence: number): ast.Expression {
    const prefix = this.prefixParseFns[this.curToken.type];
    if (!prefix) {
      this.noPrefixParseFnError(this.curToken.type);
      return null;
    }
    const leftExp = prefix();
    return leftExp;
  }

  private parseIdentifier = (): ast.Expression => {
    return ast.Identifier.of({
      token: this.curToken,
      value: this.curToken.literal
    });
  };

  private parseIntegerLiteral = (): ast.Expression => {
    const lit = ast.IntegerLiteral.of({
      token: this.curToken
    });

    try {
      const value = parseInt(this.curToken.literal, 10);
      lit.value = value;
      return lit;
    } catch {
      this.errors.push(`could not parse ${this.curToken.literal} as integer`);
      return null;
    }
  };

  private parsePrefixExpression = (): ast.Expression => {
    const exp = ast.PrefixExpression.of({
      token: this.curToken,
      operator: this.curToken.literal
    });
    this.nextToken();
    exp.right = this.parseExpression(Precedences.PREFIX);
    return exp;
  };

  parsePrefix;

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

  private peekError(t: TokenType) {
    this.errors = [
      ...this.errors,
      `expected next token to be ${t}, got ${this.peekToken.type} instead`
    ];
  }

  private registerPrefix(token: TokenType, fn: PrefixParseFn) {
    this.prefixParseFns[token] = fn;
  }

  private registerInfix(token: TokenType, fn: InfixParseFn) {
    this.infixParseFns[token] = fn;
  }
}

export { Parser };