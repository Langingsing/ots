class GrammarBase {
  private rules: Map<NT, Sym[][]>
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
