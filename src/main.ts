function findLastIndex<T>(arr: T[], predicate: (item: T, index: number, arr: T[]) => unknown) {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (predicate(arr[i], i, arr)) {
      return i
    }
  }
  return -1
}

function findLast<T>(arr: T[], predicate: (item: T, index: number, arr: T[]) => unknown) {
  const i = findLastIndex(arr, predicate)
  return i >= 0 ? arr[i] : undefined
}

// production index
class ProdIndex {
  constructor(
    public nt: NT,
    public seqIdx = 0,
    public symIdx = 0,
  ) {
  }

  nextSym() {
    this.symIdx++
    return this
  }

  nextSeq() {
    this.seqIdx++
    this.symIdx = 0
    return this
  }

  clone() {
    return new ProdIndex(this.nt, this.seqIdx, this.symIdx)
  }
}

class GrammarBase {
  private readonly rules: Map<NT, Sym[][]>
  start?: NT

  constructor(ruleEntries: readonly [NT, Sym[][]][] = []) {
    this.rules = new Map(ruleEntries)
    this.start = ruleEntries[0]?.[0]
  }

  get alphabet() {
    return new Set(this.alphabetIter())
  }

  * alphabetIter() {
    const set = new Set<Sym>()
    for (const [nt, rhs] of this.rules) {
      if (!set.has(nt)) {
        yield nt
        set.add(nt)
      }
      for (const seq of rhs) {
        for (const sym of seq) {
          if (!set.has(sym)) {
            yield sym
            set.add(sym)
          }
        }
      }
    }
  }

  get nonTerms() {
    return new Set(this.nonTermIter())
  }

  nonTermIter() {
    return this.rules.keys()
  }

  isNonTerm(sym: Sym) {
    return this.nonTerms.has(sym)
  }

  get terms() {
    return new Set(this.termIter())
  }

  * termIter() {
    for (const sym of this.alphabetIter()) {
      if (!this.isNonTerm(sym))
        yield sym
    }
  }

  isTerm(sym: Sym) {
    return this.terms.has(sym)
  }

  calcFirst() {
    const first = new Map<Sym, Set<Sym>>()
    const dep = new Map<Sym, Set<Sym>>()
    for (const nt of this.nonTermIter()) {
      first.set(nt, new Set())
      dep.set(nt, new Set())
    }
    for (const [nt, rhs] of this.rules) {
      for (const seq of rhs) {
        for (const sym of seq) {

        }
      }
    }
  }

  calcEpsilonProducers() {
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
        if (!dep.has(sym)) {
          dep.set(sym, [])
        }
        const list = dep.get(sym)!
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

class Grammar extends GrammarBase {
  private _alphabet?: Set<Sym>
  private _nonTerms?: Set<Sym>
  private _terms?: Set<Sym>

  get alphabet() {
    return this._alphabet ??= super.alphabet
  }

  get nonTerms() {
    return this._nonTerms ??= super.nonTerms
  }

  get terms() {
    return this._terms ??= super.terms
  }

  protected invalidateCache() {
    this._terms = this._alphabet = this._nonTerms = undefined
  }
}

const grammar = new Grammar([
  ['A', [['B', 'a'], ['']]],
  ['B', [['A'], ['b']]],
  ['E', [['T', '+', 'E'], ['T', '-', 'E'], ['']]]
]);

console.log(grammar.calcEpsilonProducers())

type Sym = string
type NT = Sym
type Term = Sym
