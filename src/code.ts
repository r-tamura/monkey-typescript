type Opcode = number;

enum Opcodes {
  constant = 1
}

class Instructions {
  buf: Buffer;

  constructor(buf) {
    this.buf = buf;
  }

  static of(buf = Buffer.of()): Instructions {
    return new Instructions(buf);
  }

  toString(): string {
    let result = [];
    let i = 0;
    while (i < this.buf.length) {
      const def = lookup(this.buf[i]);

      // [Opcode, operand1, operand2, ...]となっているので
      // i+1でオペランドの配列のみをreadOperandsへ渡す
      const [operands, read] = readOperands(
        def,
        Instructions.of(this.buf.slice(i + 1))
      );
      result.push(
        `${i.toString().padStart(4, "0")} ${this.fmtInstructions(
          def,
          operands as number[]
        )}`
      );
      i += 1 + (read as number);
    }
    return result.join("\n");
  }

  fmtInstructions(def: Definition, operands: number[]): string {
    const count = def.operandWidths.length;

    if (operands.length !== count) {
      return `ERROR: operand len ${
        operands.length
      } does not match defined ${count}\n`;
    }

    switch (count) {
      case 1:
        return `${def.name} ${operands[0]}`;
    }

    return `ERROR: unhandled operand count for ${def.name}\n`;
  }

  static concat(...instructions: Instructions[]) {
    return Instructions.of(
      Buffer.concat([...instructions.map(ins => ins.buf)])
    );
  }

  get length(): number {
    return this.buf.length;
  }

  at(index: number) {
    return this.buf[index];
  }

  slice(from: number) {
    return Instructions.of(this.buf.slice(from));
  }

  forEach(fn) {
    this.buf.forEach(fn);
  }
}

interface Definition {
  name: string;
  operandWidths: number[];
}

const definitions: { [key: number]: Definition } = {
  [Opcodes.constant]: { name: "OpConstant", operandWidths: [2] }
};

function lookup(op: Opcode): Definition {
  const def = definitions[op];
  if (!def) {
    throw new Error(`opcode ${op} undefined`);
  }
  return def;
}

function make(op: Opcode, ...operands: number[]): Instructions {
  const def = definitions[op];
  if (!def) {
    return Instructions.of();
  }

  // Memos: Bufferを追加していく実装のためパフォーマンスに影響がある可能性あり
  // パフォーマンスが悪い場合は, 本と同様の実装に変更する
  return def.operandWidths
    .map((opWidth, i) => {
      switch (opWidth) {
        case 2:
          const b = Buffer.alloc(2, 0x00);
          b.writeUInt16BE(operands[i], 0);
          return Instructions.of(b);
        default:
          return Instructions.of();
      }
    })
    .reduce(
      (buf, operandBuf) => Instructions.concat(buf, operandBuf),
      Instructions.of(Buffer.of(op))
    );
}

function readOperands(
  def: Definition,
  ins: Instructions
): Array<number[] | number> {
  let offset = 0;
  const operands = def.operandWidths
    .map(width => {
      switch (width) {
        case 2:
          const operand = readUInt16(ins, offset);
          offset += width;
          return operand;
      }
    })
    .reduce(
      (acc, v) => {
        acc.push(v);
        return acc;
      },
      [] as number[]
    );

  return [operands, offset];
}

function readUInt16(ins: Instructions, offset: number = 0): number {
  return ins.buf.readUInt16BE(offset);
}

export {
  Instructions,
  Opcode,
  Opcodes,
  Definition,
  definitions,
  lookup,
  make,
  readOperands,
  readUInt16
};
