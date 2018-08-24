/**
 * A REPL implementation of monkey language in TypeScript
 */
import * as readline from "readline";
import Lexer from "./lexer";
import { Tokens } from "./token";

const PROMPT = ">> ";

function start() {
  readline
    .createInterface({
      input: process.stdin,
      output: process.stdout
    })
    .question(PROMPT, input => {
      const l = Lexer.of(input);
      let token;
      while ((token = l.nextToken()).type != Tokens.EOF) {
        console.log("%o", token);
      }
    });
}

export { start };
