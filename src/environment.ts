import * as obj from "./object";
function newEnvironment(): Environment {
  return new Environment();
}

class Environment {
  store: Map<string, obj.Obj> = new Map();
  get(name: string): obj.Obj {
    return this.store.get(name) || null;
  }

  set(name: string, value: obj.Obj) {
    this.store.set(name, value);
    return name;
  }
}

export { newEnvironment, Environment };
