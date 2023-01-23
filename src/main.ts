import {Grammar} from "./grammar.js"
import {Lexer, Rule} from "./lexer.js"
import {filter} from "./utils.js"
const grammar = new Grammar([
  ["S'", [['S']]],
  ['S', [
    ['C', 'C'],
  ]],
  ['C', [
    ['c', 'C'],
    ['d'],
  ]],
])
console.log('terms')
console.log(grammar.terms)
console.log('nts')
console.log(grammar.nonTerms)
console.log(grammar.epsilonProducers)
console.log(grammar.first)
console.log(grammar.follow)
console.log(grammar.calcLRTable().toString())
