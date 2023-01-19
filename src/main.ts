import {Grammar} from "./grammar.js"

const grammar = new Grammar([
  ['A', [['B', 'a'], ['']]],
  ['B', [['A', 'E'], ['b']]],
  ['E', [['T', '+', 'E'], ['T', '-', 'E'], ['']]]
]);

console.log(grammar.calcDFA())
