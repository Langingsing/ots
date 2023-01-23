import {arr, iter, map, set} from "./utils.js"
import {ProdIndex} from "./prod-index.js"
import {MapToSet} from "./map-to-set.js"
import {DFA, ItemRight, StateData} from "./state.js"
import type {NT, Sym, Term} from "./types"
import {Row, SLRTable} from "./slr-table.js"
import {Accept, Reduce, Shift} from "./action.js"
import {Token} from "./lexer.js"
import {Tree} from "./tree.js"
import {DisjointSet} from "./disjoint-set.js"

export class GrammarBase {
  private readonly rules: Map<NT, Sym[][]>
  start: NT
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

  static ruleEntriesToProductions(ruleEntries: readonly [NT, Sym[][]][]) {
    return ruleEntries.flatMap(([nt, rhs]) => {
      return rhs.map(seq => [nt, seq] as [NT, Sym[]])
    })
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

  get reachableNTs() {
    return this.calcReachableNTs()
  }

  protected calcReachableNTs() {
    const reachable = new Set<Sym>()
    if (this.isEmpty()) {
      return reachable
    }
    const stack: NT[] = [this.start]
    while (stack.length > 0) {
      const nt = stack.pop()!
      const rhs = this.rules.get(nt)!
      for (const seq of rhs) {
        for (const sym of seq) {
          if (reachable.has(sym)) {
            continue
          }
          if (this.isNonTerm(sym)) {
            reachable.add(sym)
            stack.push(sym)
          }
        }
      }
    }
    return reachable
  }

  get follow() {
    return this.calcFollow()
  }

  protected calcFollow(): Map<NT, Set<Term>> {
    const follow = new MapToSet<NT, Term>()
    if (this.isEmpty()) {
      return follow
    }

    follow.set(this.start, new Set([this.end]))

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

    const indexStack = [...this.reachableNTs]
      .map(nt => new ProdIndex(nt))
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
        const list = map.getOrSetDefault(dep, sym, [])
        list.push(index)

        // push a new index for `sym` to stack
        const last = arr.findLast(indexStack, item => item.nt == sym)
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

    const indexStack = [new ProdIndex(this.start)]
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
        const list = map.getOrSetDefault(dep, sym, [])
        list.push(index)

        // push a new index for `sym` to stack
        const last = arr.findLast(indexStack, item => item.nt == sym)
        const ntIndex = last?.clone().nextSeq() ?? new ProdIndex(sym)
        indexStack.push(ntIndex)
      }
    }
    return producers
  }

  calcDFA() {
    const state = this.closureStart()
    let code = 1
    const root = new DFA(state)
    const met = new Set<DFA>()
    const nodes = new Set([root])
    const stack = [root]
    const coreGroups = new DisjointSet()
    coreGroups.addRoot()
    while (stack.length > 0) {
      const node = stack.pop()!

      if (met.has(node)) {
        continue
      }
      met.add(node)

      const state = node.data

      for (const symbol of state.availableEdges()) {
        const nextState = this.nextStateNew(state, symbol, code)
        let nextNode = new DFA(nextState)
        const sameCore = [...iter.filter(nodes, state => state.data.coreEq(nextState))]
        if (sameCore.length > 0) {
          const sameNode = iter.find(sameCore, state => state.data.lookAheadEq(nextState))
          if (sameNode) {
            nextNode = sameNode
          } else {
            coreGroups.setFather(code, coreGroups.rootOf(sameCore[0].data.code))
            code++
          }
        } else {
          coreGroups.addRoot()
          code++
        }
        node.link(symbol, nextNode)
        nodes.add(nextNode)
        stack.push(nextNode)
      }
    }
    return {
      dfa: root,
      coreGroups
    }
  }

  nextStateNew(state: Readonly<StateData>, symbol: Sym, code: number) {
    const next = new StateData(code)
    return this.nextState(state, symbol, next)
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

  private newItemRightList(nt: NT, lookAhead: Set<Term>) {
    return this.rules.get(nt)!.map(seq => new ItemRight(seq, lookAhead))
  }

  private closureStart() {
    const state = new StateData(0)
    const itemRights = this.newItemRightList(this.start, new Set([this.end]))
    itemRights.forEach(item => item.lookAhead.add(this.end))
    state.set(this.start, itemRights)
    this.closureOnState(state)
    return state
  }

  private closureOnState(state: StateData) {
    for (; ;) {
      const updated = iter.flagSome(state.values(), itemRights => {
        return iter.flagSome(itemRights, itemRight => {
          if (itemRight.toReduce())
            return false
          const symbol = itemRight.atDot()
          if (this.isTerm(symbol))
            return false
          const followingDot = itemRight.followingDot()
          const firstSetOfFollowingDot = this.firstSetOf(followingDot)
          const lookAhead = new Set(firstSetOfFollowingDot)
          if (firstSetOfFollowingDot.has('')) {
            lookAhead.delete('')
            set.extendSet(lookAhead, itemRight.lookAhead)
          }
          const newSet = this.newItemRightList(symbol, lookAhead)
          return state.extend(symbol, newSet)
        })
      })
      if (!updated)
        return state
    }
  }

  calcLRTable({dfa, coreGroups} = this.calcDFA()) {
    const dfaNodeList = dfa.closure()
    const disjointSetRootToRowIndex = coreGroups.arr
      .reduce((disjointSetRootToRowIndex, node) => {
        const root = coreGroups.fatherOf(node)
        if (root >= disjointSetRootToRowIndex.length) {
          disjointSetRootToRowIndex[root] = disjointSetRootToRowIndex.length
        }
        return disjointSetRootToRowIndex
      }, [] as number[])
    const table = new SLRTable(
      this.terms,
      this.nonTerms,
      this.end,
      disjointSetRootToRowIndex.length
    )
    for (const fromNode of dfaNodeList) {
      const {data: from} = fromNode
      const fromRowIndex = disjointSetRootToRowIndex[coreGroups.fatherOf(from.code)]
      const row = table.rows[fromRowIndex]

      for (const [edge, toNode] of fromNode) {
        const {data: {code: toCode}} = toNode
        const to = disjointSetRootToRowIndex[coreGroups.fatherOf(toCode)]
        if (this.isNonTerm(edge)) {
          row.setGoto(edge, to)
        } else {
          row.setAction(edge, new Shift(to))
        }
      }
      for (const [nt, {seq, lookAhead}] of from.productionsToReduce()) {
        for (const term of lookAhead) {
          row.setAction(term, new Reduce(nt, seq, this.seqCode(nt, seq)))
        }
      }
    }
    // set Accept
    const acceptingState = table.rows[0].goto(this.start)
    let acceptingRow
    if (acceptingState) {
      acceptingRow = table.rows[acceptingState]
    } else {
      acceptingRow = new Row()
      const code = table.rows.length
      table.rows.push(acceptingRow)
      table.rows[0].setGoto(this.start, code)
    }
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

  sSDD<V>(
    tokens: Iterable<Token>,
    semanticRules: ((...args: (V | string)[]) => V)[] | ((...args: (V | string)[]) => V)
  ) {
    const getSemanticRule = Array.isArray(semanticRules)
      ? (i: number) => semanticRules[i]
      : () => semanticRules
    const calcDFAResult = this.calcDFA()
    const slrTable = this.calcLRTable(calcDFAResult)
    const {dfa} = calcDFAResult
    const stateStack = [dfa.data.code]
    const values: (V | string)[] = []
    // iterate over tokens
    for (const token of tokens) {
      for (; ;) {
        const lastState = stateStack.at(-1)!
        const action = slrTable.rows[lastState].action(token.type)
        if (!action) {
          throw 'syntax error'
        }
        if (action.isReduce()) {
          handleReduce(action)
          continue
        }
        if (action.isShift()) {
          const {next} = action as Shift
          stateStack.push(next)
          values.push(token.raw)
          break
        }
        throw 'received after accepting'
      }
    }
    // reducing and accepting
    for (; ;) {
      const lastState = stateStack.at(-1)!
      const action = slrTable.rows[lastState].action(this.end)
      if (!action) {
        throw 'syntax error'
      }
      if (action.isReduce()) {
        handleReduce(action)
      } else {
        // action is Accept
        break
      }
    }
    return values[0] as V

    function handleReduce(action: Reduce) {
      const {nt, seq, code} = action
      // pop seq.length states
      stateStack.splice(stateStack.length - seq.length)
      const children = values.splice(values.length - seq.length)
      const lastState = stateStack.at(-1)!
      const next = slrTable.rows[lastState].goto(nt)!
      stateStack.push(next)

      const semanticRule = getSemanticRule(code)
      values.push(semanticRule(...children, nt))
    }
  }

  parse(tokens: Iterable<Token>) {
    return this.sSDD<Tree<string>>(tokens, (...args) => {
      const nt = args.pop() as string
      const chilren = args.map(arg => {
        return typeof arg == 'string'
          ? new Tree(arg)
          : arg
      })
      return new Tree(nt, chilren)
    })
  }

  isEmpty() {
    return this.rules.size == 0
  }

  toString() {
    return this.ruleEntries.map(([nt, rhs]) => {
      return `${nt} -> ${
        rhs.map(seq => seq.join(' '))
          .join(`\n${' '.repeat(nt.length + 2)}| `)
      }`
    }).join('\n')
  }
}
