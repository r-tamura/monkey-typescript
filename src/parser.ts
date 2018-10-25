import { Lexer } from "./lexer";
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

const PrecedenceMap = new Map<TokenType, number>([
  [Tokens.EQ, Precedences.EQUALS],
  [Tokens.NOT_EQ, Precedences.EQUALS],

  [Tokens.LT, Precedences.LESSGREATER],
  [Tokens.GT, Precedences.LESSGREATER],

  [Tokens.PLUS, Precedences.SUM],
  [Tokens.MINUS, Precedences.SUM],

  [Tokens.ASTERISK, Precedences.PRODUCT],
  [Tokens.SLASH, Precedences.PRODUCT],

  [Tokens.LPAREN, Precedences.CALL]
]);

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
    this.registerPrefix(Tokens.TRUE, this.parseBoolean);
    this.registerPrefix(Tokens.FALSE, this.parseBoolean);
    this.registerPrefix(Tokens.LPAREN, this.parseGroupExpression);
    this.registerPrefix(Tokens.IF, this.parseIfExpression);
    this.registerPrefix(Tokens.FUNCTION, this.parseFunctionLiteral);
    this.registerPrefix(Tokens.STRING, this.parseStringLiteral);
    this.registerPrefix(Tokens.LBRACKET, this.parseArrayLiteral);

    this.infixParseFns = {};
    this.registerInfix(Tokens.PLUS, this.parseInfixExpression);
    this.registerInfix(Tokens.MINUS, this.parseInfixExpression);
    this.registerInfix(Tokens.ASTERISK, this.parseInfixExpression);
    this.registerInfix(Tokens.SLASH, this.parseInfixExpression);
    this.registerInfix(Tokens.LT, this.parseInfixExpression);
    this.registerInfix(Tokens.GT, this.parseInfixExpression);
    this.registerInfix(Tokens.EQ, this.parseInfixExpression);
    this.registerInfix(Tokens.NOT_EQ, this.parseInfixExpression);
    this.registerInfix(Tokens.LPAREN, this.parseCallExpression);
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

    this.nextToken();

    stmt.value = this.parseExpression(Precedences.LOWEST);

    if (this.peekTokenIs(Tokens.SEMICOLON)) {
      this.nextToken();
    }

    return stmt;
  }

  private parseReturnStatement(): ast.ReturnStatement {
    const returnStmt = ast.ReturnStatement.of({ token: this.curToken });
    this.nextToken();

    returnStmt.returnValue = this.parseExpression(Precedences.LOWEST);

    if (this.peekTokenIs(Tokens.SEMICOLON)) {
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

  private parseBlockStatement(): ast.BlockStatement {
    const block = ast.BlockStatement.of({
      token: this.curToken,
      statements: []
    });
    this.nextToken();
    while (!this.curTokenIs(Tokens.RBRACE) && !this.curTokenIs(Tokens.EOF)) {
      const stmt = this.parseStatement();
      if (stmt !== null) {
        block.statements.push(stmt);
      }
      this.nextToken();
    }
    return block;
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
    let leftExp = prefix();

    while (
      !this.peekTokenIs(Tokens.SEMICOLON) &&
      precedence < this.peekPrecedence()
    ) {
      // Suck in
      const infix = this.infixParseFns[this.peekToken.type];
      if (!infix) {
        return leftExp;
      }

      this.nextToken();
      leftExp = infix(leftExp);
    }
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

  private parseStringLiteral = (): ast.Expression => {
    return ast.StringLiteral.of({
      token: this.curToken,
      value: this.curToken.literal
    });
  };

  private parseBoolean = (): ast.Expression => {
    return ast.Boolean.of({
      token: this.curToken,
      value: this.curTokenIs(Tokens.TRUE)
    });
  };

  private parseArrayLiteral = (): ast.Expression => {
    const array = ast.ArrayLiteral.of({
      token: this.curToken,
      elements: this.parseExpressionList(Tokens.RBRACKET)
    });
    return array;
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

  private parseGroupExpression = (): ast.Expression => {
    this.nextToken();

    const exp = this.parseExpression(Precedences.LOWEST);

    if (!this.expectPeek(Tokens.RPAREN)) {
      return null;
    }

    return exp;
  };

  private parseIfExpression = (): ast.Expression => {
    const expression = ast.IfExpression.of({ token: this.curToken });

    if (!this.expectPeek(Tokens.LPAREN)) {
      return null;
    }

    this.nextToken();
    expression.condition = this.parseExpression(Precedences.LOWEST);

    if (!this.expectPeek(Tokens.RPAREN)) {
      return null;
    }

    if (!this.expectPeek(Tokens.LBRACE)) {
      return null;
    }

    expression.consequence = this.parseBlockStatement();

    if (this.peekTokenIs(Tokens.ELSE)) {
      this.nextToken();
      if (!this.peekTokenIs(Tokens.LBRACE)) {
        return null;
      }
      expression.alternative = this.parseBlockStatement();
    }

    return expression;
  };

  private parseInfixExpression = (left: ast.Expression): ast.Expression => {
    const exp = ast.InfixExpression.of({
      token: this.curToken,
      left: left,
      operator: this.curToken.literal
    });
    const precedence = this.curPrecedence();
    this.nextToken();
    exp.right = this.parseExpression(precedence);

    return exp;
  };

  private parseFunctionLiteral = (): ast.Expression => {
    const fn = ast.FunctionLiteral.of({ token: this.curToken });

    if (!this.expectPeek(Tokens.LPAREN)) {
      return null;
    }

    fn.parameters = this.parseFunctionParameters();

    if (!this.expectPeek(Tokens.LBRACE)) {
      return null;
    }

    fn.body = this.parseBlockStatement();

    return fn;
  };

  private parseFunctionParameters(): ast.Identifier[] {
    const identifiers = [];

    if (this.peekTokenIs(Tokens.RPAREN)) {
      this.nextToken();
      return identifiers;
    }

    this.nextToken();

    identifiers.push(this.parseIdentifier());

    while (this.peekTokenIs(Tokens.COMMA)) {
      this.nextToken();
      this.nextToken();
      identifiers.push(this.parseIdentifier());
    }

    if (!this.expectPeek(Tokens.RPAREN)) {
      return null;
    }

    return identifiers;
  }

  private parseCallExpression = (func: ast.Expression): ast.Expression => {
    return ast.CallExpression.of({
      token: this.curToken,
      function: func,
      arguments: this.parseExpressionList(Tokens.RPAREN)
    });
  };

  private parseExpressionList = (end: Tokens): ast.Expression[] => {
    const list = [];
    if (this.peekTokenIs(Tokens.RPAREN)) {
      this.nextToken();
      return list;
    }

    this.nextToken();
    list.push(this.parseExpression(Precedences.LOWEST));

    while (this.peekTokenIs(Tokens.COMMA)) {
      this.nextToken();
      this.nextToken();
      list.push(this.parseExpression(Precedences.LOWEST));
    }

    if (!this.expectPeek(end)) {
      return null;
    }

    return list;
  };

  private nextToken() {
    this.curToken = this.peekToken;
    this.peekToken = this.l.nextToken();
  }

  private expectPeek(t: TokenType): boolean {
    if (this.peekToken.type === t) {
      this.nextToken();
      return true;
    } else {
      this.peekError(t);
      return false;
    }
  }

  private curTokenIs(t: TokenType): boolean {
    return this.curToken.type === t;
  }

  private peekTokenIs(t: TokenType): boolean {
    return this.peekToken.type === t;
  }

  private curPrecedence(): number {
    return PrecedenceMap.get(this.curToken.type);
  }

  private peekPrecedence(): number {
    return PrecedenceMap.get(this.peekToken.type);
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
