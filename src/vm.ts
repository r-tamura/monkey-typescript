import * as obj from "./object";
import * as code from "./code";
import { Bytecode } from "./compiler";

const STACK_SIZE = 2048;

const ops = code.Opcodes;

class VM {
  constants: obj.Obj[];
  instructions: code.Instructions;

  stack: obj.Obj[];
  sp: number;

  constructor(bc: Bytecode) {
    this.constants = bc.constants;
    this.instructions = bc.instructions;
    this.stack = [];
    this.sp = 0;
  }

  static of(bc: Bytecode) {
    const vm = new VM(bc);
    return vm;
  }

  run(): Error {
    let err: Error;
    for (let ip = 0; ip < this.instructions.length; ip++) {
      const op = this.instructions.at(ip);
      switch (op) {
        case ops.constant:
          const constIndex = code.readUInt16(this.instructions.slice(ip + 1));
          ip += 2;
          err = this.push(this.constants[constIndex]);
          if (err) {
            return err;
          }
          break;
        case ops.add:
          const r = this.pop();
          const l = this.pop();
          const rv = (r as obj.Integer).value;
          const lv = (l as obj.Integer).value;
          this.push(obj.Integer.of({ value: rv + lv }));
          break;
      }
    }
    return null;
  }

  push(o: obj.Obj): Error {
    if (this.sp >= STACK_SIZE) {
      return new Error(`stack overflow`);
    }
    this.stack[this.sp] = o;
    this.sp++;
    return null;
  }

  pop(): obj.Obj {
    this.sp--;
    return this.stack[this.sp];
  }

  stackTop(): obj.Obj {
    if (this.sp === 0) {
      return null;
    }
    return this.stack[this.sp - 1];
  }
}

export { VM };
