import {StateData} from "./state.js"
import type {NT, Sym, Term} from "./types"
import type {Action} from "./action"
import {FmtTable} from "./table.js"
import {comparingNum} from "./utils.js"

export class BodyRow {
  constructor(
    private readonly actionMap = new Map<Term, Action>(),
    private readonly gotoMap = new Map<NT, StateData>(),
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

  setGoto(nt: NT, state: StateData) {
    this.gotoMap.set(nt, state)
  }
}

export class Row {
  public readonly body = new BodyRow()

  constructor(
    public readonly state: Readonly<StateData>,
  ) {
  }
}

export class SLRTable {
  public readonly rows: readonly Row[]

  constructor(
    states: readonly StateData[],
    public readonly terms: ReadonlySet<Term>,
    public readonly nts: ReadonlySet<NT>,
    public readonly end: Term,
  ) {
    this.rows = states
      .map(state => new Row(state))
      .sort(comparingNum(row => row.state.code))
  }

  private isActionKey(sym: Sym) {
    return this.terms.has(sym)
  }

  private isGotoKey(sym: Sym) {
    return this.nts.has(sym)
  }

  toString() {
    const strTbl = new FmtTable()
    const terms = [...this.terms, this.end]
    const nts = [...this.nts]
    const headers = strTbl.newRow()
    headers.push('', ...terms, ...nts)
    for (const {state, body} of this.rows) {
      const row = strTbl.newRow()
      row.push(state.toString())
      for (const term of terms) {
        row.push(body.action(term)?.toString() ?? '')
      }
      for (const nt of nts) {
        row.push(body.goto(nt)?.toString() ?? '')
      }
    }
    return strTbl.toString()
  }
}
