import * as obj from "./object";
import * as ast from "./ast";
import * as code from "./code";

const ops = code.Opcodes;

interface CompilerProps {
  instructions: code.Instructions;
  constants: obj.Obj[];
}

class Compiler implements CompilerProps {
  instructions: code.Instructions;
  constants: obj.Obj[];

  constructor() {
    // Note: code.InstructionsでNewできないためBuffer型を指定してインスタンス化
    this.instructions = code.Instructions.of() as code.Instructions;
    this.constants = [] as obj.Obj[];
  }

  static of() {
    return new Compiler();
  }

  compile(node: ast.Node): Error {
    switch (node.constructor) {
      case ast.Program:
        const p = node as ast.Program;
        for (const s of p.statements) {
          const err = this.compile(s);
          if (err) {
            return err;
          }
        }
        break;
      case ast.ExpressionStatement:
        const es = node as ast.ExpressionStatement;
        return this.compile(es.expression);
      case ast.InfixExpression:
        const ie = node as ast.InfixExpression;

        let err = this.compile(ie.left);
        if (err) {
          return err;
        }
        err = this.compile(ie.right);
        if (err) {
          return err;
        }
        break;
      case ast.IntegerLiteral:
        const i = node as ast.IntegerLiteral;
        const integer = obj.Integer.of({ value: i.value });
        this.emit(ops.constant, this.addConstant(integer));
        break;
    }
    return null;
  }

  bytecode(): Bytecode {
    return {
      instructions: this.instructions,
      constants: this.constants
    };
  }

  addConstant(obj: obj.Obj): number {
    return this.constants.push(obj) - 1;
  }

  emit(op: code.Opcode, ...operands: number[]): number {
    const ins = code.make(op, ...operands);
    const pos = this.addInstruction(ins);
    return pos;
  }

  addInstruction(ins: code.Instructions): number {
    const posNewInstruction = this.instructions.length;
    this.instructions = code.Instructions.concat(this.instructions, ins);
    return posNewInstruction;
  }
}

// Compilerクラスのプロパティのみ番
interface Bytecode {
  instructions: code.Instructions;
  constants: obj.Obj[];
}

export { Compiler };
