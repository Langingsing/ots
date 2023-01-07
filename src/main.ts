class Grammar {
  private rules: Map<NT, Set<Sym[]>>
  start?: NT

  constructor(ruleEntries: readonly [NT, Sym[][]][] = []) {
    this.rules = new Map(ruleEntries.map(([nt, rhs]) => {
      return [nt, new Set(rhs)]
    }))
    this.start = ruleEntries[0]?.[0]
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

  calcNonTerms() {
    return new Set(this.rules.keys())
  }

  calcTerms(
    alphabet = this.calcAlphabet(),
    nonTerms = this.calcNonTerms(),
  ) {
    const arr = [...alphabet].filter(sym => !nonTerms.has(sym))
    return new Set(arr)
  }

  calcFirst() {

  }
}

const grammar = new Grammar([
  ['E', [['T', '+', 'E'], ['T', '-', 'E']]]
]);

console.log(grammar.calcTerms())

type Sym = string
type NT = Sym
type Term = Sym
