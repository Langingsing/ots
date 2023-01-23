import type {NT, Sym, Term} from "./types"
import type {Action, State} from "./action"
import {FmtTable} from "./table.js"
import {arr, map} from "./utils.js"
import {Accept, Reduce, Shift} from "./action.js"

export class GrammarError extends Error {
  name = 'GrammarError'
}

export class Conflict<T> extends GrammarError {
  name = 'Conflict'

  constructor(from: T, to: T) {
    super(`Try to set ${to}, but there has already been ${from}.`)
  }
}

export class GotoConflict extends Conflict<State> {
  name = 'GotoConflict'
}

export class ActionConflict extends Conflict<Action> {
  name = 'ActionConflict'
}

export class Row {
  private readonly actionMap = new Map<Term, Action>()
  private readonly gotoMap = new Map<NT, State>()

  action(term: Term) {
    return this.actionMap.get(term)
  }

  goto(nt: NT) {
    return this.gotoMap.get(nt)
  }

  setAction(term: Term, action: Action) {
    const old = map.swap(this.actionMap, term, action)
    if (old !== undefined && !action.eq(old)) {
      throw new ActionConflict(old, action)
    }
  }

  setGoto(nt: NT, state: State) {
    const old = map.swap(this.gotoMap, nt, state)
    if (old !== undefined && state !== old) {
      throw new GotoConflict(old, state)
    }
  }
}

export class SLRTable {
  public readonly rows: Row[]

  constructor(
    readonly terms: ReadonlySet<Term>,
    readonly nts: ReadonlySet<NT>,
    readonly end: Term,
    rowCountHint = 0,
  ) {
    this.rows = Array.from({length: rowCountHint}, () => new Row())
  }

  static from(tsvContent: string, productions: [NT, Sym[]][]) {
    const arr2dim = tsvContent
      .split('\n')
      .map(line => {
        const row = line.split('\t')
        row.shift()
        return row
      })
    const headers = arr2dim.shift()
    if (!headers) {
      throw 'tsv should has a line of headers'
    }
    const endIndex = arr.indexOfMaxValue(headers.map(sym => {
      for (const ch of sym) {
        if (ch != '$') {
          return 0
        }
      }
      return sym.length
    }))
    const table = new SLRTable(
      new Set(headers.slice(0, endIndex)),
      new Set(headers.slice(endIndex + 1)),
      headers[endIndex],
      arr2dim.length
    )
    for (let i = 0; i < arr2dim.length; i++) {
      const line = arr2dim[i]
      const row = table.rows[i]
      for (let j = 0; j <= endIndex; j++) {
        const cell = line[j]
        const term = headers[j]
        let action: Action
        switch (cell[0]) {
          case 'R':
            const index = parseInt(cell.substring(1))
            action = new Reduce(...productions[index], index)
            break
          case 'S':
            action = new Shift(parseInt(cell.substring(1)))
            break
          case 'A':
            action = new Accept()
            break
          default:
            continue
        }
        row.setAction(term, action)
      }
      for (let j = endIndex + 1; j < line.length; j++) {
        const cell = line[j]
        const nt = headers[j]
        if (cell != '') {
          row.setGoto(nt, parseInt(cell))
        }
      }
    }
    return table
  }

  toString() {
    const strTbl = new FmtTable()
    const terms = [...this.terms, this.end]
    const nts = [...this.nts]
    const headers = strTbl.newRow()
    headers.push('', ...terms, ...nts)
    for (let i = 0; i < this.rows.length; i++) {
      const row = this.rows[i]
      const strRow = strTbl.newRow()
      strRow.push(i.toString())
      for (const term of terms) {
        strRow.push(row.action(term)?.toString() ?? '')
      }
      for (const nt of nts) {
        strRow.push(row.goto(nt)?.toString() ?? '')
      }
    }
    return strTbl.toString()
  }
}
