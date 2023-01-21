import type {NT, Sym} from "./types"
import {StateData} from "./state.js"

export const enum EAction {
  Reduce,
  Accept,
  Shift
}

export abstract class Action {
  readonly abstract type: EAction

  isReduce(): this is Reduce {
    return this.type == EAction.Reduce
  }

  isShift(): this is Shift {
    return this.type == EAction.Shift
  }

  isAccept(): this is Accept {
    return this.type == EAction.Accept
  }

  abstract toString(): string
}

export class Reduce extends Action {
  readonly type = EAction.Reduce

  constructor(
    public readonly nt: NT,
    public readonly seq: readonly Sym[]
  ) {
    super()
  }

  override toString() {
    return 'Rx'
  }
}

export class Accept extends Action {
  readonly type = EAction.Accept

  override toString() {
    return 'Acc'
  }
}

export class Shift extends Action {
  readonly type = EAction.Shift

  constructor(
    public readonly next: StateData
  ) {
    super()
  }

  override toString() {
    return 'S' + this.next
  }
}
