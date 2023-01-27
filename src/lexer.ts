import type {Term} from "./types"

export class Token<Raw = string> {
  constructor(
    readonly type: Term,
    readonly raw: Raw,
  ) {
  }
}

export type ReadonlyRule<Raw = string> = Omit<Rule<Raw>, 'rename'>

export class Rule<Raw = string> {
  static readonly ID: ReadonlyRule = new Rule('id', /[\w$]+/)
  static readonly DIGITS: ReadonlyRule = new Rule('digits', /\d+/)
  static readonly NUMBER: ReadonlyRule = new Rule('number', /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[Ee][+-]?\d+)?/)
  static readonly BLANK: ReadonlyRule = new Rule('blank', /\s+/, undefined, true)
  static readonly DOUBLE_QUOTED_STRING: ReadonlyRule = new Rule(
    'doubleQuotedString',
    /"(?:[^\\"]|\\.)*"/,
    Rule.dropOneBothEnd
  )
  static readonly SINGLE_QUOTED_STRING: ReadonlyRule = new Rule(
    'singleQuotedString',
    /'(?:[^\\']|\\.)*'/,
    Rule.dropOneBothEnd
  )
  static readonly STRING: ReadonlyRule = new Rule(
    'string',
    /(?<quote>['"])(?:[^\\]|\\.)*?\k<quote>/,
    Rule.dropOneBothEnd
  )

  private static dropOneBothEnd(matched: string) {
    return matched.substring(1, matched.length - 1)
  }

  static escapeRegexChars(str: string) {
    return str.replace(/(?=[\\.()\[\]{}?+*|$^/])/g, '\\')
  }

  readonly regex: RegExp
  type: Term

  constructor(
    type: Term,
    pat?: RegExp | string,
    mapFn?: ((matched: string) => Raw),
    skip?: boolean,
  )
  constructor(
    rule: Rule<Raw>
  )
  constructor(
    typeOrRule: Term | Rule<Raw>,
    pat?: RegExp | string,
    readonly mapFn: ((matched: string) => Raw) = x => x as any,
    readonly skip = false,
  ) {
    if (typeOrRule instanceof Rule) {
      const {mapFn, regex, skip, type} = typeOrRule
      this.regex = regex
      this.type = type
      this.mapFn = mapFn
      this.skip = skip
    } else {
      this.type = typeOrRule

      let regexBody: string
      let regexFlags = ''
      switch (typeof pat) {
        case "undefined":
          pat = typeOrRule
        /* fall-through */
        case "string":
          regexBody = Rule.escapeRegexChars(pat)
          break
        default:
          const regexStr = String(pat)
          const rightSlashPos = regexStr.lastIndexOf('/')
          regexBody = regexStr.substring(1, rightSlashPos)
          regexFlags = regexStr.substring(rightSlashPos + 1)
          break
      }
      this.regex = RegExp(`^(?:${regexBody})`, regexFlags)
    }
  }

  clone() {
    return new Rule<Raw>(this)
  }

  rename(newType: Term) {
    this.type = newType
    return this
  }

  renameNew(newType: Term) {
    return this.clone().rename(newType)
  }

  source() {
    const regexStr = JSON.stringify(this.regex.source)
    return `{
      type: ${JSON.stringify(this.type)},
      regex: RegExp('${regexStr.substring(1, regexStr.length - 1)}', '${this.regex.flags}'),
      mapFn: ${this.mapFn.toString().replace(/^\w+\s*(?=\()/, 'function ')},
      skip: ${this.skip}
    }`
  }
}

export type RulePair = Readonly<[Term, RegExp]>

export class Lexer<Raw = string> {
  protected readonly rules: ReadonlyRule<Raw>[]

  constructor(
    rules: readonly (Term | RulePair | ReadonlyRule<Raw>)[],
  ) {
    this.rules = rules.map(rule => {
      if (typeof rule === "string") {
        rule = new Rule(rule)
      } else if (Array.isArray(rule)) {
        rule = new Rule(rule[0], rule[1])
      }
      return rule as ReadonlyRule<Raw>
    })
  }

  * parse(src: string) {
    for (let i = 0; i < src.length;) {
      let someMatched = false
      for (const {type, regex, skip, mapFn} of this.rules) {
        const m = src.substring(i).match(regex)
        if (!m) {
          continue
        }
        const [matched] = m
        if (!skip) {
          yield new Token(type, mapFn(matched))
        }
        i += matched.length
        someMatched = true
        break
      }
      if (!someMatched) {
        throw `unrecognized '${src[i]}' at index ${i}`
      }
    }
  }

  source() {
    return `new Lexer([${this.rules.map(rule => rule.source())}])`
  }

  static source() {
    return `class Lexer {
    rules;
    constructor(rules) {
        this.rules = rules
    }
    *parse(src) {
        for (let i = 0; i < src.length;) {
            let someMatched = false;
            for (const { type, regex, skip, mapFn } of this.rules) {
                const m = src.substring(i).match(regex);
                if (!m) {
                    continue;
                }
                const [matched] = m;
                if (!skip) {
                    yield { type, raw: mapFn(matched) };
                }
                i += matched.length;
                someMatched = true;
                break;
            }
            if (!someMatched) {
                throw \`unrecognized '\${src[i]}' at index \${i}\`;
            }
        }
    }
}`
  }
}
