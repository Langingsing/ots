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
// console.log(grammar.rules)
console.log('terms')
console.log(grammar.terms)
console.log('nts')
console.log(grammar.nonTerms)
console.log(grammar.epsilonProducers)
console.log(grammar.first)
console.log(grammar.follow)
console.log(grammar.calcSLRTable().toString())

const str = '3 * (4 + 56)'
const tokens = new Lexer([
  Rule.NUM,
  ['(', /\(/],
  [')', /\)/],
  ['+', /\+/],
  ['-', /-/],
  ['*', /\*/],
  ['/', /\//],
  Rule.BLANK,
]).parse(str)
const symTree = grammar.parse(
  filter(tokens, token => token.type != Rule.BLANK[0])
)

console.log(symTree)
