/**
 * A REPL implementation of monkey language in TypeScript
 */
import * as readline from "readline";
import { Lexer } from "./lexer";
import { Parser } from "./parser";
import { Writable } from "stream";

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
      const p = Parser.of(l);
      const program = p.parseProgram();

      if (p.getErrors().length > 0) {
        printErrors(process.stdout, p.getErrors());
        this.prompt();
        return;
      }
      process.stdout.write(program.toString() + "\n");
      this.prompt();
    })
    .on("SIGINT", exit)
    .on("close", exit)
    .prompt();
}

function printErrors(out: Writable, errors: string[]) {
  out.write("Woops! We ran into some monkey business here!\n");
  out.write(" parser errors:\n");
  errors.forEach(e => out.write("\t" + e + "\n"));
}

export { start };
