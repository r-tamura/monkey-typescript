import * as obj from "./object";
import * as ast from "./ast";
import { Parser } from "./parser";
import { Lexer } from "./lexer";
import { Compiler } from "./compiler";
import { VM } from "./vm";

interface VmTestCase {
  input: string;
  expected: any;
}

describe("VM", () => {
  it("integer arithmetic", () => {
    const tests: VmTestCase[] = [
      { input: "1", expected: 1 },
      { input: "2", expected: 2 },
      { input: "1 + 2", expected: 3 }
    ];
    runVmTests(tests);
  });
});

function runVmTests(tests: VmTestCase[]) {
  tests.forEach(tt => {
    const program = parse(tt.input);
    const comp = Compiler.of();
    let err = comp.compile(program);
    if (err) {
      throw new Error(`compiler error: ${err}`);
    }

    const vm = VM.of(comp.bytecode());
    err = vm.run();
    if (err) {
      throw new Error(`vm error: ${err}`);
    }
    const stackElem = vm.stackTop();
    testExpectedObject(tt.expected, stackElem);
  });
}

function testExpectedObject(expected: any, actual: obj.Obj) {
  switch (typeof expected) {
    case "number":
      const err = testIntegerObject(expected, actual);
      if (err) {
        throw new Error(`testIntegerObject failed: ${err}`);
      }
  }
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
