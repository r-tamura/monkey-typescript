import { Identifier, BlockStatement } from "./ast";
import { Environment } from "./environment";

type ObjectType = string;

enum ObjTypes {
  INTEGER = "INTEGER",
  BOOLEAN = "BOOLEAN",
  NULL = "NULL",
  RETURN_VALUE = "RETURN_VALUE",
  ERROR = "ERROR",
  FUNCTION = "FUNCTION"
}

// JavaScriptでObject型が既に定義されているためObjとする
interface Obj {
  type(): ObjectType;
  inspect(): string;
}

class Integer implements Obj {
  value: number;

  static of({ value }: { value: number }) {
    const i = new Integer();
    i.value = value;
    return i;
  }

  type(): ObjectType {
    return ObjTypes.INTEGER;
  }
  inspect(): string {
    return this.value.toString(10);
  }
}

class Boolean implements Obj {
  value: boolean;

  static of({ value }: { value: boolean }) {
    const b = new Boolean();
    b.value = value;
    return b;
  }

  type(): ObjectType {
    return ObjTypes.BOOLEAN;
  }
  inspect(): string {
    return this.value.toString();
  }
}

class Null implements Obj {
  static of() {
    return new Null();
  }
  type(): ObjectType {
    return ObjTypes.NULL;
  }
  inspect(): string {
    return "null";
  }
}

class ReturnValue implements Obj {
  value: Obj;
  static of({ value }: { value: Obj }) {
    const returnValue = new ReturnValue();
    returnValue.value = value;
    return returnValue;
  }

  type(): ObjTypes {
    return ObjTypes.RETURN_VALUE;
  }
  inspect(): string {
    return this.value.inspect();
  }
}

// JavaScriptでError型が既に定義されているためErrとする
class Err implements Obj {
  message: string;
  static of({ message }: { message: string }) {
    const err = new Err();
    err.message = message;
    return err;
  }
  type(): ObjectType {
    return ObjTypes.ERROR;
  }
  inspect(): string {
    return `ERROR: ${this.message}`;
  }
}

// JavaScriptでFunction型が既に定義されているためFuncとする
class Func implements Obj {
  parameters: Identifier[];
  body: BlockStatement;
  env: Environment;

  static of({
    parameters,
    body,
    env
  }: {
    parameters: Identifier[];
    body: BlockStatement;
    env: Environment;
  }) {
    const fn = new Func();
    fn.parameters = parameters;
    fn.body = body;
    fn.env = env;
    return fn;
  }

  type(): ObjectType {
    return ObjTypes.FUNCTION;
  }
  inspect(): string {
    const params = this.parameters.map(v => v.toString()).join(", ");
    return "fn(" + params + ") {\n" + this.body.toString() + "\n}";
  }
}

export { ObjTypes, Obj, Integer, Boolean, Null, ReturnValue, Err, Func };
