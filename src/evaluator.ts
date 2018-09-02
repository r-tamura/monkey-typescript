import * as util from "util";
import * as ast from "./ast";
import * as obj from "./object";

const NULL = obj.Null.of();
const TRUE = obj.Boolean.of({ value: true });
const FALSE = obj.Boolean.of({ value: false });

function evaluate(node: ast.Node): obj.Obj {
  // Statements
  if (node instanceof ast.Program) {
    return evalProgram(node);
  } else if (node instanceof ast.ExpressionStatement) {
    return evaluate(node.expression);
  } else if (node instanceof ast.BlockStatement) {
    return evalBlockStatement(node);
  } else if (node instanceof ast.ReturnStatement) {
    const value = evaluate(node.returnValue);
    if (isError(value)) {
      return value;
    }
    // Memo: ReturnValueでwrapする
    return obj.ReturnValue.of({ value });
  }

  // Expressions
  else if (node instanceof ast.IntegerLiteral) {
    return obj.Integer.of({ value: node.value });
  } else if (node instanceof ast.Boolean) {
    return node.value ? TRUE : FALSE;
  } else if (node instanceof ast.PrefixExpression) {
    const right = evaluate(node.right);
    if (isError(right)) {
      return right;
    }
    return evalPrefixExpression(node.operator, right);
  } else if (node instanceof ast.InfixExpression) {
    const left = evaluate(node.left);
    if (isError(left)) {
      return left;
    }
    const right = evaluate(node.right);
    if (isError(right)) {
      return right;
    }
    return evalInfixOperatorExpression(node.operator, left, right);
  } else if (node instanceof ast.IfExpression) {
    return evalIfExpression(node);
  }

  return null;
}

function evalProgram(program: ast.Program): obj.Obj {
  let result;
  for (const stmt of program.statements) {
    result = evaluate(stmt);
    if (result instanceof obj.ReturnValue) {
      return result.value;
    } else if (result instanceof obj.Err) {
      return result;
    }
  }
  return result;
}

function evalBlockStatement(block: ast.BlockStatement): obj.Obj {
  let result;
  for (const stmt of block.statements) {
    result = evaluate(stmt);
    if (result instanceof obj.ReturnValue || result instanceof obj.Err) {
      // x return result.value ReturnValueのまま返す(最上位の呼び出し元までバブルアップさせる)
      return result;
    }
  }
  return result;
}

function evalPrefixExpression(operator: string, right: obj.Obj) {
  switch (operator) {
    case "!":
      return evalBangOperatorExpression(right);
    case "-":
      return evalMinusOperatorExpression(right);
    default:
      return newError("unknown operator: %s%s", operator, right.type());
  }
}

function evalBangOperatorExpression(right: obj.Obj) {
  switch (right) {
    case TRUE:
      return FALSE;
    case FALSE:
      return TRUE;
    case NULL:
      return TRUE;
    default:
      return FALSE;
  }
}

function evalMinusOperatorExpression(right: obj.Obj): obj.Obj {
  if (right.type() !== obj.ObjTypes.INTEGER) {
    return newError("unknown operator: -%s", right.type());
  }
  const value = (right as obj.Integer).value;
  return obj.Integer.of({ value: -value });
}

function evalInfixOperatorExpression(
  operator: string,
  left: obj.Obj,
  right: obj.Obj
) {
  if (
    left.type() === obj.ObjTypes.INTEGER &&
    right.type() === obj.ObjTypes.INTEGER
  ) {
    return evalIntegerInfixExpression(operator, left, right);
  } else if (operator === "==") {
    // TRUE, FALSEオブジェクトのみなので、オブジェクト同士の比較でよい
    return nativeBooleanToBooleanObject(left === right);
  } else if (operator === "!=") {
    return nativeBooleanToBooleanObject(left !== right);
  } else if (left.type() !== right.type()) {
    return newError(
      "type mismatch: %s %s %s",
      left.type(),
      operator,
      right.type()
    );
  } else {
    return newError(
      "unknown operator: %s %s %s",
      left.type(),
      operator,
      right.type()
    );
  }
}

function evalIntegerInfixExpression(
  operator: string,
  left: obj.Obj,
  right: obj.Obj
) {
  const leftVal = (left as obj.Integer).value;
  const rightVal = (right as obj.Integer).value;

  switch (operator) {
    case "+":
      return obj.Integer.of({ value: leftVal + rightVal });
    case "-":
      return obj.Integer.of({ value: leftVal - rightVal });
    case "*":
      return obj.Integer.of({ value: leftVal * rightVal });
    case "/":
      return obj.Integer.of({ value: leftVal / rightVal });
    case ">":
      return nativeBooleanToBooleanObject(leftVal > rightVal);
    case "<":
      return nativeBooleanToBooleanObject(leftVal < rightVal);
    case "==":
      return nativeBooleanToBooleanObject(leftVal === rightVal);
    case "!=":
      return nativeBooleanToBooleanObject(leftVal !== rightVal);
    default:
      return newError(
        "unknown operator: %s %s %s",
        left.type(),
        operator,
        right.type()
      );
  }
}

function evalIfExpression(ie: ast.IfExpression): obj.Obj {
  const condition = evaluate(ie.condition);

  if (isError(condition)) {
    return condition;
  }

  if (isTruthy(condition)) {
    return evaluate(ie.consequence);
  } else if (ie.alternative) {
    return evaluate(ie.alternative);
  } else {
    return NULL;
  }
}

function nativeBooleanToBooleanObject(value: boolean) {
  return value ? TRUE : FALSE;
}

function isTruthy(o: obj.Obj) {
  switch (o) {
    case NULL:
    case FALSE:
      return false;
    case TRUE:
      return true;
    default:
      return true;
  }
}

function newError(format: string, ...a: any[]): obj.Err {
  return obj.Err.of({ message: util.format(format, ...a) });
}

function isError(o: obj.Obj): boolean {
  return o !== null ? false : o.type() === obj.ObjTypes.ERROR;
}

export { evaluate, NULL, TRUE, FALSE };
