import {GrammarBase} from "./grammar-base.js"
import type {NT, Sym, Term} from "./types"

export class Grammar extends GrammarBase {
  private _alphabet?: Set<Sym>
  private _nonTerms?: Set<NT>
  private _terms?: Set<Term>
  private _reachable?: Set<Sym>
  private _epsilonProducers?: Set<NT>
  private _first?: Map<NT, Set<Term>>
  private _follow?: Map<NT, Set<Term>>

  get alphabet() {
    return this._alphabet ??= super.alphabet
  }

  get nonTerms() {
    return this._nonTerms ??= super.nonTerms
  }

  get terms() {
    return this._terms ??= super.terms
  }

  get reachable() {
    return this._reachable ??= super.reachable
  }

  get epsilonProducers() {
    return this._epsilonProducers ??= super.epsilonProducers
  }

  get first() {
    return this._first ??= super.first
  }

  get follow() {
    return this._follow ??= super.follow
  }
}
