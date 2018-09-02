import assert = require("power-assert");
import * as obj from "./object";
import { Parser } from "./parser";
import { Lexer } from "./lexer";
import { evaluate, NULL } from "./evaluator";

interface Test {
  input: string;
  expected: any;
}

describe("Evaluator", () => {
  it("integer", () => {
    const tests: Test[] = [
      { input: "5", expected: 5 },
      { input: "10", expected: 10 },
      { input: "-5", expected: -5 },
      { input: "-10", expected: -10 },
      { input: "5 + 5 + 5 + 5 - 10", expected: 10 },
      { input: "2 * 2 * 2 * 2", expected: 16 },
      { input: "-50 + 100 + -50", expected: 0 },
      { input: "50 / 2 * 2 + 10", expected: 60 },
      { input: "(5 + 10 * 2 + 15 / 3) * 2 + -10", expected: 50 }
    ];

    tests.forEach(tt => {
      const evaluated = testEval(tt.input);
      testIntegerObject(evaluated, tt.expected);
    });
  });

  it("boolean", () => {
    const tests: Test[] = [
      { input: "true", expected: true },
      { input: "false", expected: false },
      { input: "5 > 10", expected: false },
      { input: "10 > 5", expected: true },
      { input: "5 < 10", expected: true },
      { input: "5 > 10", expected: false },
      { input: "1 == 1", expected: true },
      { input: "1 != 1", expected: false },
      { input: "true == true", expected: true },
      { input: "false == false", expected: true },
      { input: "true != true", expected: false },
      { input: "false != false", expected: false },
      { input: "(1 > 2) != false", expected: false }
    ];

    tests.forEach(tt => {
      const evaluated = testEval(tt.input);
      testBooleanObject(evaluated, tt.expected);
    });
  });

  it("bang operator", () => {
    const tests: Test[] = [
      { input: "!true", expected: false },
      { input: "!false", expected: true },
      { input: "!5", expected: false },
      { input: "!!true", expected: true }
    ];

    tests.forEach(tt => {
      const evaluated = testEval(tt.input);
      testBooleanObject(evaluated, tt.expected);
    });
  });

  it("if else expressions", () => {
    const tests: Test[] = [
      { input: "if (true) { 10 }", expected: 10 },
      { input: "if (false) { 10 }", expected: null },
      { input: "if (1) { 10 }", expected: 10 },
      { input: "if (1 < 2) { 10 }", expected: 10 },
      { input: "if (1 > 2) { 10 }", expected: null },
      { input: "if (1 > 2) { 10 } else { 20 }", expected: 20 },
      { input: "if (1 < 2) { 10 } else { 20 }", expected: 10 }
    ];

    tests.forEach(tt => {
      const evaluated = testEval(tt.input);
      if (tt.expected === null) {
        testNullObject(evaluated);
      } else {
        testIntegerObject(evaluated, tt.expected);
      }
    });
  });
});

function testEval(input: string): obj.Obj {
  const l = Lexer.of(input);
  const p = Parser.of(l);
  const program = p.parseProgram();
  return evaluate(program);
}

function testIntegerObject(o: obj.Obj, expected: number) {
  const result = o as obj.Integer;
  assert.equal(result.value, expected);
}

function testBooleanObject(o: obj.Obj, expected: boolean) {
  const result = o as obj.Boolean;
  assert.equal(result.value, expected);
}

function testNullObject(o: obj.Obj) {
  assert.equal(o, NULL);
}
