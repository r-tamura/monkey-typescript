import * as util from "util";
import * as obj from "./object";

const builtins: {
  name: string;
  builtin: obj.Builtin;
}[] = [
  {
    name: "len",
    builtin: obj.Builtin.of({
      fn: (...args: any): obj.Obj => {
        if (args.length != 1) {
          return newError(
            `wrong number of arguments. got=${args.length}, want=1`
          );
        }

        if (args[0] instanceof obj.Str) {
          return obj.Integer.of({ value: args[0].value.length });
        }

        return newError(
          `argument to 'len' not supported, got ${args[0].type()}`
        );
      }
    })
  }
];

function getBuiltinByName(name: string): obj.Builtin {
  for (const b of builtins) {
    if (b.name === name) {
      return b.builtin;
    }
  }
  return null;
}

function newError(format: string, ...a: any[]): obj.Err {
  return obj.Err.of({ message: util.format(format, ...a) });
}

export { getBuiltinByName };
