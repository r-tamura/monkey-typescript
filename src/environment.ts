import * as obj from "./object";

function newEnclosedEnvironment(outer: Environment): Environment {
  const env = newEnvironment();
  env.outer = outer;
  return env;
}

function newEnvironment(): Environment {
  const store = new Map();
  return Environment.of({ store, outer: null });
}

class Environment {
  store: Map<string, obj.Obj>;
  outer: Environment;

  static of({
    store,
    outer
  }: {
    store: Map<string, obj.Obj>;
    outer: Environment;
  }) {
    const env = new Environment();
    env.store = store;
    env.outer = outer;
    return env;
  }

  get(name: string): obj.Obj {
    return this.store.has(name)
      ? this.store.get(name)
      : this.outer !== null
        ? this.outer.get(name) || null
        : null;
  }

  set(name: string, value: obj.Obj) {
    this.store.set(name, value);
    return name;
  }
}

export { newEnvironment, newEnclosedEnvironment, Environment };
