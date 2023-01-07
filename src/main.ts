class GrammarBase {
  private rules: Map<NT, Set<Sym[]>>
  start?: NT

  constructor(ruleEntries: readonly [NT, Sym[][]][] = []) {
    this.rules = new Map(ruleEntries.map(([nt, rhs]) => {
      return [nt, new Set(rhs)]
    }))
    this.start = ruleEntries[0]?.[0]
  }

  get alphabet() {
    return this.calcAlphabet()
  }

  calcAlphabet() {
    const set = new Set<Sym>()
    for (const [nt, rhs] of this.rules) {
      set.add(nt)
      for (const seq of rhs) {
        for (const sym of seq) {
          set.add(sym)
        }
      }
    }
    return set;
  }

  get nonTerms() {
    console.log('in base')
    return this.calcNonTerms()
  }

  calcNonTerms() {
    return new Set(this.rules.keys())
  }

  isNonTerm(sym: Sym) {
    return this.nonTerms.has(sym)
  }

  get terms() {
    return this.calcTerms()
  }

  calcTerms() {
    const arr = [...(this.alphabet)].filter(sym => !this.nonTerms.has(sym))
    return new Set(arr)
  }

  isTerm(sym: Sym) {
    return this.terms.has(sym)
  }

  calcFirst() {
    const first = new Map<Sym, Set<Sym>>()
  }
}

class Grammar extends GrammarBase {
  _alphabet?: Set<Sym>
  _nonTerms?: Set<Sym>
  _terms?: Set<Sym>

  get alphabet() {
    return this._alphabet ??= this.calcAlphabet()
  }

  get nonTerms() {
    console.log('in extend')
    return this._nonTerms ??= this.calcNonTerms()
  }

  get terms() {
    return this._terms ??= this.calcTerms()
  }

  protected invalidCache() {
    this._terms = this._alphabet = this._nonTerms = undefined
  }
}

const grammar = new Grammar([
  ['E', [['T', '+', 'E'], ['T', '-', 'E'], ['']]]
]);

grammar.isNonTerm('E')

type Sym = string
type NT = Sym
type Term = Sym
