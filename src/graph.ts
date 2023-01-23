import {map} from "./utils.js"

/**
 * single-directed graph
 * */
export class Graph<T, E> extends Map<E, Graph<T, E>> {
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
      stack.push(...node.outputs())
    }
    return set
  }

  outputs() {
    return this.values()
  }

  link(edge: E, dest: this) {
    map.getOrSetDefault(this, edge, dest)
  }
}
