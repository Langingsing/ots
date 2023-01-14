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
  if (!map.has(k)) {
    map.set(k, defaultV)
  }
  return map.get(k) as V
}

export function extendSet<T>(set: Set<T>, items: Iterable<T>) {
  for (const item of items) {
    set.add(item)
  }
  return set
}
