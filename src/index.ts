import { userInfo } from "os";
import { start } from "./repl";

process.stdout.write(
  `Hello ${userInfo().username}! This is the Monkey programming language!
  Feel free to type in commands\n`
);
start();
