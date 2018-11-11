import { Identifier, BlockStatement } from "./ast";
import { Environment } from "./environment";

type ObjectType = string;

enum ObjTypes {
  INTEGER = "INTEGER",
  BOOLEAN = "BOOLEAN",
  STRING = "STRING",
  NULL = "NULL",
  RETURN_VALUE = "RETURN_VALUE",
  ERROR = "ERROR",
  FUNCTION = "FUNCTION",
  BUILTIN = "BUILTIN",
  ARRAY = "ARRAY",
  HASH = "HASH"
}

// JavaScriptでObject型が既に定義されているためObjとする
interface Obj {
  type(): ObjectType;
  inspect(): string;
}

// Memo:
// JavaScriptではMapのキーがポインタ比較なので
// Primitive型へシリアライズする必要がある
// SerializedHashKey型はJavaScriptのみ特別に用意
const seriarize = function(): SerializedHashKey {
  return `${this.type.toUpperCase()}$$$${this.value}`;
};
type SerializedHashKey = string;
interface HashKey {
  type: ObjectType;
  value: number;
  seriarize: () => string;
}

interface Hashable {
  hashkey: () => HashKey;
}

class Integer implements Obj, Hashable {
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

  hashkey() {
    return {
      type: this.type(),
      value: this.value,
      seriarize
    };
  }
}

// JavaScriptでStringr型が既に定義されているためStrとする
class Str implements Obj, Hashable {
  value: string;

  static of({ value }: { value: string }) {
    const i = new Str();
    i.value = value;
    return i;
  }

  type(): ObjectType {
    return ObjTypes.STRING;
  }
  inspect(): string {
    return this.value;
  }

  hashkey() {
    return {
      type: this.type(),
      value: Buffer.from(this.value).reduce((acc, b) => acc + b),
      seriarize
    };
  }
}

class Boolean implements Obj, Hashable {
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

  hashkey() {
    return {
      type: this.type(),
      value: this.value ? 1 : 0,
      seriarize
    };
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

type BuiltinFunction = (...args: any[]) => Obj;
class Builtin implements Obj {
  fn: BuiltinFunction;

  static of({ fn }: { fn: BuiltinFunction }) {
    const b = new Builtin();
    b.fn = fn;
    return b;
  }

  type(): ObjectType {
    return ObjTypes.BUILTIN;
  }
  inspect(): string {
    return "builtin function";
  }
}
// JavaScriptでArray型が既に定義されているためArrとする
class Arr implements Obj {
  elements: Obj[];

  static of({ elements }: { elements: Obj[] }) {
    const a = new Arr();
    a.elements = elements;
    return a;
  }

  type(): ObjectType {
    return ObjTypes.ARRAY;
  }
  inspect(): string {
    return "[" + this.elements.map(e => e.inspect()).join(",") + "]";
  }
}

// Hashに関して、単純なMap<Object, Object>で実装しないのは
// Go言語のmapの挙動に合わせるため
// Go言語ではHash key比較の際にポインタでの比較が行われるため
// 同じkey値でも参照先が異なる場合はうまくヒットしない
// JavaScriptでは違う参照先の文字列でもヒットするが、
// とりあえず実装は同じように合わせておく
class HashPair {
  key: Obj;
  value: Obj;
}
class Hash implements Obj {
  pairs: Map<SerializedHashKey, HashPair>;

  static of({ pairs }: { pairs: Map<SerializedHashKey, HashPair> }) {
    const h = new Hash();
    h.pairs = pairs;
    return h;
  }

  type(): ObjectType {
    return ObjTypes.HASH;
  }
  inspect(): string {
    const pairs = [];
    for (const [hk, { key, value }] of this.pairs.entries()) {
      pairs.push(`${key.inspect()}: ${value.inspect()}`);
    }
    return "[" + pairs.join(", ") + "]";
  }
}

export {
  ObjTypes,
  Obj,
  Integer,
  Boolean,
  Str,
  Null,
  ReturnValue,
  Err,
  Func,
  Builtin,
  BuiltinFunction,
  Arr,
  Hashable,
  HashKey,
  SerializedHashKey,
  HashPair,
  Hash
};
