import { Parser } from "./parser";
import { Lexer } from "./lexer";
import * as ast from "./ast";
import assert = require("power-assert");
import { Tokens } from "./token";

describe("Parser", () => {
  it("toString", () => {
    const program = new ast.Program();
    program.statements = [
      ast.LetStatement.of({
        token: { type: Tokens.LET, literal: "let" },
        name: ast.Identifier.of({
          token: { type: Tokens.LET, literal: "myVar" },
          value: "myVar"
        }),
        value: ast.Identifier.of({
          token: { type: Tokens.LET, literal: "anotherVar" },
          value: "anotherVar"
        })
      })
    ];

    assert.equal(
      program.toString(),
      "let myVar = anotherVar;",
      `program.toString() wrong. got=${program.toString()}`
    );
  });

  it("let statemet", () => {
    const tests: {
      input: string;
      expectedIdentifier: string;
      expectedValue: any;
    }[] = [
      { input: `let x = 5;`, expectedIdentifier: "x", expectedValue: 5 },
      { input: `let y = true;`, expectedIdentifier: "y", expectedValue: true },
      {
        input: `let foobar = y;`,
        expectedIdentifier: "foobar",
        expectedValue: "y"
      }
    ];

    tests.forEach(tt => {
      const program = testParse(tt.input);
      assert.equal(program.statements.length, 1);
      const stmt = program.statements[0] as ast.LetStatement;
      testLetStatement(stmt, tt.expectedIdentifier);
      testLiteralExpression(stmt.value, tt.expectedValue);
    });
  });

  it("return statement", () => {
    const tests: {
      input: string;
      expected: any;
    }[] = [
      { input: "return 5;", expected: 5 },
      { input: "return true;", expected: true },
      { input: "return ident;", expected: "ident" }
    ];

    tests.forEach(tt => {
      const program = testParse(tt.input);
      assert.equal(program.statements.length, 1);
      const stmt = program.statements[0] as ast.ReturnStatement;
      testLiteralExpression(stmt.returnValue, tt.expected);
    });
  });

  it("identifier expression", () => {
    const input = `foobar;`;
    const program = testParse(input);

    assert.equal(
      program.statements.length,
      1,
      `program has not enough statement. got=${program.statements.length}`
    );
    const stmt = program.statements[0] as ast.ExpressionStatement;
    const ident = stmt.expression as ast.Identifier;
    assert.equal(
      ident.value,
      "foobar",
      `ident.value not foobar, got=${ident.value}`
    );
    assert.equal(
      ident.tokenLiteral(),
      "foobar",
      `ident.tokenLiteral not foobar, got=${ident.tokenLiteral()}`
    );
  });

  it("integer literal", () => {
    const input = `5;`;
    const program = testParse(input);

    assert.equal(
      program.statements.length,
      1,
      `program has not enough statement. got=${program.statements.length}`
    );
    const stmt = program.statements[0] as ast.ExpressionStatement;
    const literal = stmt.expression as ast.IntegerLiteral;
    assert.equal(literal.value, 5, `ident.value not 5, got=${literal.value}`);
    assert.equal(
      literal.tokenLiteral(),
      "5",
      `ident.tokenLiteral not 5, got=${literal.tokenLiteral()}`
    );
  });

  it("string literal", () => {
    const input = `"hello world"`;
    const program = testParse(input);
    const stmt = program.statements[0] as ast.ExpressionStatement;
    const literal = stmt.expression as ast.StringLiteral;
    assert.equal(
      literal,
      "hello world",
      `literal.Value not "hello world". got=${literal.value}`
    );
  });

  it("array literal", () => {
    const program = testParse(`[1, 2 * 2, 3 + 3]`);
    const stmt = program.statements[0] as ast.ExpressionStatement;
    const array = stmt.expression as ast.ArrayLiteral;
    assert.equal(
      array.elements.length,
      3,
      `array.elements.length not 3. got=${array.elements.length}`
    );

    testIntegerLiteral(array.elements[0], 1);
    testInfixExpression(array.elements[1], 2, "*", 2);
    testInfixExpression(array.elements[2], 3, "+", 3);
  });

  it("index expressions", () => {
    const input = `myArray[1 + 1]`;
    const program = testParse(input);
    const stmt = program.statements[0] as ast.ExpressionStatement;
    const indexExp = stmt.expression as ast.IndexExpression;
    testIdentifier(indexExp.left, "myArray");
    testInfixExpression(indexExp.index, 1, "+", 1);
  });

  it("prefix expression", () => {
    const tests = [
      { input: "!5;", operator: "!", expected: 5 },
      { input: "-15;", operator: "-", expected: 15 },
      { input: "!true;", operator: "!", expected: true },
      { input: "!false;", operator: "!", expected: false }
    ];

    tests.forEach(tt => {
      const program = testParse(tt.input);
      assert.equal(
        program.statements.length,
        1,
        `program has not enough statement. got=${program.statements.length}`
      );
      const stmt = program.statements[0] as ast.ExpressionStatement;
      const exp = stmt.expression as ast.PrefixExpression;
      assert.equal(
        exp.operator,
        tt.operator,
        `exp.Operator not '${tt.operator}'. got=${exp.operator}`
      );
      testLiteralExpression(exp.right, tt.expected);
    });
  });

  it("infix expression", () => {
    const tests: {
      input: string;
      leftValue: any;
      operator: string;
      rightValue: any;
    }[] = [
      { input: "5 + 5;", leftValue: 5, operator: "+", rightValue: 5 },
      { input: "5 - 5;", leftValue: 5, operator: "-", rightValue: 5 },
      { input: "5 * 5;", leftValue: 5, operator: "*", rightValue: 5 },
      { input: "5 / 5;", leftValue: 5, operator: "/", rightValue: 5 },
      { input: "5 > 5;", leftValue: 5, operator: ">", rightValue: 5 },
      { input: "5 < 5;", leftValue: 5, operator: "<", rightValue: 5 },
      { input: "5 == 5;", leftValue: 5, operator: "==", rightValue: 5 },
      { input: "5 != 5;", leftValue: 5, operator: "!=", rightValue: 5 },
      {
        input: "true == true;",
        leftValue: true,
        operator: "==",
        rightValue: true
      },
      {
        input: "false != true;",
        leftValue: false,
        operator: "!=",
        rightValue: true
      }
    ];

    tests.forEach(tt => {
      const program = testParse(tt.input);
      assert.equal(
        program.statements.length,
        1,
        `program has not enough statement. got=${program.statements.length}`
      );
      const stmt = program.statements[0] as ast.ExpressionStatement;
      const exp = stmt.expression as ast.InfixExpression;
      testLiteralExpression(exp.left, tt.leftValue);
      assert.equal(
        exp.operator,
        tt.operator,
        `exp.Operator not '${tt.operator}'. got=${exp.operator}`
      );
      testLiteralExpression(exp.right, tt.rightValue);
    });
  });

  it("operator precedence", () => {
    const tests: {
      input: string;
      expected: string;
    }[] = [
      { input: "-a * b", expected: "((-a) * b)" },
      { input: "!-a", expected: "(!(-a))" },
      { input: "a + b + c", expected: "((a + b) + c)" },
      { input: "a + b / c", expected: "(a + (b / c))" },
      {
        input: "a + b * c + d / e - f",
        expected: "(((a + (b * c)) + (d / e)) - f)"
      },
      { input: "3 + 4; -5 * 5", expected: "(3 + 4)((-5) * 5)" },
      { input: "5 > 4 == 3 < 4", expected: "((5 > 4) == (3 < 4))" },
      { input: "true", expected: "true" },
      { input: "false", expected: "false" },
      { input: "3 > 5 == false", expected: "((3 > 5) == false)" },
      { input: "3 < 5 == true", expected: "((3 < 5) == true)" },
      { input: "1 + (2 + 3) + 4", expected: "((1 + (2 + 3)) + 4)" },
      { input: "(5 + 5) * 2", expected: "((5 + 5) * 2)" },
      { input: "-(5 + 5)", expected: "(-(5 + 5))" },
      { input: "!(true == false)", expected: "(!(true == false))" },
      { input: "a + add(b * c) + d", expected: "((a + add((b * c))) + d)" },
      {
        input: "add(a / b, 1 + 2 * 3, 3 + add(3 + 4))",
        expected: "add((a / b), (1 + (2 * 3)), (3 + add((3 + 4))))"
      },
      {
        input: "a * [1, 2, 3, 4][b * c] * d",
        expected: "((a * ([1, 2, 3, 4][(b * c)])) * d)"
      },
      {
        input: "add(a * b[2], b[1], 2 * [1, 2][1])",
        expected: "add((a * (b[2])), (b[1]), (2 * ([1, 2][1])))"
      }
    ];

    tests.forEach(tt => {
      const program = testParse(tt.input);
      const actual = program.toString();
      assert.equal(actual, tt.expected);
    });
  });

  it("if expression", () => {
    const input = `if (x < y) { x }`;
    const program = testParse(input);
    assert.equal(program.statements.length, 1);

    const stmt = program.statements[0] as ast.ExpressionStatement;
    const exp = stmt.expression as ast.IfExpression;
    testInfixExpression(exp.condition, "x", "<", "y");
    assert.equal(exp.consequence.statements.length, 1);
    const consequence = exp.consequence
      .statements[0] as ast.ExpressionStatement;
    testIdentifier(consequence.expression, "x");
    assert.equal(exp.alternative, null);
  });

  it("function literal", () => {
    const input = `fn(x, y) { x + y; }`;
    const program = testParse(input);
    assert.equal(program.statements.length, 1);
    const stmt = program.statements[0] as ast.ExpressionStatement;
    const func = stmt.expression as ast.FunctionLiteral;
    assert.equal(func.parameters.length, 2);
    testIdentifier(func.parameters[0], "x");
    testIdentifier(func.parameters[1], "y");

    const bodyStmt = func.body.statements[0] as ast.ExpressionStatement;
    testInfixExpression(bodyStmt.expression, "x", "+", "y");
  });

  it("call expression", () => {
    const input = `add(1, 2 + 3, 4 + 5)`;
    const program = testParse(input);
    assert.equal(program.statements.length, 1);
    const stmt = program.statements[0] as ast.ExpressionStatement;
    const exp = stmt.expression as ast.CallExpression;
    testIdentifier(exp.function, "add");
    assert.equal(exp.arguments.length, 3);
    testLiteralExpression(exp.arguments[0], 1);
    testInfixExpression(exp.arguments[1], "2", "+", "3");
    testInfixExpression(exp.arguments[2], "4", "+", "5");
  });

  it("call expression parameters", () => {
    const input = `add()`;
    const program = testParse(input);
    assert.equal(program.statements.length, 1);
    const stmt = program.statements[0] as ast.ExpressionStatement;
    const exp = stmt.expression as ast.CallExpression;
    testIdentifier(exp.function, "add");
    assert.equal(exp.arguments.length, 0);
  });
});

