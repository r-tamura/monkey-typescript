import { sum } from "./lexer";
import * as assert from "power-assert";

it("sum", () => {
  assert(sum(20, 22) === 42);
});
