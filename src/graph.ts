/**
 * directed graph
 * */
export class Graph<T> extends Map<T, Iterable<T>> {
  closure(start: T) {
    const set = new Set<T>()
    const stack = [start]
    while (stack.length) {
      const item = stack.pop()!
      if (set.has(item))
        continue
      set.add(item)
      stack.push(...this.get(item)!)
    }
    return set
  }
}
