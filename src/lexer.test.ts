import { TokenType, Tokens } from "./token";
import Lexer from "./lexer";
import * as assert from "power-assert";

describe("Lexer", () => {
  it("Lexer#nextToken", () => {
    const input = `let five = 5;
    let ten = 10;
    let add = fn(x, y) {
      x + y;
    };
    let result = add(five, ten);
    `;

    const tests: Array<{ expectedType: TokenType; expectedLiteral: string }> = [
      { expectedType: Tokens.LET, expectedLiteral: "let" },
      { expectedType: Tokens.IDENT, expectedLiteral: "five" },
      { expectedType: Tokens.ASSIGN, expectedLiteral: "=" },
      { expectedType: Tokens.INT, expectedLiteral: "5" },
      { expectedType: Tokens.SEMICOLON, expectedLiteral: ";" },

      { expectedType: Tokens.LET, expectedLiteral: "let" },
      { expectedType: Tokens.IDENT, expectedLiteral: "ten" },
      { expectedType: Tokens.ASSIGN, expectedLiteral: "=" },
      { expectedType: Tokens.INT, expectedLiteral: "10" },
      { expectedType: Tokens.SEMICOLON, expectedLiteral: ";" },

      { expectedType: Tokens.LET, expectedLiteral: "let" },
      { expectedType: Tokens.IDENT, expectedLiteral: "add" },
      { expectedType: Tokens.ASSIGN, expectedLiteral: "=" },
      { expectedType: Tokens.FUNCTION, expectedLiteral: "fn" },
      { expectedType: Tokens.LPAREN, expectedLiteral: "(" },
      { expectedType: Tokens.IDENT, expectedLiteral: "x" },
      { expectedType: Tokens.COMMA, expectedLiteral: "," },
      { expectedType: Tokens.IDENT, expectedLiteral: "y" },
      { expectedType: Tokens.RPAREN, expectedLiteral: ")" },
      { expectedType: Tokens.LBRACE, expectedLiteral: "{" },
      { expectedType: Tokens.IDENT, expectedLiteral: "x" },
      { expectedType: Tokens.PLUS, expectedLiteral: "+" },
      { expectedType: Tokens.IDENT, expectedLiteral: "y" },
      { expectedType: Tokens.SEMICOLON, expectedLiteral: ";" },
      { expectedType: Tokens.RBRACE, expectedLiteral: "}" },
      { expectedType: Tokens.SEMICOLON, expectedLiteral: ";" },

      { expectedType: Tokens.LET, expectedLiteral: "let" },
      { expectedType: Tokens.IDENT, expectedLiteral: "result" },
      { expectedType: Tokens.ASSIGN, expectedLiteral: "=" },
      { expectedType: Tokens.IDENT, expectedLiteral: "add" },
      { expectedType: Tokens.LPAREN, expectedLiteral: "(" },
      { expectedType: Tokens.IDENT, expectedLiteral: "five" },
      { expectedType: Tokens.COMMA, expectedLiteral: "," },
      { expectedType: Tokens.IDENT, expectedLiteral: "ten" },
      { expectedType: Tokens.RPAREN, expectedLiteral: ")" },
      { expectedType: Tokens.SEMICOLON, expectedLiteral: ";" },

      { expectedType: Tokens.EOF, expectedLiteral: "" }
    ];

    const l = Lexer.of(input);

    tests.forEach((tt, i) => {
      const tok = l.nextToken();

      assert.equal(
        tok.type,
        tt.expectedType,
        `tests[${i}] - tokentype wrong. expected=${tt.expectedType}, got=${
          tok.type
        }`
      );
      assert.equal(
        tok.literal,
        tt.expectedLiteral,
        `tests[${i}] - literal worng. expected=${tt.expectedLiteral}, got=${
          tok.literal
        }`
      );
    });
  });
});
