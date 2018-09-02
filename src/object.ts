type ObjectType = string;

enum ObjTypes {
  INTEGER = "INTEGER",
  BOOLEAN = "BOOLEAN",
  NULL = "NULL",
  RETURN_VALUE = "RETURN_VALUE"
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

export { ObjTypes, Obj, Integer, Boolean, Null, ReturnValue };