function testLetStatement(s: ast.Statement, name: string) {
  assert.equal(
    s.tokenLiteral(),
    "let",
    `s.tokenLiteral not 'let', got=${s.tokenLiteral()}`
  );
  const letStmt = s as ast.LetStatement;
  assert.equal(
    letStmt.name.value,
    name,
    `letStmt.name.value not '${name}'. got=${letStmt.name.value}`
  );
  assert.equal(
    letStmt.name.tokenLiteral(),
    name,
    `letStmt.tokenLiteral not '${name}'. got=${letStmt.name.tokenLiteral()}`
  );
}

function testLiteralExpression(exp: ast.Expression, expected: any) {
  // Memo:
  // testBoolean, testIntegerLiteral等は値を返さないが
  // breakを書くのが煩わしいためにreturnしている
  switch (typeof expected) {
    case "boolean":
      return testBoolean(exp, expected);
    case "number":
      return testIntegerLiteral(exp, expected);
    case "string":
      return testIdentifier(exp, expected);
  }
}

function testIntegerLiteral(i: ast.Expression, value: number) {
  const integ = i as ast.IntegerLiteral;
  assert.equal(
    integ.value,
    value,
    `integ.Value not ${value}. got=${integ.value}`
  );
  assert.equal(
    integ.tokenLiteral(),
    value.toString(10),
    `integ.tokenLiteral not ${value.toString(10)}. got=${integ.tokenLiteral()}`
  );
}

