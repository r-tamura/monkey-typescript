import { Parser } from "./parser";
import Lexer from "./lexer";
import { Program, Statement, LetStatement } from "./ast";
import assert = require("power-assert");

function testParse(input: string): Program {
  const l = Lexer.of(input);
  const p = Parser.of(l);
  const program = p.parseProgram();
  return program;
}

describe("Parser", () => {
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
});

function testLetStatement(s: Statement, name: string) {
  assert.equal(
    s.tokenLiteral(),
    "let",
    `s.tokenLiteral not 'let', got=${s.tokenLiteral()}`
  );
  const letStmt = s as LetStatement;
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
