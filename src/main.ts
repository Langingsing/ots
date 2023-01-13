import {Graph} from "./graph.js"

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
    console.log('in base')
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
    // non-terminals which can't produce epsilon at all
    const nonEmptyProducers = new Set<NT>()

    if (this.isEmpty()) {
      return producers
    }
    type Index = [NT, number, number]
    /* depth-first searching with a dependency graph tracked */

    const indexStack: Index[] = [[this.start!, 0, 0]]
    const dep = new Map<NT, Index[]>()

    while (indexStack.length > 0) {
      const index = indexStack.at(-1)!
      const [nt, seqIdx, symIdx] = index
      const rhs = this.rules.get(nt)!
      if (seqIdx == rhs.length) {
        indexStack.pop()
        nonEmptyProducers.add(nt)
        continue
      }
      const seq = rhs[seqIdx]!
      if (symIdx == seq.length) {
        indexStack.pop()
        producers.add(nt)
        continue
      }
      const sym = seq[symIdx]!

      if (sym == '') {
        producers.add(nt)
        // todo: check no circuit

        // notify
        // increase depIndex[2] which represents symIdx
        dep.get(nt)?.forEach(depIndex => depIndex[2]++)

        indexStack.pop()
      } else if (this.isTerm(sym)) {
        // replace the stack top with an index for next seq

        // increase index[1] which represents seqIdx
        index[1] = seqIdx + 1
        // reset index[1] which represents symIdx
        index[2] = 0
      } else {
        // here `sym` is non-terminal

        if (!producers.has(sym)) {
          // subscribe in `dep`
          if (!dep.has(sym)) {
            dep.set(sym, [])
          }
          const list = dep.get(sym)!
          list.push(index)

          // push a new index for `sym` to stack
          const ntIndex: Index = [sym, 0, 0]
          indexStack.push(ntIndex)
        }
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
    console.log('in extend')
    return this._nonTerms ??= super.nonTerms
  }

  get terms() {
    return this._terms ??= super.terms
  }

  protected invalidCache() {
    this._terms = this._alphabet = this._nonTerms = undefined
  }
}

const grammar = new Grammar([
  ['D', [['E']]],
  ['F', [['TE']]],
  ['E', [['T', '+', 'E'], ['T', '-', 'E'], ['']]]
]);

console.log(grammar.calcEpsilonProducers())

type Sym = string
type NT = Sym
type Term = Sym
