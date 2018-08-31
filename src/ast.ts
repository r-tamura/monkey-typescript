import { Token } from "./token";

interface Node {
  tokenLiteral(): string;
  toString(): string;
}

interface Statement extends Node {
  statementNode(): void;
}

interface Expression extends Node {
  expressionNode(): void;
}

class Program implements Node {
  // Progam props
  statements: Statement[];
  tokenLiteral(): string {
    if (this.statements.length > 0) {
      return this.statements[0].tokenLiteral();
    }
    return "";
  }

  toString(): string {
    const buf = this.statements.reduce((acc, stmt) => {
      return Buffer.concat([acc, Buffer.from(stmt.toString())]);
    }, Buffer.allocUnsafe(0));
    return buf.toString();
  }
}

interface LetStatementProps {
  token?: Token;
  name?: Identifier;
  value?: Expression;
}
class LetStatement implements Statement, LetStatementProps {
  public token: Token;
  public name: Identifier;
  public value: Expression;

  static of({ token, name, value }: LetStatementProps) {
    let l = new LetStatement();
    l.token = token;
    l.name = name;
    l.value = value;
    return l;
  }

  tokenLiteral(): string {
    return this.token.literal;
  }

  toString(): string {
    return `${this.tokenLiteral()} ${
      this.name.value
    } = ${this.value.toString()};`;
  }

  statementNode() {}
}

interface ReturnStatementProps {
  token?: Token;
  returnValue?: Expression;
}
class ReturnStatement implements Statement, ReturnStatementProps {
  public token: Token;
  public returnValue: Expression;

  static of({ token, returnValue }: ReturnStatementProps) {
    const stmt = new ReturnStatement();
    stmt.token = token;
    stmt.returnValue = returnValue;
    return stmt;
  }

  tokenLiteral(): string {
    return this.token.literal;
  }

  toString(): string {
    return `${this.tokenLiteral()} ${this.returnValue.toString()};`;
  }

  statementNode() {}
}

interface ExpressionStatementProps {
  token?: Token; // the first token of the expression
  expression?: Expression;
}
class ExpressionStatement implements Statement, ExpressionStatement {
  public token: Token;
  public expression: Expression;
  static of({ token, expression }: ExpressionStatementProps) {
    const stmt = new ExpressionStatement();
    stmt.token = token;
    stmt.expression = expression;
    return stmt;
  }
  tokenLiteral(): string {
    return this.token.literal;
  }

  toString(): string {
    if (this.expression) {
      return this.expression.toString();
    }
    return "";
  }
  statementNode() {}
}

interface IdentifierProps {
  token?: Token;
  value?: string;
}
class Identifier implements Expression, IdentifierProps {
  public token: Token;
  public value: string;

  static of({ token, value }) {
    const ident = new Identifier();
    ident.token = token;
    ident.value = value;
    return ident;
  }

  tokenLiteral(): string {
    return this.value;
  }

  toString(): string {
    return this.value;
  }

  expressionNode() {}
}

interface IntegerLiteralProps {
  token?: Token;
  value?: number;
}
class IntegerLiteral implements Expression, IntegerLiteral {
  public token: Token;
  public value: number;

  static of({ token, value }: IntegerLiteralProps): IntegerLiteral {
    const literal = new IntegerLiteral();
    literal.token = token;
    literal.value = value;
    return literal;
  }

  tokenLiteral(): string {
    return this.token.literal;
  }

  toString(): string {
    return this.value.toString(10);
  }

  expressionNode() {}
}

interface PrefixExpressionProps {
  token?: Token;
  operator?: string;
  right?: Expression;
}
class PrefixExpression implements Expression, PrefixExpressionProps {
  public token: Token;
  public operator: string;
  public right: Expression;

  static of({ token, operator, right }: PrefixExpressionProps) {
    const exp = new PrefixExpression();
    exp.token = token;
    exp.operator = operator;
    exp.right = right;
    return exp;
  }

  tokenLiteral(): string {
    return this.token.literal;
  }

  toString(): string {
    return `(${this.operator}${this.right})`;
  }

  expressionNode() {}
}

interface InfixProps {
  token?: Token;
  left?: Expression;
  operator?: string;
  right?: Expression;
}
class InfixExpression implements Expression, InfixProps {
  public token: Token;
  public left: Expression;
  public operator: string;
  public right: Expression;

  static of({ token, left, operator, right }: InfixProps) {
    const exp = new InfixExpression();
    exp.token = token;
    exp.left = left;
    exp.operator = operator;
    exp.right = right;
    return exp;
  }

  tokenLiteral(): string {
    return this.token.literal;
  }

  toString(): string {
    return `(${this.left} ${this.operator} ${this.right})`;
  }

  expressionNode() {}
}

export {
  Node,
  Statement,
  Expression,
  Program,
  LetStatement,
  ReturnStatement,
  ExpressionStatement,
  Identifier,
  IntegerLiteral,
  PrefixExpression,
  InfixExpression
};
