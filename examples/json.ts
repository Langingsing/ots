import {Grammar} from "../src/grammar.js"
import {Lexer, Rule} from "../src/lexer.js"
// @ts-ignore
import def from './json.def.js'
import {iter} from "../src/utils.js";
import takeUntil = iter.takeWhile;

const fnLexer = new Lexer([
  Rule.BLANK,
  Rule.ID,
  Rule.STRING,
  ',',
  '=',
  '(',
  ')',
  'function',
])
const fnGrammar = new Grammar([
  ['fn', [
    ['paramDecl'],
    ['function', 'paramDecl']
  ]],
  ['paramDecl', [
    ['(', 'paramList', ')']
  ]],
  ['paramList', [
    [],
    ['param'],
    ['paramList', ',', 'param']
  ]],
  ['param', [
    ['id'],
    ['id', '=', 'string'],
  ]],
])
const fnSSDD: ((...args: any) => any)[] = [
  /* fn */
  (paramDecl) => paramDecl,
  (_, paramDecl) => paramDecl,
  /* paramDecl */
  (_, paramList) => paramList,
  /* paramList */
  () => [],
  (param) => [param],
  (paramList, _, param) => {
    paramList.push(param)
    return paramList
  },
  /* param */
  (id) => id,
  (_, __, term) => term,
]
const {lex, sSDD, start} = def

const jsonGrammar = new Grammar(
  Object.entries(sSDD)
    .map(([nt, fns]) => {
      // @ts-ignore
      return [nt, fns.map(fn => {
        const fnString = fn.toString()
        const tokens = fnLexer.parse(fnString)
        return fnGrammar.sSDD<string[]>(
          takeUntil(tokens, token => token.type == ')'),
          fnSSDD
        )
      })]
    }),
  start
)

const str = '{"a": 3.1, "b": [true, "code"]}'
const tokens = new Lexer(lex).parse(str)

console.log(jsonGrammar.sSDD(tokens, Object.values(sSDD).flat() as any))
