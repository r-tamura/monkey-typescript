import { userInfo } from "os";
import * as repl from "./repl";

function main() {
  process.stdout.write(
    `Hello ${userInfo().username}! This is the Monkey programming language!
    Feel free to type in commands\n`
  );
  repl.start();
}

// When a file is run directly from Node, require.main is set to its module.
// https://stackoverflow.com/questions/4981891/node-js-equivalent-of-pythons-if-name-main
if (require.main === module) {
  main();
}
