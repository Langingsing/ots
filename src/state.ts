import {arr, iter, map, set} from "./utils.js"
import {Graph} from "./graph.js"
import type {Sym, NT, Term} from "./types"

export class ItemRight {
  constructor(
    readonly seq: readonly Sym[],
    readonly lookAhead = new Set<Term>(),
    public dotPos = 0,
  ) {
  }

  clone() {
    return new ItemRight(this.seq, new Set(this.lookAhead), this.dotPos)
  }

  advanceBy(n: number) {
    this.dotPos += n
  }

  atDot() {
    return this.seq[this.dotPos]
  }

  followingDot() {
    return this.dotPos + 1 >= this.length
      ? ''
      : this.seq[this.dotPos + 1]
  }

  newAdvance() {
    const newItem = this.clone()
    newItem.advanceBy(1)
    return newItem
  }

  coreEq(other: Readonly<this>) {
    return this.seq === other.seq // compare seq ptr only, instead of calling arrEq
      && this.dotPos == other.dotPos
  }

  lookAheadEq(other: Readonly<this>) {
    return set.eq(this.lookAhead, other.lookAhead)
  }

  eq(other: Readonly<this>) {
    return this.coreEq(other) && this.lookAheadEq(other)
  }

  extendLookAhead(terms: Iterable<Term>) {
    return set.extend(this.lookAhead, terms)
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
    public code: number
  ) {
    super()
  }

  getOrSetDefault(sym: Sym) {
    return map.getOrSetDefault(this, sym, [])
  }

  extend(sym: Sym, items: Iterable<ItemRight>) {
    const arr = this.getOrSetDefault(sym)
    return iter.flagSome(items, itemRight => {
      const sameCore = arr.find(item => item.coreEq(itemRight))
      if (sameCore) {
        const extended = set.extend(sameCore.lookAhead, itemRight.lookAhead)
        return extended > 0
      }
      arr.push(itemRight)
      return true
    })
  }

  itemRights() {
    return iter.map(this.productions(), ([_, item]) => item)
  }

  productionsToReduce() {
    return iter.filter(this.productions(), ([_, item]) => item.toReduce())
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
    return iter.every(this.itemRights(), item => item.toShift())
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
    return iter.count(this.itemRights())
  }

  coreEq(other: Readonly<this>) {
    return map.eq(this, other, (a, b) => {
      return arr.unorderedEq(a, b, (x, y) => x.coreEq(y))
    })
  }

  lookAheadEq(other: Readonly<this>) {
    return map.eq(this, other, (a, b) => {
      return arr.unorderedEq(a, b, (x, y) => x.lookAheadEq(y))
    })
  }

  extendLookAhead(other: this) {
    for (const [nt, otherItemRights] of other) {
      const thisItemRights = this.get(nt)!
      const indices = arr.indicesInArr(
        thisItemRights,
        otherItemRights,
        (a, b) => a.coreEq(b)
      )
      for (const [thisItemRight, index] of iter.zip(thisItemRights, indices)) {
        const otherItemRight = otherItemRights[index]
        thisItemRight.extendLookAhead(otherItemRight.lookAhead)
      }
    }
  }

  throwIfConflict(follow: ReadonlyMap<NT, ReadonlySet<Term>>) {
    const productionsToReduce = [...this.productionsToReduce()]
    if (productionsToReduce.length == 0) {
      return
    }
    const followSets = productionsToReduce.map(([nt]) => {
      return follow.get(nt)!
    })
    const symsToShift = new Set(iter.map(
      iter.filter(
        this.itemRights(),
        item => item.toShift()
      ),
      item => item.atDot()
    ))
    if (symsToShift.size > 0) {
      const valid = followSets.every(followSet => {
        return iter.intersect(symsToShift, followSet).next().done!
      })
      if (!valid) {
        throw 'reduce-shift conflict'
      }
    }
    if (productionsToReduce.length > 1) {
      const valid = iter.every(
        iter.combine(followSets, 2),
        ([a, b]) => {
          return iter.intersect(a, b).next().done!
        }
      )
      if (!valid) {
        throw 'reduce-reduce conflict'
      }
    }
  }
}

export class DFA extends Graph<StateData, Sym> {
}
