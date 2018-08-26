import { Token } from "./token";

interface Node {
  tokenLiteral(): string;
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

  statementNode() {}
}

interface IdentifierProps {
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

  expressionNode() {}
}

export { Node, Statement, Expression, Program, LetStatement, Identifier };
