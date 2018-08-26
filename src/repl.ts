/**
 * A REPL implementation of monkey language in TypeScript
 */
import * as readline from "readline";
import Lexer from "./lexer";
import { Tokens } from "./token";

const PROMPT = ">> ";
// https://nodejs.org/api/readline.html#readline_example_tiny_cli
function start() {
  const exit = () => {
    console.log("\nREPL exit");
    process.exit(0);
  };

  readline
    .createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: PROMPT
    })
    .on("line", function(line) {
      const l = Lexer.of(line);
      let token;
      while ((token = l.nextToken()).type != Tokens.EOF) {
        console.log("%o", token);
      }
      this.prompt();
    })
    .on("SIGINT", exit)
    .on("close", exit)
    .prompt();
}

export { start };