function testIdentifier(exp: ast.Expression, value: string) {
  const ident = exp as ast.Identifier;
  assert.equal(
    ident.value,
    value,
    `ident.Value not ${value}. got=${ident.value}`
  );
  assert.equal(
    ident.tokenLiteral(),
    value,
    `ident.tokenLiteral not ${value}. got=${ident.tokenLiteral()}`
  );
}

function testBoolean(exp: ast.Expression, value: boolean) {
  const bo = exp as ast.Boolean;
  assert.equal(bo.value, value, `bo.Value not ${value}. got=${bo.value}`);
  assert.equal(bo.tokenLiteral(), value.toString());
}

function testInfixExpression(
  exp: ast.Expression,
  left: any,
  operator: string,
  right: any
) {
  const opExp = exp as ast.InfixExpression;
  testLiteralExpression(opExp.left, left);
  assert.equal(
    opExp.operator,
    operator,
    `opExp.operator not ${operator}. got=${opExp.operator}`
  );
  testLiteralExpression(opExp.right, right);
}

function testParse(input: string): ast.Program {
  const l = Lexer.of(input);
  const p = Parser.of(l);
  const program = p.parseProgram();
  checkParserErrors(p);
  return program;
}

function checkParserErrors(p: Parser) {
  const errors = p.getErrors();
  if (errors.length === 0) {
    return;
  }

  console.error(`Parser has ${errors.length} errors`);
  errors.forEach(e => {
    console.error(e);
  });

  assert.fail();
}
