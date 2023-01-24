import type {Term} from "./types"

export class Token {
  constructor(
    readonly type: Term,
    readonly raw: string,
  ) {
  }
}

export class Rule {
  static readonly NUM: RulePair = ['num', /\d+/]
  static readonly BLANK: RulePair = ['blank', /\s+/]

  readonly regex: RegExp

  constructor(
    readonly type: Term,
    pat: RegExp,
  ) {
    const regexStr = String(pat)
    const regexBody = regexStr.substring(1, regexStr.length - 1)
    this.regex = RegExp(`^(?:${regexBody})`)
  }
}

export type RulePair = Readonly<[Term, RegExp]>

export class Lexer {
  protected readonly rules: Rule[]

  constructor(
    rules: readonly RulePair[],
    public skipBlanks = true,
  ) {
    this.rules = rules.map(rule => new Rule(...rule))
  }

  * parse(src: string, skipBlanks = this.skipBlanks) {
    for (let i = 0; i < src.length;) {
      let someMatched = false
      for (const {type, regex} of this.rules) {
        const m = src.substring(i).match(regex)
        if (!m) {
          continue
        }
        const [matched] = m
        if (type != Rule.BLANK[0] || !skipBlanks) {
          yield new Token(type, matched)
        }
        i += matched.length
        someMatched = true
        break
      }
      if (!someMatched) {
        throw `unrecognized '${src[i]}' at index ${i}`
      }
    }
    return [] as Token[]
  }
}
