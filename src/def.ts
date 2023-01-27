import {Lexer, Rule} from "./lexer.js"
import {Grammar} from "./grammar.js"
import {iter} from "./utils.js"
import * as fsAsync from "fs/promises"
import * as Path from "path";

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
const fnTable = fnGrammar.calcLRTable()
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

export function transform(def: any) {
  const {lex, sSDD, start} = def

  const grammar = new Grammar(
    Object.entries(sSDD)
      .map(([nt, fns]) => {
        // @ts-ignore
        return [nt, fns.map(fn => {
          const fnString = fn.toString()
          const tokens = fnLexer.parse(fnString)
          return fnTable.sSDD<string[]>(
            iter.takeUntil(tokens, token => token.type == ')'),
            fnSSDD
          )
        })]
      }),
    start
  )
  const ssdd: any[] = Object.values(sSDD).flat()
  return {
    lex,
    table: grammar.calcLRTable(),
    sSDD: ssdd,
  }
}

export async function compile(path: string) {
  const {default: def} = await import(path)
  const filename = Path.basename(path)
  const {lex, sSDD, table} = transform(def)
  const dirname = filename.substring(0, filename.length - '.def.js'.length)

  try {
    await fsAsync.access(dirname)
  } catch (e) {
    await fsAsync.mkdir(dirname)
  }
  const lexer = new Lexer(lex)
  return Promise.all([
    fsAsync.writeFile(Path.join(dirname, 'lex.js'), `export default ${lexer}`),
    fsAsync.writeFile(Path.join(dirname, 'table.tsv'), table.toString()),
    fsAsync.writeFile(Path.join(dirname, 'ssdd.js'), `export default [${sSDD}]`),
  ])
}
