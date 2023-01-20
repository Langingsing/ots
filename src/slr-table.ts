import {StateData} from "./state.js"
import type {NT, Sym, Term} from "./types"
import type {Action} from "./action"

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
  constructor(
    public readonly state: Readonly<StateData>,
    public readonly body = new BodyRow(),
  ) {
  }
}

export class SLRTable {
  public readonly rows: readonly Row[]

  constructor(
    readonly states: readonly StateData[],
    public readonly terms: ReadonlySet<Term>,
    public readonly nts: ReadonlySet<NT>,
    public readonly end: Term,
  ) {
    this.rows = states.map(state => new Row(state))
  }

  private isActionKey(sym: Sym) {
    return this.terms.has(sym)
  }

  private isGotoKey(sym: Sym) {
    return this.nts.has(sym)
  }

  getOrSetDefault(sym: Sym) {
    if (this.isActionKey(sym)) {

    }
  }
}
