import * as util from "util";
import * as obj from "./object";
import { NULL } from "./evaluator";

const builtins: {
  name: string;
  builtin: obj.Builtin;
}[] = [
  {
    name: "len",
    builtin: obj.Builtin.of({
      fn: (...args: obj.Obj[]): obj.Obj => {
        if (args.length != 1) {
          return newError(
            `wrong number of arguments. got=${args.length}, want=1`
          );
        }
        switch (args[0].constructor) {
          case obj.Str:
            return obj.Integer.of({ value: (args[0] as obj.Str).value.length });
          case obj.Arr:
            return obj.Integer.of({
              value: (args[0] as obj.Arr).elements.length
            });
          default:
            return newError(
              `argument to 'len' not supported, got ${args[0].type()}`
            );
        }
      }
    })
  },
  {
    name: "first",
    builtin: obj.Builtin.of({
      fn: (...args: obj.Obj[]): obj.Obj => {
        if (args.length != 1) {
          return newError(
            "wrong number of arguments. got=%d, want=1",
            args.length
          );
        }
        if (args[0].type() !== obj.ObjTypes.ARRAY) {
          return newError(
            "argument to `first` must be ARRAY, got %s",
            args[0].type()
          );
        }

        const arr = args[0] as obj.Arr;
        const length = arr.elements.length;
        if (length > 0) {
          return arr.elements[0];
        }
        return NULL;
      }
    })
  },
  {
    name: "last",
    builtin: obj.Builtin.of({
      fn: (...args: obj.Obj[]): obj.Obj => {
        if (args.length != 1) {
          return newError(
            "wrong number of arguments. got=%d, want=1",
            args.length
          );
        }
        if (args[0].type() !== obj.ObjTypes.ARRAY) {
          return newError(
            "argument to `last` must be ARRAY, got %s",
            args[0].type()
          );
        }
        const arr = args[0] as obj.Arr;
        const length = arr.elements.length;
        if (length > 0) {
          return arr.elements[length - 1];
        }
        return NULL;
      }
    })
  },
  {
    name: "rest",
    builtin: obj.Builtin.of({
      fn: (...args: obj.Obj[]): obj.Obj => {
        if (args.length != 1) {
          return newError(
            "wrong number of arguments. got=%d, want=1",
            args.length
          );
        }
        if (args[0].type() !== obj.ObjTypes.ARRAY) {
          return newError(
            "argument to `rest` must be ARRAY, got %s",
            args[0].type()
          );
        }

        const arr = args[0] as obj.Arr;
        const length = arr.elements.length;
        if (length > 0) {
          const [_, ...res] = arr.elements;
          return obj.Arr.of({ elements: res });
        }
        return NULL;
      }
    })
  },
  {
    name: "push",
    builtin: obj.Builtin.of({
      fn: (...args: obj.Obj[]): obj.Obj => {
        if (args.length != 2) {
          return newError(
            "wrong number of arguments. got=%d, want=2",
            args.length
          );
        }
        if (args[0].type() !== obj.ObjTypes.ARRAY) {
          return newError(
            "argument to `rest` must be ARRAY, got %s",
            args[0].type()
          );
        }

        const arr = args[0] as obj.Arr;
        const res = [...arr.elements, args[1]];
        return obj.Arr.of({ elements: res });
      }
    })
  },
  {
    name: "puts",
    builtin: obj.Builtin.of({
      fn: (...args: obj.Obj[]): obj.Obj => {
        args.forEach(arg => console.log(arg.inspect()));
        return NULL;
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
