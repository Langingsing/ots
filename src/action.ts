import type {NT, Sym} from "./types"

export type State = number

export const enum EAction {
  Reduce,
  Shift,
  Accept
}

export abstract class Action {
  readonly abstract type: EAction

  isReduce(): this is Reduce {
    return this.type == EAction.Reduce
  }

  isShift(): this is Shift {
    return this.type == EAction.Shift
  }

  eq(other: Readonly<this>) {
    return this.type == other.type
  }

  abstract toString(): string
}

export class Reduce extends Action {
  readonly type = EAction.Reduce

  constructor(
    readonly nt: NT,
    readonly seq: readonly Sym[],
    readonly code: number,
  ) {
    super()
  }

  eq(other: Readonly<this>) {
    return super.eq(other) && this.code == other.code
  }

  override toString() {
    return 'R' + this.code
  }
}

export class Shift extends Action {
  readonly type = EAction.Shift

  constructor(
    public readonly next: State
  ) {
    super()
  }

  eq(other: Readonly<this>) {
    return super.eq(other) && this.next == other.next
  }

  override toString() {
    return 'S' + this.next
  }
}

export class Accept extends Action {
  readonly type = EAction.Accept

  override toString() {
    return 'Acc'
  }
}
