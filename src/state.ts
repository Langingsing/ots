import {getOrSetDefault, arrEq, count, mapEq, includes, every, map, filter} from "./utils.js"
import {Graph} from "./graph.js"
import type {Sym, NT} from "./types"

export class ItemRight {
  constructor(
    public seq: readonly Sym[],
    public dotPos = 0
  ) {
  }

  clone() {
    return new ItemRight(this.seq, this.dotPos)
  }

  advanceBy(n: number) {
    this.dotPos += n
  }

  atDot() {
    return this.seq[this.dotPos]
  }

  newAdvance() {
    const newItem = this.clone()
    newItem.advanceBy(1)
    return newItem
  }

  eq(other: Readonly<this>) {
    return arrEq(this.seq, other.seq) && this.dotPos == other.dotPos
  }

  get length() {
    return this.seq.length
  }

  toReduce() {
    return this.dotPos >= this.length
  }

  toShift() {
    return !this.toReduce()
  }
}

export class StateData extends Map<Sym, ItemRight[]> {
  constructor(
    public code = -1,
    entries?: readonly (readonly [Sym, ItemRight[]])[] | null
  ) {
    super(entries)
  }

  getOrSetDefault(sym: Sym) {
    return getOrSetDefault(this, sym, [])
  }

  extend(sym: Sym, items: Iterable<ItemRight>) {
    const arr = this.getOrSetDefault(sym)
    for (const item of items) {
      if (!includes(arr, item, (a, b) => a.eq(b))) {
        arr.push(item)
      }
    }
  }

  itemRights() {
    return map(this.productions(), ([_, item]) => item)
  }

  productionsToReduce() {
    return filter(this.productions(), ([_, item]) => item.toReduce())
  }

  toReduce() {
    const it = this.itemRights()
    const first = it.next()
    if (first.done || first.value.toShift()) {
      return false
    }
    return it.next().done
  }

  toShift() {
    return every(this.itemRights(), item => item.toShift())
  }

  * productions() {
    for (const [nt, set] of this) {
      for (const item of set) {
        yield [nt, item] as [NT, ItemRight]
      }
    }
  }

  availableEdges() {
    const edges = new Set<Sym>()
    for (const item of this.itemRights()) {
      if (item.toShift() && item.atDot() != '') {
        edges.add(item.atDot())
      }
    }
    return edges
  }

  count() {
    return count(this.itemRights())
  }

  eq(other: Readonly<this>) {
    return mapEq(this, other, (a, b) => {
      return arrEq(a, b, (x, y) => x.eq(y))
    })
  }

  static codeLt(a: Readonly<StateData>, b: Readonly<StateData>) {
    return a.code < b.code
  }

  toString() {
    return this.code.toString()
  }
}

export class DFA extends Graph<StateData, Sym> {
}
