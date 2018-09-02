type ObjectType = string;

enum ObjTypes {
  INTEGER = "INTEGER",
  BOOLEAN = "BOOLEAN",
  NULL = "NULL"
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
  type(): ObjectType {
    return ObjTypes.BOOLEAN;
  }
  inspect(): string {
    return this.value.toString();
  }
}

class Null implements Obj {
  type(): ObjectType {
    return ObjTypes.NULL;
  }
  inspect(): string {
    return "null";
  }
}

export { ObjTypes, Obj, Integer, Boolean, Null };
