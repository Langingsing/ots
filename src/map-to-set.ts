import {map} from "./utils.js"

export class MapToSet<K, T> extends Map<K, Set<T>> {
  getOrSetDefault(k: K) {
    return map.getOrSetDefault(this, k, new Set())
  }

  add(k: K, item: T) {
    const set = this.getOrSetDefault(k)
    set.add(item)
    return set
  }

  extend(k: K, items: Iterable<T>) {
    for (const item of items) {
      this.add(k, item)
    }
    return this.getOrSetDefault(k)
  }
}
