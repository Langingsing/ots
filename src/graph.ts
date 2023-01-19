/**
 * directed graph
 * */
import {find, getOrSetDefault} from "./utils.js";

export class Graph<T, E> extends Map<E, Graph<T, E>[]> {
  constructor(
    public data: T
  ) {
    super()
  }

  closure() {
    const set = new Set<Graph<T, E>>()
    const stack: Graph<T, E>[] = [this]
    while (stack.length > 0) {
      const node = stack.pop()!
      if (set.has(node))
        continue
      set.add(node)
      for (const descendants of node.values()) {
        stack.push(...descendants)
      }
    }
    return set
  }

  * edges() {
    for (const [edge, nodes] of this) {
      for (const dest of nodes) {
        yield [edge, dest.data] as [E, T]
      }
    }
  }

  find(predicate: (item: T) => boolean) {
    return find(this.closure(), node => predicate(node.data))
  }

  link(edge: E, dest: this) {
    const arr = getOrSetDefault(this, edge, [])
    arr.push(dest)
  }
}
