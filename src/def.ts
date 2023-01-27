import {Lexer, Rule} from "./lexer.js"
import {Grammar} from "./grammar.js"
import {iter} from "./utils.js"
import * as Path from "path"
import * as fs from "fs";
import {Accept, Action, Reduce, Shift} from "./action.js"

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
    prod: Grammar.ruleEntriesToProductions(grammar.ruleEntries),
    lex,
    table: grammar.calcLRTable(),
    sSDD: ssdd,
  }
}

export async function compile(path: string) {
  const {default: def} = await import(path)
  const filename = Path.basename(path)
  const {lex, sSDD, table} = transform(def)
  const langName = filename.substring(0, filename.length - '.def.js'.length)
  const lexer = new Lexer(lex)
  fs.writeFileSync(langName + '.js',
    `${Action.source()}

${Reduce.source()}

${Shift.source()}

${Accept.source()}

${Lexer.source()}

const lexer = ${lexer.source()}
const emptyMap = new Map()
const rows = ${table.rowsSource()}
const ssdd = [${sSDD}]

export function parse(src) {
    const stateStack = [0];
    const values = [];
    for (const token of lexer.parse(src)) {
        for (;;) {
            const lastState = stateStack.at(-1);
            const action = rows[lastState].actionMap.get(token.type);
            if (!action) {
                throw 'syntax error';
            }
            if (action.isReduce()) {
                handleReduce(action);
                continue;
            }
            if (action.isShift()) {
                const { next } = action;
                stateStack.push(next);
                values.push(token.raw);
                break;
            }
            throw 'received after accepting';
        }
    }
    for (;;) {
        const lastState = stateStack.at(-1);
        const action = rows[lastState].actionMap.get('${table.end}');
        if (!action) {
            throw 'syntax error';
        }
        if (action.isReduce()) {
            handleReduce(action);
        }
        else {
            break;
        }
    }
    return values[0];
    function handleReduce(action) {
        const { nt, seqLen, code } = action;
        stateStack.splice(stateStack.length - seqLen);
        const children = values.splice(values.length - seqLen);
        const lastState = stateStack.at(-1);
        const next = rows[lastState].gotoMap.get(nt);
        stateStack.push(next);
        values.push(ssdd[code](...children));
    }
}
`)
}
