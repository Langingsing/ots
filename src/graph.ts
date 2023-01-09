export class Graph<T> extends Map<T, T[]> {
  * iter(start: T) {
    const met = new Set<T>()
    const stack = [start]
    while (stack.length) {
      const item = stack.pop()!
      if (met.has(item))
        continue
      yield item
      met.add(item)
      stack.push(...this.get(item)!)
    }
  }
}
