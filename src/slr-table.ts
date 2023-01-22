import type {NT, Term} from "./types"
import type {Action, State} from "./action"
import {FmtTable} from "./table.js"

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
