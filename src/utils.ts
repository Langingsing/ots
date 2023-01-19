export function findLastIndex<T>(arr: T[], predicate: (item: T, index: number, arr: T[]) => unknown) {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (predicate(arr[i], i, arr)) {
      return i
    }
  }
  return -1
}

export function findLast<T>(arr: T[], predicate: (item: T, index: number, arr: T[]) => unknown) {
  const i = findLastIndex(arr, predicate)
  return i >= 0 ? arr[i] : undefined
}

export function getOrSetDefault<K, V>(map: Map<K, V>, k: K, defaultV: V) {
  if (map.has(k)) {
    return map.get(k)!
  }
  map.set(k, defaultV)
  return defaultV
}

export function extendSet<T>(set: Set<T>, items: Iterable<T>) {
  for (const item of items) {
    set.add(item)
  }
  return set
}

export function arrEq<T>(a: readonly T[], b: readonly T[], eq: eq<T> = Object.is) {
  if (a == b) {
    return true
  }
  if (a.length != b.length) {
    return false
  }
  return a.every((item, i) => eq(item, b[i]))
}

export function mapEq<K, V>(a: ReadonlyMap<K, V>, b: ReadonlyMap<K, V>, eq: eq<V> = Object.is) {
  if (a == b) {
    return true
  }
  if (a.size != b.size) {
    return false
  }
  return every(a, ([k, v]) => {
    if (!b.has(k)) {
      return false
    }
    return eq(b.get(k)!, v)
  })
}

/* iterator utils */

export type predicate<T> = (item: T) => boolean
export type eq<T> = (a: Readonly<T>, b: Readonly<T>) => boolean

export function find<T>(i: Iterable<T>, predicate: predicate<T>) {
  for (const item of i) {
    if (predicate(item)) {
      return item
    }
  }
}

export function includes<T>(i: Iterable<T>, el: T, eq: eq<T> = Object.is) {
  for (const item of i) {
    if (eq(item, el)) {
      return true
    }
  }
  return false
}

export function count(i: Iterable<unknown>) {
  let n = 0
  for (const _ of i) {
    n++
  }
  return n
}

export function* map<T, U>(i: Iterable<T>, fn: (item: T) => U) {
  for (const item of i) {
    yield fn(item)
  }
}

export function every<T>(i: Iterable<T>, predicate: predicate<T>) {
  for (const item of i) {
    if (!predicate(item)) {
      return false
    }
  }
  return true
}

export function* filter<T>(i: Iterable<T>, predicate: predicate<T>) {
  for (const item of i) {
    if (predicate(item)) {
      yield item
    }
  }
}
