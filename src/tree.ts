import {map} from "./utils.js"

export class Tree<T> {
  constructor(
    public data: T,
    public children: Tree<T>[] = []
  ) {
  }

  * iterWithDepth(initialDepth = 0): Generator<[T, number]> {
    yield [this.data, initialDepth]
    for (const child of this.children) {
      for (const x of child.iterWithDepth(initialDepth + 1)) {
        yield x as [T, number]
      }
    }
  }

  [Symbol.iterator]() {
    return map(this.iterWithDepth(), ([node]) => node)
  }

  toString() {
    return [...this.iterWithDepth()]
      .map(([data, depth]) => ' '.repeat(2 * depth) + '- ' + data)
      .join('\n')
  }
}
