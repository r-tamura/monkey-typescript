import assert = require("power-assert");
import * as obj from "./object";
import { Parser } from "./parser";
import { Lexer } from "./lexer";
import { evaluate } from "./evaluator";

describe("Evaluator", () => {
  it("integer", () => {
    const tests: {
      input: string;
      expected: number;
    }[] = [{ input: "5", expected: 5 }, { input: "10", expected: 10 }];

    tests.forEach(tt => {
      const evaluated = testEval(tt.input);
      testIntegerObject(evaluated, tt.expected);
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
