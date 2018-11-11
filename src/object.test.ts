import assert = require("power-assert");
import * as obj from "./object";

describe("Object", () => {
  it("string hashkey", () => {
    const hello1 = obj.Str.of({ value: "Hello World" });
    const hello2 = obj.Str.of({ value: "Hello World" });
    const diff1 = obj.Str.of({ value: "My name is johnny" });
    const diff2 = obj.Str.of({ value: "My name is johnny" });

    assert.deepEqual(
      hello1.hashkey(),
      hello2.hashkey(),
      "strings with same content have different hash keys"
    );
    assert.deepEqual(
      diff1.hashkey(),
      diff2.hashkey(),
      "strings with same content have different hash keys"
    );
    assert.notDeepEqual(
      hello1.hashkey(),
      diff1.hashkey(),
      "strings with different content have same hash keys"
    );
  });
});
