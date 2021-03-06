import * as util from "util";
import * as ast from "./ast";
import * as obj from "./object";
import { Environment, newEnclosedEnvironment } from "./environment";
import { getBuiltinByName } from "./builtins";

const NULL = obj.Null.of();
const TRUE = obj.Boolean.of({ value: true });
const FALSE = obj.Boolean.of({ value: false });

const builtins = {
  len: getBuiltinByName("len"),
  first: getBuiltinByName("first"),
  last: getBuiltinByName("last")
};

function evaluate(node: ast.Node, env: Environment): obj.Obj {
  // Statements
  if (node instanceof ast.Program) {
    return evalProgram(node, env);
  } else if (node instanceof ast.ExpressionStatement) {
    return evaluate(node.expression, env);
  } else if (node instanceof ast.BlockStatement) {
    return evalBlockStatement(node, env);
  } else if (node instanceof ast.ReturnStatement) {
    const value = evaluate(node.returnValue, env);
    if (isError(value)) {
      return value;
    }
    // Memo: ReturnValueでwrapする
    return obj.ReturnValue.of({ value });
  } else if (node instanceof ast.LetStatement) {
    const val = evaluate(node.value, env);
    if (isError(val)) {
      return val;
    }
    env.set(node.name.value, val);
  }

  // Expressions
  else if (node instanceof ast.IntegerLiteral) {
    return obj.Integer.of({ value: node.value });
  } else if (node instanceof ast.Boolean) {
    return node.value ? TRUE : FALSE;
  } else if (node instanceof ast.StringLiteral) {
    return obj.Str.of({ value: node.value });
  } else if (node instanceof ast.PrefixExpression) {
    const right = evaluate(node.right, env);
    if (isError(right)) {
      return right;
    }
    return evalPrefixExpression(node.operator, right);
  } else if (node instanceof ast.InfixExpression) {
    const left = evaluate(node.left, env);
    if (isError(left)) {
      return left;
    }
    const right = evaluate(node.right, env);
    if (isError(right)) {
      return right;
    }
    return evalInfixOperatorExpression(node.operator, left, right);
  } else if (node instanceof ast.IfExpression) {
    return evalIfExpression(node, env);
  } else if (node instanceof ast.Identifier) {
    return evalIdentifier(node, env);
  } else if (node instanceof ast.FunctionLiteral) {
    return obj.Func.of({ parameters: node.parameters, body: node.body, env });
  } else if (node instanceof ast.CallExpression) {
    const func = evaluate(node.function, env);
    if (isError(func)) {
      return func;
    }

    const args = evalExpressions(node.arguments, env);
    if (args.length === 1 && isError(args[0])) {
      return args[0];
    }

    return applyFunction(func, args);
  } else if (node instanceof ast.ArrayLiteral) {
    const elements = evalExpressions(node.elements, env);
    if (elements.length === 1 && isError(elements[0])) {
      return elements[0];
    }
    return obj.Arr.of({ elements });
  } else if (node instanceof ast.HashLiteral) {
    return evalHashLiteral(node, env);
  } else if (node instanceof ast.IndexExpression) {
    const left = evaluate(node.left, env);
    if (isError(left)) {
      return left;
    }

    const index = evaluate(node.index, env);
    if (isError(index)) {
      return index;
    }
    return evalIndexExpression(left, index);
  }
  return null;
}

function evalProgram(program: ast.Program, env: Environment): obj.Obj {
  let result;
  for (const stmt of program.statements) {
    result = evaluate(stmt, env);
    if (result instanceof obj.ReturnValue) {
      return result.value;
    } else if (result instanceof obj.Err) {
      return result;
    }
  }
  return result;
}

