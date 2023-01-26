import {Lexer, Rule} from "./lexer.js"
import type {NT, Sym} from "./types"

export class Gram {
  static readonly lexer = new Lexer([
    Rule.BLANK,
    ['sym', /(['"]).*?\1|\w+/],
    ['|', /\|/],
    ['->', /->/],
  ])

  static parse(src: string) {
    const rules: [NT, Sym[][]][] = []
    let nt: NT | undefined
    let seq: Sym[] = []
    let rhs: Sym[][] = []
    for (const token of Gram.lexer.parse(src)) {
      const {raw} = token
      switch (token.type) {
        case 'sym':
          if (nt === undefined) {
            nt = raw
          } else {
            seq.push(raw)
          }
          break
        case '|':
          rhs.push(seq)
          seq = []
          break
        case '->':
          rules.push([nt!, rhs])
          nt = seq.pop()
          seq = []
          rhs = []
          break
      }
    }
    rules.push([nt!, rhs])
    return rules
  }
}
