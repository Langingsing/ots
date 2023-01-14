import {getOrSetDefault} from "./utils.js"

export class MapToSet<K, T> extends Map<K, Set<T>> {
  add(k: K, item: T) {
    const set = getOrSetDefault(this, k, new Set())
    set.add(item)
    return set
  }

  extend(k: K, items: Iterable<T>) {
    for (const item of items) {
      this.add(k, item)
    }
    return getOrSetDefault(this, k, new Set())
  }
}
