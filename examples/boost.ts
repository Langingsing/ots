import {Grammar} from "../src/grammar.js"
import {Lexer, Rule} from "../src/lexer.js"

const lexer = new Lexer([
  Rule.BLANK,
  ['sym', /\w+/],
  ['|', /\|/],
  ['->', /->/],
])

const grammar = new Grammar([
  ['gram', [
    ['prod'],
    ['prod', 'gram'],
  ]],
  ['prod', [
    ['sym', '->', 'rhs']
  ]],
  ['rhs', [
    ['seq'],
    ['seq', '|', 'rhs'],
  ]],
  ['seq', [
    [],
    ['sym', 'seq'],
  ]],
])
const semanticRules: ((...args: any[]) => number)[] = [
  (expr, plus, term) => expr + term,
]
// console.log(grammar.rules)
console.log('terms')
console.log(grammar.terms)
console.log('nts')
console.log(grammar.nonTerms)
console.log(grammar.epsilonProducers)
console.log(grammar.first)
console.log(grammar.follow)
console.log(grammar.calcLRTable().toString())

const str = '3 * (4 + 56)'

// const tokens = lexer.parse(str)
// const symTree = grammar.parse(tokens)

// console.log(symTree.toString())
// console.log(grammar.sSDD(tokens, semanticRules))
