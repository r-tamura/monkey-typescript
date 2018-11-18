import * as assert from "power-assert";
import * as code from "./code";

const ops = code.Opcodes;

describe("code", () => {
  it("test make", () => {
    const tests: {
      op: code.Opcode;
      operands: number[];
      expected: Buffer;
    }[] = [
      {
        op: code.Opcodes.constant,
        operands: [65534],
        expected: Buffer.of(ops.constant, 0xff, 0xfe)
      }
    ];

    tests.forEach(tt => {
      const instruction = code.make(tt.op, ...tt.operands);
      assert.equal(
        instruction.length,
        tt.expected.length,
        `instruction has wrong length. want=${tt.expected.length}, got=${
          instruction.length
        }`
      );

      tt.expected.forEach((b, i) => {
        assert.equal(
          instruction.at(i),
          tt.expected[i],
          `wrong byte at pos ${i}. want=${b}, got=${instruction.at(i)}`
        );
      });
    });
  });

  it("instruction string", () => {
    const instructions: code.Instructions[] = [
      code.make(ops.constant, 1),
      code.make(ops.constant, 2),
      code.make(ops.constant, 65535)
    ];

    const expected = `0000 OpConstant 1
0003 OpConstant 2
0006 OpConstant 65535`;
    const concatted = code.Instructions.concat(...instructions);
    assert.equal(
      concatted.toString(),
      expected,
      `instructions wrongly formatted.
    want=${expected}
    got=${concatted.toString()}
    `
    );
  });

  it("read operands", () => {
    const tests: {
      op: code.Opcode;
      operands: number[];
      bytesRead: number;
    }[] = [
      {
        op: code.Opcodes.constant,
        operands: [65535],
        bytesRead: 2
      }
    ];

    tests.forEach(tt => {
      const instruction = code.make(tt.op, ...tt.operands);
      const def = code.lookup(tt.op);
      const [operandsRead, n] = code.readOperands(def, instruction.slice(1));
      assert.equal(n, tt.bytesRead, `n wrong. want=${tt.bytesRead},got=${n}`);

      tt.operands.forEach((want, i) => {
        assert.equal(
          operandsRead[i],
          want,
          `operand wrong. want=${want},got=${operandsRead[i]}`
        );
      });
    });
  });
});
