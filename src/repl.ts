/**
 * A REPL implementation of monkey language in TypeScript
 */
import * as readline from "readline";
import { Lexer } from "./lexer";
import { Parser } from "./parser";
import { Writable, Readable } from "stream";
import { evaluate } from "./evaluator";
import { newEnvironment } from "./environment";

const PROMPT = ">> ";
// https://nodejs.org/api/readline.html#readline_example_tiny_cli
function start(input: Readable, output: Writable) {
  const env = newEnvironment();
  const exit = () => {
    console.log("\nREPL exit");
    process.exit(0);
  };

  readline
    .createInterface({
      input: input,
      output: output,
      prompt: PROMPT
    })
    .on("line", function(line) {
      const l = Lexer.of(line);
      const p = Parser.of(l);
      const program = p.parseProgram();

      if (p.getErrors().length > 0) {
        printErrors(output, p.getErrors());
        this.prompt();
        return;
      }

      const evaluated = evaluate(program, env);
      if (evaluated) {
        output.write(evaluated.inspect() + "\n");
      }

      this.prompt();
    })
    .on("SIGINT", exit)
    .on("close", exit)
    .prompt();
}

function printErrors(output: Writable, errors: string[]) {
  output.write("Woops! We ran into some monkey business here!\n");
  output.write(" parser errors:\n");
  errors.forEach(e => output.write("\t" + e + "\n"));
}

export { start };
