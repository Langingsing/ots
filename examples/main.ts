import {Grammar} from "../src/grammar.js"
const grammar = new Grammar([
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
