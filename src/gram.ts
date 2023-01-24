import {Lexer, Rule} from "./lexer.js"

export class Gram {
  static readonly lexer = new Lexer([
    Rule.BLANK,
    ['sym', /(['"]).*?\1|\w+/],
    ['|', /\|/],
    ['->', /->/],
  ])

  static parse(src: string) {
    for (const token of Gram.lexer.parse(src)) {
      console.log(token)
    }
  }
}
