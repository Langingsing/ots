import type {NT, Term} from "./types"
import type {Action, State} from "./action"
import {FmtTable} from "./table.js"
import {indexOfMaxValue} from "./utils";
import {Accept, Reduce, Shift} from "./action";
import {Sym} from "./types";

export class Row {
  constructor(
    private readonly actionMap = new Map<Term, Action>(),
    private readonly gotoMap = new Map<NT, State>(),
  ) {
  }

  action(term: Term) {
    return this.actionMap.get(term)
  }

  goto(nt: NT) {
    return this.gotoMap.get(nt)
  }

  setAction(term: Term, action: Action) {
    this.actionMap.set(term, action)
  }

  setGoto(nt: NT, state: State) {
    this.gotoMap.set(nt, state)
  }
}

export class SLRTable {
  public readonly rows: Row[]

  constructor(
    stateCount: number,
    readonly terms: ReadonlySet<Term>,
    readonly nts: ReadonlySet<NT>,
    readonly end: Term,
  ) {
    this.rows = Array.from({length: stateCount}, () => new Row())
  }

  static from(tsvContent: string, productions: [NT, Sym[]][]) {
    const arr = tsvContent
      .split('\n')
      .map(line => {
        const row = line.split('\t')
        row.shift()
        return row
      })
    const headers = arr.shift()
    if (!headers) {
      throw 'tsv should has a line of headers'
    }
    const endIndex = indexOfMaxValue(headers.map(sym => {
      for (const ch of sym) {
        if (ch != '$') {
          return 0
        }
      }
      return sym.length
    }))
    const table = new SLRTable(
      arr.length,
      new Set(headers.slice(0, endIndex)),
      new Set(headers.slice(endIndex + 1)),
      headers[endIndex]
    )
    for (let i = 0; i < arr.length; i++) {
      const line = arr[i]
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
