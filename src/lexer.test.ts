import { TokenType, Tokens } from "./token";
import Lexer from "./lexer";
import * as assert from "power-assert";

describe("Lexer", () => {
  const input = `=+(){},;`;

  const tests: Array<{ expectedType: TokenType; expectedLiteral: string }> = [
    { expectedType: Tokens.ASSIGN, expectedLiteral: "=" },
    { expectedType: Tokens.PLUS, expectedLiteral: "+" },
    { expectedType: Tokens.LPAREN, expectedLiteral: "(" },
    { expectedType: Tokens.RPAREN, expectedLiteral: ")" },
    { expectedType: Tokens.LBRACE, expectedLiteral: "{" },
    { expectedType: Tokens.RBRACE, expectedLiteral: "}" },
    { expectedType: Tokens.COMMA, expectedLiteral: "," },
    { expectedType: Tokens.SEMICOLON, expectedLiteral: ";" }
  ];

  const l = Lexer.of(input);

  tests.forEach((tt, i) => {
    const tok = l.nextToken();

    assert(
      tok.type === tt.expectedType,
      `tests[${i}] - tokentype wrong. expected=${tt.expectedType}, got=${
        tok.type
      }`
    );
    assert(
      tok.literal === tt.expectedLiteral,
      `tests[${i}] - literal worng. expected=${tt.expectedLiteral}, got=${
        tok.literal
      }`
    );
  });
});
