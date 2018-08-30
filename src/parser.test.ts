import { Parser } from "./parser";
import Lexer from "./lexer";
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
    const input = `
    let x = 5;
    let y = 10;
    let foobar = 838383;
    `;
    const program = testParse(input);

    assert.notEqual(program, null, "parseProgram() returned null");
    assert.equal(
      program.statements.length,
      3,
      `program.Statements does not contain 3 statements. got=${
        program.statements.length
      }`
    );

    const tests: { expectedIdentifier: string }[] = [
      { expectedIdentifier: "x" },
      { expectedIdentifier: "y" },
      { expectedIdentifier: "foobar" }
    ];

    tests.forEach((tt, i) => {
      const stmt = program.statements[i];
      testLetStatement(stmt, tt.expectedIdentifier);
    });
  });

  it("return statement", () => {
    const input = `
    return 5;
    return 10;
    return 993322;
    `;
    const program = testParse(input);

    assert.notEqual(program, null, "parseProgram() returned null");
    assert.equal(
      program.statements.length,
      3,
      `program.Statements does not contain 3 statements. got=${
        program.statements.length
      }`
    );

    program.statements.forEach((stmt, i) => {
      const returnStmt = stmt as ast.ReturnStatement;
      assert.equal(
        returnStmt.tokenLiteral(),
        "return",
        `returnStmt.tokenLiteral not 'return', got=${typeof returnStmt}`
      );
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

  it("prefix expression", () => {
    const tests = [
      { input: "!5;", operator: "!", integerValue: 5 },
      { input: "-15;", operator: "-", integerValue: 15 }
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
      testIntegerLiteral(exp.right, tt.integerValue);
    });
  });

  it("infix expression", () => {
    const tests: {
      input: string
      leftValue: number
      operator: string
      rightValue: number
    }[] = [
      {input: "5 + 5;", leftValue: 5, operator: "+", rightValue: 5},
      {input: "5 - 5;", leftValue: 5, operator: "-", rightValue: 5},
      {input: "5 * 5;", leftValue: 5, operator: "*", rightValue: 5},
      {input: "5 / 5;", leftValue: 5, operator: "/", rightValue: 5},
      {input: "5 > 5;", leftValue: 5, operator: ">", rightValue: 5},
      {input: "5 < 5;", leftValue: 5, operator: "<", rightValue: 5},
      {input: "5 == 5;", leftValue: 5, operator: "==", rightValue: 5},
      {input: "5 != 5;", leftValue: 5, operator: "!=", rightValue: 5},
    ]

    tests.forEach(tt => {
      const program = testParse(tt.input)
      assert.equal(
        program.statements.length,
        1,
        `program has not enough statement. got=${program.statements.length}`
      );
      const stmt = program.statements[0] as ast.ExpressionStatement;
      const exp = stmt.expression as ast.InfixExpression;
      testIntegerLiteral(exp.right, tt.leftValue);
      assert.equal(
        exp.operator,
        tt.operator,
        `exp.Operator not '${tt.operator}'. got=${exp.operator}`
      );
      testIntegerLiteral(exp.right, tt.rightValue);
    })
  })
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
