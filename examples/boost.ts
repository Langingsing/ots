import {Grammar} from "../src/grammar.js"
import {Lexer, Rule} from "../src/lexer.js"
import * as fs from "fs";

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
    ['part', '->', 'rest']
  ]],
  ['part', [
    ['seq'],
    ['seq', '|', 'part'],
  ]],
  ['seq', [
    [],
    ['seq', 'sym'],
  ]],
])
const semanticRules: ((...args: any[]) => any)[] = [
  (firstNT, _, rest) => {
    rest[0].unshift(firstNT)
    return rest
  },
  (lastRHS) => [[lastRHS]],
  (part, _, rest) => {
    const nt = part.at(-1).pop()
    rest[0].unshift(nt)
    rest.unshift([part])
    return rest
  },
  (seq) => [seq],
  (seq, _, part) => {
    part.unshift(seq)
    return part
  },
  () => [],
  (seq, sym) => {
    seq.push(sym)
    return seq
  },
]

const tokens = lexer.parse(fs.readFileSync('boost.gram', 'utf8'))
// const symTree = grammar.parse(tokens)

// console.log(symTree.toString())
const ruleEntries = grammar.sSDD(tokens, semanticRules)
console.log(new Grammar(ruleEntries).toString())