function evalBlockStatement(
  block: ast.BlockStatement,
  env: Environment
): obj.Obj {
  let result;
  for (const stmt of block.statements) {
    result = evaluate(stmt, env);
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
  } else if (
    left.type() === obj.ObjTypes.STRING &&
    right.type() === obj.ObjTypes.STRING
  ) {
    return evalStringInfixExpression(operator, left, right);
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

function evalStringInfixExpression(
  operator: string,
  left: obj.Obj,
  right: obj.Obj
): obj.Obj {
  const leftVal = (left as obj.Str).value;
  const rightVal = (right as obj.Str).value;

  if (operator !== "+") {
    return newError(
      `unknown operator: ${left.type()} ${operator} ${right.type()}`
    );
  }

  return obj.Str.of({ value: leftVal + rightVal });
}

function evalHashLiteral(node: ast.HashLiteral, env: Environment): obj.Obj {
  const pairs = new Map<obj.SerializedHashKey, obj.HashPair>();
  for (const [keyNode, valueNode] of node.pairs) {
    const key = evaluate(keyNode, env);
    if (isError(key)) {
      return key;
    }
    const value = evaluate(valueNode, env);
    if (isError(value)) {
      return value;
    }

    const hashKey = (key as
      | obj.Str
      | obj.Integer
      | obj.Boolean) as obj.Hashable;
    const hashed = hashKey.hashkey().seriarize();
    pairs.set(hashed, { key, value });
  }
  return obj.Hash.of({ pairs });
}

function evalIfExpression(ie: ast.IfExpression, env: Environment): obj.Obj {
  const condition = evaluate(ie.condition, env);

  if (isError(condition)) {
    return condition;
  }

  if (isTruthy(condition)) {
    return evaluate(ie.consequence, env);
  } else if (ie.alternative) {
    return evaluate(ie.alternative, env);
  } else {
    return NULL;
  }
}

function evalIndexExpression(left: obj.Obj, index: obj.Obj): obj.Obj {
  if (
    left.type() === obj.ObjTypes.ARRAY &&
    index.type() === obj.ObjTypes.INTEGER
  ) {
    return evalArrayIndexExpression(left, index);
  } else if (left.type() === obj.ObjTypes.HASH) {
    return evalHashIndexExpression(left, index);
  }
  return newError("index operator not supported: %s", left.type());
}

function evalArrayIndexExpression(left: obj.Obj, index: obj.Obj): obj.Obj {
  const arrObject = left as obj.Arr;
  const idx = index as obj.Integer;
  const max = arrObject.elements.length - 1;

  if (idx.value < 0 || idx.value > max) {
    return NULL;
  }

  return arrObject.elements[idx.value];
}

function evalHashIndexExpression(left: obj.Obj, index: obj.Obj): obj.Obj {
  const hashObject = left as obj.Hash;
  const idx = index as obj.Integer | obj.Str | obj.Boolean;

  const hashkey = idx.hashkey().seriarize();
  if (hashObject.pairs.has(hashkey)) {
    return hashObject.pairs.get(hashkey).value;
  }
  return NULL;
}

function evalIdentifier(node: ast.Identifier, env: Environment): obj.Obj {
  const val = env.get(node.value) || getBuiltinByName(node.value);
  // Identifierが環境にないときはnullが返る
  if (val === null) {
    return newError(`identifier not found: ${node.value}`);
  }
  return val;
}

function evalExpressions(exps: ast.Expression[], env): obj.Obj[] {
  const res = [];
  for (const exp of exps) {
    const evaluated = evaluate(exp, env);
    if (isError(evaluated)) {
      return [evaluated];
    }
    res.push(evaluated);
  }
  return res;
}

function applyFunction(func: obj.Obj, args: obj.Obj[]): obj.Obj {
  if (func instanceof obj.Func) {
    const fn = func as obj.Func;
    const env = extendFunctionEnv(fn, args);
    const evaluated = evaluate(fn.body, env);
    // 関数の返り値はreturnされた値をバブルアップしないのでunwrapする
    // ReturnValue出ない場合(Errorの場合)はバブルアップさせる
    return unwrapReturnValue(evaluated);
  }

  if (func instanceof obj.Builtin) {
    return func.fn(...args);
  }

  return newError(`not a function: ${func.type()}`);
}

function extendFunctionEnv(fn: obj.Func, args: obj.Obj[]) {
  const env = newEnclosedEnvironment(fn.env);
  fn.parameters.forEach((param, i) => {
    // key: parameter name
    env.set(param.value, args[i]);
  });
  return env;
}

function unwrapReturnValue(o: obj.Obj): obj.Obj {
  if (o instanceof obj.ReturnValue) {
    return o.value;
  }
  return o;
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
