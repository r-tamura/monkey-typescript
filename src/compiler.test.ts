import * as assert from "power-assert";
import * as code from "./code";
import * as compiler from "./compiler";
import * as ast from "./ast";
import * as obj from "./object";
import { Parser } from "./parser";
import { Lexer } from "./lexer";

const ops = code.Opcodes;

interface CompilerTestCase {
  input: string;
  expectedConstants: any[];
  expectedInstructions: code.Instructions[];
}

describe("Compiler", () => {
  it("integer arithmetric", () => {
    const tests: CompilerTestCase[] = [
      {
        input: "1 + 2",
        expectedConstants: [1, 2],
        expectedInstructions: [
          code.make(ops.constant, 0),
          code.make(ops.constant, 1)
        ]
      }
    ];
    runCompilerTest(tests);
  });
});

function runCompilerTest(tests: CompilerTestCase[]) {
  tests.forEach(tt => {
    const program = parse(tt.input);
    const c = compiler.Compiler.of();
    let err = c.compile(program);
    assert.deepEqual(err, null, `compiler error: ${err}`);

    const bytecode = c.bytecode();
    err = testInstruction(tt.expectedInstructions, bytecode.instructions);
    assert.deepEqual(err, null, `testInstructions failed ${err}`);

    err = testConstants(tt.expectedConstants, bytecode.constants);
    assert.deepEqual(err, null, `testConstants failed: ${err}`);
  });
}

function testInstruction(
  expected: code.Instructions[],
  actual: code.Instructions
) {
  const concatted = concatInstructions(expected);
  if (actual.length !== concatted.length) {
    return new Error(
      `wrong instructions length. want=${concatted.length}, got=${
        actual.length
      }`
    );
  }

  concatted.forEach((ins, i) => {
    if (actual[i] !== ins) {
      return new Error(
        `wrong instruction at ${i} \nwant=${ins}\ngot =${actual}`
      );
    }
  });

  return null;
}

function concatInstructions(s: code.Instructions[]): code.Instructions {
  return s.reduce((acc: code.Instructions, v) =>
    code.Instructions.concat(acc, v)
  );
}

function testConstants(expected: any[], actual: obj.Obj[]): Error {
  if (expected.length !== actual.length) {
    return new Error(
      `wrong number of constants. got=${actual.length}, want=${expected.length}`
    );
  }

  expected.forEach((constant, i) => {
    switch (typeof constant) {
      case "number":
        const err = testIntegerObject(constant as number, actual[i]);
        if (err) {
          return new Error(`constant ${i} - testIntegerObject failed: ${err}`);
        }
    }
  });

  return null;
}

function testIntegerObject(expected: number, actual: obj.Obj): Error {
  const result = actual as obj.Integer;
  if (result.value !== expected) {
    return new Error(
      `object has wrong value. got=${result.value}, want=${actual}`
    );
  }
  return null;
}

function parse(input: string): ast.Program {
  const l = Lexer.of(input);
  const p = Parser.of(l);
  return p.parseProgram();
}
