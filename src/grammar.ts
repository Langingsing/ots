import {GrammarBase} from "./grammar-base.js"
import type {NT, Sym, Term} from "./types"

export class Grammar extends GrammarBase {
  private _alphabet?: Set<Sym>
  private _nonTerms?: Set<NT>
  private _terms?: Set<Term>
  private _epsilonProducers?: Set<NT>

  get alphabet() {
    return this._alphabet ??= super.alphabet
  }

  get nonTerms() {
    return this._nonTerms ??= super.nonTerms
  }

  get terms() {
    return this._terms ??= super.terms
  }

  get epsilonProducers() {
    return this._epsilonProducers ??= super.epsilonProducers
  }

  protected invalidateCache() {
    this._terms = this._alphabet = this._nonTerms = this._epsilonProducers = undefined
  }
}
