import { Token } from "./token";

interface LexerProps {
  input: string;
  position?: number;
  readPosition?: number;
  ch?: Buffer;
}

class Lexer {
  input: string;
  position: number;
  readPosition;
  ch: Buffer;
  constructor({
    input = "",
    position = 0,
    readPosition = 0,
    ch = Buffer.of(0x0)
  }: LexerProps) {
    this.input = input;
    this.position = position;
    this.readPosition = readPosition;
    this.ch = ch;
  }

  public static of(input: string) {
    return new Lexer({ input });
  }

  public nextToken(): Token {
    return null;
  }
}

export default Lexer;
