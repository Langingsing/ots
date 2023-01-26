import {Grammar} from "../src/grammar.js"
import {Lexer, Rule} from "../src/lexer.js"
import * as fs from "fs"

const lexer = new Lexer([
  Rule.BLANK,
  ['sym', /(['"]).*?\1|\w+/],
  ['|', /\|/],
  ['->', /->/],
])

const grammar = new Grammar([
  ['gram', [
    ['sym', '->', 'rest'],
  ]],
  ['rest', [
    ['part'],
    ['rest', '->', 'part']
  ]],
  ['part', [
    ['seq'],
    ['part', '|', 'seq'],
  ]],
  ['seq', [
    [],
    ['seq', 'sym'],
  ]],
])
const semanticRules: ((...args: any[]) => any)[] = [
  (firstNT, _, rest) => {
    if (firstNT[0] === '"') {
      firstNT = firstNT.substring(1, firstNT.length - 1)
    }
    rest[0].unshift(firstNT)
    return rest
  },
  (lastRHS) => [[lastRHS]],
  (rest, _, part) => {
    const nt = rest.at(-1).at(-1).at(-1).pop()
    rest.push([nt, part])
    return rest
  },
  (seq) => [seq],
  (part, _, seq) => {
    part.push(seq)
    return part
  },
  () => [],
  (seq, sym) => {
    if (sym[0] === '"') {
      sym = sym.substring(1, sym.length - 1)
    }
    seq.push(sym)
    return seq
  },
]

const tokens = lexer.parse(fs.readFileSync('boost.gram', 'utf8'))
// const symTree = grammar.parse(tokens)

// console.log(symTree.toString())
const ruleEntries = grammar.sSDD(tokens, semanticRules)
console.log(new Grammar(ruleEntries).toString())
