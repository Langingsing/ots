import {find, findLast, getOrSetDefault, map} from "./utils.js"
import {ProdIndex} from "./prod-index.js"
import {MapToSet} from "./map-to-set.js"
import {DFA, ItemRight, StateData} from "./state.js"
import type {NT, Sym, Term} from "./types"
import {SLRTable} from "./slr-table.js"
import {Accept, Reduce, Shift} from "./action.js"
import {Token} from "./lexer.js"
import {Tree} from "./tree.js"

export class GrammarBase {
  private readonly rules: Map<NT, Sym[][]>
  start?: NT
  end: Term

  constructor(
    private readonly ruleEntries: readonly [NT, Sym[][]][]
  ) {
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

  calcDFA() {
    const state = this.closure(this.start!)
    state.code = 0
    let code = 1
    const root = new DFA(state)
    const met = new Set<DFA>();
    const stack = [root]
    while (stack.length > 0) {
      const node = stack.pop()!

      if (met.has(node)) {
        continue
      }
      met.add(node)

      const state = node.data

      for (const symbol of state.availableEdges()) {
        const next = this.nextStateNew(state, symbol, code)
        let dest = find(met, state => state.data.eq(next))
        if (!dest) {
          dest = new DFA(next)
          code++
        }
        node.link(symbol, dest)
        stack.push(dest)
      }
    }
    return root
  }

  nextStateNew(state: Readonly<StateData>, symbol: Sym, code: number) {
    const next = new StateData(code);
    return this.nextState(state, symbol, next);
  }

  private nextState(state: Readonly<StateData>, symbol: Sym, next: StateData) {
    for (const [nonTerm, set] of state) {
      for (const itemRight of set) {
        if (!itemRight.toShift())
          continue
        const atDot = itemRight.atDot()
        if (atDot == symbol) {
          next.extend(nonTerm, [itemRight.newAdvance()])
        }
      }
    }
    this.closureOnState(next)
    return next
  }

  private newItemRightList(nt: NT) {
    return this.rules.get(nt)!.map(seq => new ItemRight(seq))
  }

  private closure(nt: NT) {
    const state = new StateData()
    state.set(nt, this.newItemRightList(nt))
    this.closureOnState(state)
    return state
  }

  private closureOnState(state: StateData) {
    for (; ;) {
      const count = state.count()
      for (const nt of state.keys()) {
        const setRef = state.get(nt)!
        for (const itemRight of setRef) {
          if (itemRight.toReduce())
            continue
          const symbol = itemRight.atDot()
          if (this.isTerm(symbol))
            continue
          const newSet = this.newItemRightList(symbol)
          state.extend(symbol, newSet)
        }
      }
      if (state.count() == count)
        return state
    }
  }

  calcSLRTable(dfa: Readonly<DFA> = this.calcDFA()) {
    const dfaNodeList = dfa.closure()
    const table = new SLRTable(
      [...map(dfaNodeList, node => node.data)],
      this.terms,
      this.nonTerms,
      this.end
    )
    for (const fromNode of dfaNodeList) {
      const {data: from} = fromNode
      const row = table.rows[from.code]

      for (const [edge, toNode] of fromNode) {
        const {data: to} = toNode
        if (this.isNonTerm(edge)) {
          row.setGoto(edge, to)
        } else {
          row.setAction(edge, new Shift(to))
        }
      }
      from.throwIfConflict(this.follow)
      for (const [nt, {seq}] of from.productionsToReduce()) {
        for (const term of this.follow.get(nt)!) {
          row.setAction(term, new Reduce(nt, seq, this.seqCode(nt, seq)))
        }
      }
    }
    // set Accept
    const acceptingState = table.rows[0].goto(this.start!)!
    const acceptingRow = table.rows[acceptingState.code]
    acceptingRow.setAction(this.end, new Accept())

    return table
  }

  private seqCode(nt: NT, seq: readonly Sym[]) {
    let code = 0
    for (let [lhs, rhs] of this.ruleEntries) {
      if (lhs == nt) {
        code += rhs.indexOf(seq as Sym[])
        break
      }
      code += rhs.length
    }
    return code
  }

  parse(tokens: Iterable<Token>) {
    const dfa = this.calcDFA()
    const slrTable = this.calcSLRTable(dfa)
    const stateStack = [dfa.data]
    const treeStack: Tree<Sym>[] = []
    // iterate over tokens
    for (const token of tokens) {
      for (; ;) {
        const lastState = stateStack.at(-1)!
        const action = slrTable.rows[lastState.code].action(token.type)
        if (!action) {
          throw 'syntax error'
        }
        if (action.isReduce()) {
          const {nt, seq} = action
          // pop seq.length states
          stateStack.splice(stateStack.length - seq.length)
          const children = treeStack.splice(treeStack.length - seq.length)
          const lastState = stateStack.at(-1)!
          const next = slrTable.rows[lastState.code].goto(nt)!
          stateStack.push(next)
          treeStack.push(new Tree(nt, children))
          continue
        }
        if (action.isShift()) {
          const {next} = action as Shift
          stateStack.push(next)
          treeStack.push(new Tree(token.raw))
          break
        }
        throw 'received after accepting'
      }
    }
    // reducing and accepting
    for (; ;) {
      const lastState = stateStack.at(-1)!
      const action = slrTable.rows[lastState.code].action(this.end)
      if (!action) {
        throw 'syntax error'
      }
      if (action.isReduce()) {
        const {nt, seq} = action
        // pop seq.length states
        stateStack.splice(stateStack.length - seq.length)
        const children = treeStack.splice(treeStack.length - seq.length)
        const lastState = stateStack.at(-1)!
        const next = slrTable.rows[lastState.code].goto(nt)!
        stateStack.push(next)
        treeStack.push(new Tree(nt, children))
      } else {
        // action is Accept
        break
      }
    }
    return treeStack[0]
  }

  isEmpty() {
    return this.rules.size == 0
  }
}
