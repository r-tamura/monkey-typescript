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
