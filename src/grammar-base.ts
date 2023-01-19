import {findLast, getOrSetDefault} from "./utils.js"
import {ProdIndex} from "./prod-index.js"
import {MapToSet} from "./map-to-set.js"
import type {NT, Sym, Term} from "./types"

export class GrammarBase {
  private readonly rules: Map<NT, Sym[][]>
  start?: NT
  end: Term

  constructor(ruleEntries: readonly [NT, Sym[][]][] = []) {
    this.rules = new Map(ruleEntries)
    this.start = ruleEntries[0]?.[0]
    const {alphabet} = this
    let end = '$'
    while (alphabet.has(end)) {
      end += '$'
    }
    this.end = end
  }

  get alphabet() {
    return this.calcAlphabetSet()
  }

  protected calcAlphabetSet() {
    const set = new Set<Sym>()
    for (const [nt, rhs] of this.rules) {
      set.add(nt)
      for (const seq of rhs) {
        for (const sym of seq) {
          set.add(sym)
        }
      }
    }
    return set
  }

  get nonTerms() {
    return new Set(this.nonTermIter())
  }

  protected nonTermIter() {
    return this.rules.keys()
  }

  isNonTerm(sym: Sym) {
    return this.nonTerms.has(sym)
  }

  get terms() {
    return new Set(this.termIter())
  }

  * termIter() {
    for (const sym of this.alphabet) {
      if (!this.isNonTerm(sym))
        yield sym
    }
  }

  isTerm(sym: Sym) {
    return this.terms.has(sym)
  }

  get follow() {
    return this.calcFollow()
  }

  protected calcFollow(): Map<NT, Set<Term>> {
    const follow = new MapToSet<NT, Term>()
    if (this.isEmpty()) {
      return follow
    }

    follow.set(this.start!, new Set([this.end]))

    const dep = new MapToSet<NT, NT>()

    for (const [nt, rhs] of this.rules) {
      for (const seq of rhs) {
        for (let i = seq.length - 2; i >= 0; i--) {
          const sym = seq[i]
          const nextSym = seq[i + 1]
          if (this.isNonTerm(sym)) {
            const firstSet = this.firstSetOf(nextSym)
            firstSet.delete('')
            follow.extend(sym, firstSet)
          }
        }
        for (let i = seq.length - 1; i >= 0; i--) {
          const sym = seq[i]

          if (nt != sym && this.isNonTerm(sym)) {
            dep.add(nt, sym)
          }

          if (!this.canProduceEpsilon(sym)) {
            break
          }
        }
      }
    }

    for (const src of dep.keys()) {
      const followOfSrc = follow.get(src)

      if (!followOfSrc) {
        continue
      }

      const stack = [...dep.get(src)!]
      const met = new Set<NT>([src])

      while (stack.length > 0) {
        const descendant = stack.pop()!
        if (met.has(descendant)) {
          continue
        }
        met.add(descendant)

        follow.extend(descendant, followOfSrc)

        const ntSet = dep.get(descendant)
        if (ntSet) {
          stack.push(...ntSet)
        }
      }
    }

    return follow
  }

  protected firstSetOf(sym: Sym) {
    if (this.isNonTerm(sym)) {
      return this.first.get(sym) ?? new Set()
    }
    return new Set([sym])
  }

  get first() {
    return this.calcFirst()
  }

  protected calcFirst(): Map<NT, Set<Term>> {
    const first = new MapToSet<NT, Term>()
    if (this.isEmpty()) {
      return first
    }

    /* depth-first searching with a dependency graph tracked */

    const indexStack = [new ProdIndex(this.start!)]
    const dep = new Map<NT, ProdIndex[]>()

    while (indexStack.length > 0) {
      const index = indexStack.at(-1)!
      const {nt, seqIdx, symIdx} = index
      const rhs = this.rules.get(nt)!
      if (seqIdx >= rhs.length) {
        indexStack.pop()
        // notify
        const toSeeNextSeq = !this.epsilonProducers.has(nt)
        dep.get(nt)?.forEach(targetIndex => {
          const set = first.get(nt)
          if (set) {
            first.extend(targetIndex.nt, set)
          }
          if (toSeeNextSeq) {
            targetIndex.nextSeq()
          }
        })
        continue
      }
      const seq = rhs[seqIdx]!
      if (symIdx >= seq.length) {
        index.nextSeq()

        first.add(nt, '')

        // notify
        dep.get(nt)?.forEach(depIndex => depIndex.nextSym())

        continue
      }
      const sym = seq[symIdx]!

      if (sym == '') {
        index.nextSym()
      } else if (this.isTerm(sym)) {
        first.add(nt, sym)

        // replace the stack top with an index for next seq
        index.nextSeq()
      } else {
        // here `sym` is non-terminal

        // subscribe in `dep`
        const list = getOrSetDefault(dep, sym, [])
        list.push(index)

        // push a new index for `sym` to stack
        const last = findLast(indexStack, item => item.nt == sym)
        const ntIndex = last?.clone().nextSeq() ?? new ProdIndex(sym)
        indexStack.push(ntIndex)
      }
    }
    return first
  }

  protected canProduceEpsilon(sym: Sym) {
    return sym == '' || this.epsilonProducers.has(sym)
  }

  get epsilonProducers() {
    return this.calcEpsilonProducers()
  }

  protected calcEpsilonProducers() {
    // non-terminals which can produce epsilon
    const producers = new Set<NT>()
    if (this.isEmpty()) {
      return producers
    }

    // non-terminals which can't produce epsilon at all
    const nonEmptyProducers = new Set<NT>()

    /* depth-first searching with a dependency graph tracked */

    const indexStack = [new ProdIndex(this.start!)]
    const dep = new Map<NT, ProdIndex[]>()

    while (indexStack.length > 0) {
      const index = indexStack.at(-1)!
      const {nt, seqIdx, symIdx} = index
      if (producers.has(nt) || nonEmptyProducers.has(nt)) {
        indexStack.pop()
        continue
      }
      const rhs = this.rules.get(nt)!
      if (seqIdx >= rhs.length) {
        indexStack.pop()
        nonEmptyProducers.add(nt)
        continue
      }
      const seq = rhs[seqIdx]!
      if (symIdx >= seq.length) {
        indexStack.pop()
        producers.add(nt)

        // notify
        dep.get(nt)?.forEach(depIndex => depIndex.nextSym())

        continue
      }
      const sym = seq[symIdx]!

      if (sym == '') {
        index.nextSym()
      } else if (this.isTerm(sym) || nonEmptyProducers.has(sym)) {
        // replace the stack top with an index for next seq
        index.nextSeq()
      } else {
        // here `sym` is non-terminal

        // subscribe in `dep`
        const list = getOrSetDefault(dep, sym, [])
        list.push(index)

        // push a new index for `sym` to stack
        const last = findLast(indexStack, item => item.nt == sym)
        const ntIndex = last?.clone().nextSeq() ?? new ProdIndex(sym)
        indexStack.push(ntIndex)
      }
    }
    return producers
  }

  isEmpty() {
    return this.rules.size == 0
  }
}
