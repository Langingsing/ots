import {Grammar} from "./grammar.js"
import {Lexer, Rule} from "./lexer.js"
import {filter} from "./utils.js"

const grammar = new Grammar([
  ['Expr', [
    ['Expr', '+', 'Term'],
    ['Expr', '-', 'Term'],
    ['Term'],
  ]],
  ['Term', [
    ['Term', '*', 'Factor'],
    ['Term', '/', 'Factor'],
    ['Factor'],
  ]],
  ['Factor', [
    ['(', 'Expr', ')'],
    ['num']
  ]],
])
const semanticRules: ((...args: any[]) => number)[] = [
  (expr, plus, term) => expr + term,
  (expr, minus, term) => expr - term,
  (term) => term,
  (term, times, factor) => term * factor,
  (term, divisor, factor) => term / factor,
  (factor) => factor,
  (paren, expr, closeParen) => expr,
  (num) => Number(num),
]
// console.log(grammar.rules)
console.log('terms')
console.log(grammar.terms)
console.log('nts')
console.log(grammar.nonTerms)
console.log(grammar.epsilonProducers)
console.log(grammar.first)
console.log(grammar.follow)
// console.log(grammar.calcSLRTable().toString())

const str = '3 * (4 + 56)'
const tokens = new Lexer([
  Rule.BLANK,
  Rule.NUM,
  ['(', /\(/],
  [')', /\)/],
  ['+', /\+/],
  ['-', /-/],
  ['*', /\*/],
  ['/', /\//],
]).parse(str)
// const symTree = grammar.parse(
//   filter(tokens, token => token.type != Rule.BLANK[0])
// )

// console.log(symTree.toString())
console.log(grammar.singleSSDD(
  filter(tokens, token => token.type != Rule.BLANK[0]),
  semanticRules
))
