import assert = require("power-assert");
import * as obj from "./object";
import { Parser } from "./parser";
import { Lexer } from "./lexer";
import { evaluate, NULL } from "./evaluator";
import { newEnvironment } from "./environment";

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

  it("string", () => {
    const input = `"Hello World!"`;

    const evaluated = testEval(input);
    const str = evaluated as obj.Str;
    assert.equal(
      str.value,
      "Hello World!",
      `Sting has wrong value. got=${str}`
    );
  });

  it("string concatenation", () => {
    const evaluated = testEval(`"Hello" + " " + "World!"`);
    const str = evaluated as obj.Str;
    assert.equal(
      str.value,
      "Hello World!",
      `String has wrong value. got=${str.value}`
    );
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

  it("return statements", () => {
    const tests: Test[] = [
      { input: "return 10;", expected: 10 },
      { input: "return 10; 9;", expected: 10 },
      { input: "return 2 * 5; 9;", expected: 10 },
      { input: "9; return 2 * 5; 9;", expected: 10 },
      {
        input: `
          if (10 > 1) {
            if (10 > 1) {
              return 10;
            }
          }
          return 1;
        `,
        expected: 10
      }
    ];

    tests.forEach(tt => {
      testIntegerObject(testEval(tt.input), tt.expected);
    });
  });

  it("error handling", () => {
    const tests: Test[] = [
      {
        input: "5 + true;",
        expected: "type mismatch: INTEGER + BOOLEAN"
      },
      {
        input: "5 + true; 5;",
        expected: "type mismatch: INTEGER + BOOLEAN"
      },
      {
        input: "-true",
        expected: "unknown operator: -BOOLEAN"
      },
      {
        input: "true + false",
        expected: "unknown operator: BOOLEAN + BOOLEAN"
      },
      {
        input: `
        if (10 > 1) {
          if (10 > 1) {
            return true + false;
          }

          return 1;
        }
        `,
        expected: "unknown operator: BOOLEAN + BOOLEAN"
      },
      {
        input: "foobar;",
        expected: "identifier not found: foobar"
      },
      {
        input: `"Hello" - "World"`,
        expected: "unknown operator: STRING - STRING"
      }
    ];

    tests.forEach(tt => {
      const evaluated = testEval(tt.input);
      const err = evaluated as obj.Err;
      assert.equal(err.message, tt.expected);
    });
  });

  it("let statements", () => {
    const tests: Test[] = [
      { input: "let a = 5; a;", expected: 5 },
      { input: "let a = 5 * 5; a;", expected: 25 },
      { input: "let a = 5; let b = a; b;", expected: 5 },
      { input: "let a = 5; let b = a; let c = a + b + 5; c;", expected: 15 }
    ];
    tests.forEach(tt => {
      testIntegerObject(testEval(tt.input), tt.expected);
    });
  });

  it("function", () => {
    const input = `fn(x) { x + 2; }`;
    const evaluated = testEval(input);
    const fn = evaluated as obj.Func;

    assert.equal(fn.parameters.length, 1);
    assert.equal(fn.parameters[0], "x");
    assert.equal(fn.body.toString(), "(x + 2)");
  });

  it("function application", () => {
    const tests: Test[] = [
      { input: "let identity = fn(x) { x; }; identity(5);", expected: 5 },
      {
        input: "let identity = fn(x) { return x; }; identity(5);",
        expected: 5
      },
      { input: "let double = fn(x) { x * 2; }; double(5);", expected: 10 },
      { input: "let add = fn(x, y) { x + y; }; add(5, 5);", expected: 10 },
      {
        input: "let add = fn(x, y) { x + y; }; add(5 + 5, add(5, 5));",
        expected: 20
      },
      { input: "fn(x) { x; }(5);", expected: 5 }
    ];

    tests.forEach(tt => {
      const evaluated = testEval(tt.input);
      testIntegerObject(evaluated, tt.expected);
    });
  });

  it("builtin functions", () => {
    const tests: Test[] = [
      { input: `len("")`, expected: 0 },
      { input: `len("four")`, expected: 4 },
      { input: `len("hello world")`, expected: 11 },
      {
        input: `len(1)`,
        expected: `argument to 'len' not supported, got INTEGER`
      },
      {
        input: `len("one", "two")`,
        expected: `wrong number of arguments. got=2, want=1`
      }
    ];
    tests.forEach(tt => {
      const evaluated = testEval(tt.input);
      if (typeof tt.expected === "number") {
        testIntegerObject(evaluated, tt.expected as number);
      } else {
        const err = evaluated as obj.Err;
        assert.equal(
          err.message,
          tt.expected,
          `wrong error message. expected=${tt.expected}, got=${err.message}`
        );
      }
    });
  });
});

function testEval(input: string): obj.Obj {
  const env = newEnvironment();
  const l = Lexer.of(input);
  const p = Parser.of(l);
  const program = p.parseProgram();
  return evaluate(program, env);
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
