import * as ast from "./ast";
import * as obj from "./object";

function evaluate(node: ast.Node): obj.Obj {
  // Statements
  if (node instanceof ast.Program) {
    return evalStatements(node.statements);
  } else if (node instanceof ast.ExpressionStatement) {
    return evaluate(node.expression);
  }

  // Expressions
  else if (node instanceof ast.IntegerLiteral) {
    return obj.Integer.of({ value: node.value });
  }

  return null;
}

function evalStatements(stmts: ast.Statement[]): obj.Obj {
  let result;
  for (const stmt of stmts) {
    result = evaluate(stmt);
  }
  return result;
}

export { evaluate };
