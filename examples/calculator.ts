import {Grammar} from "../src/grammar.js"
import {Lexer, Rule} from "../src/lexer.js"

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
// console.log(grammar.calcLRTable().toString())

const str = '3 * (4 + 56)'
const lexer = new Lexer([
  Rule.BLANK,
  Rule.DIGITS.renameNew('num'),
  '(',
  ')',
  '+',
  '-',
  '*',
  '/',
])
const tokens = lexer.parse(str)
const symTree = grammar.parse(tokens)

console.log(symTree.toString())
console.log(grammar.sSDD(lexer.parse(str), semanticRules))
