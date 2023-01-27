export function comparingNum<T>(toNum: (item: T) => number = Number) {
  return (a: T, b: T) => toNum(a) - toNum(b)
}

export type predicate<T> = (item: T) => boolean
export type eq<T> = (a: Readonly<T>, b: Readonly<T>) => boolean

export namespace arr {
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

  export function indexOfMaxValue(arr: number[]) {
    let ret = 0
    for (let i = 1; i < arr.length; i++) {
      if (arr[i] > arr[ret]) {
        ret = i
      }
    }
    return ret
  }

  export function eq<T>(a: readonly T[], b: readonly T[], eq: eq<T> = Object.is) {
    if (a == b) {
      return true
    }
    if (a.length != b.length) {
      return false
    }
    return a.every((item, i) => eq(item, b[i]))
  }

  export function unorderedEq<T>(a: readonly T[], b: readonly T[], eq: eq<T> = Object.is) {
    if (a == b) {
      return true
    }
    if (a.length != b.length) {
      return false
    }
    return a.every((item, i) => {
      return eq(item, b[i])
        || b.some(bItem => eq(item, bItem))
    })
  }

  export function indicesInArr<T>(from: readonly T[], to: readonly T[], eq: eq<T> = Object.is) {
    return from.map(item => to.findIndex(toItem => eq(item, toItem)))
  }
}

export namespace map {
  export function getOrSetDefault<K, V>(map: Map<K, V>, k: K, defaultV: V) {
    if (map.has(k)) {
      return map.get(k)!
    }
    map.set(k, defaultV)
    return defaultV
  }

  export function swap<K, V>(map: Map<K, V>, k: K, v: V) {
    const old = map.get(k)
    map.set(k, v)
    return old
  }

  export function eq<K, V>(a: ReadonlyMap<K, V>, b: ReadonlyMap<K, V>, eq: eq<V> = Object.is) {
    if (a == b) {
      return true
    }
    if (a.size != b.size) {
      return false
    }
    return iter.every(a, ([k, v]) => {
      if (!b.has(k)) {
        return false
      }
      return eq(b.get(k)!, v)
    })
  }
}

export namespace set {
  export function extend<T>(set: Set<T>, items: Iterable<T>) {
    const {size} = set
    for (const item of items) {
      set.add(item)
    }
    return set.size - size
  }

  export function eq<K, V>(a: ReadonlySet<V>, b: ReadonlySet<V>) {
    if (a == b) {
      return true
    }
    if (a.size != b.size) {
      return false
    }
    return iter.every(a, v => {
      return b.has(v)
    })
  }
}

export namespace iter {
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

  export function some<T>(i: Iterable<T>, predicate: predicate<T>) {
    for (const item of i) {
      if (predicate(item)) {
        return true
      }
    }
    return false
  }

  export function flagSome<T>(i: Iterable<T>, predicate: predicate<T>) {
    let flag = false
    for (const item of i) {
      if (predicate(item)) {
        flag = true
      }
    }
    return flag
  }

  export function* filter<T>(i: Iterable<T>, predicate: predicate<T>) {
    for (const item of i) {
      if (predicate(item)) {
        yield item
      }
    }
  }

  export function intersect<T>(i: Iterable<T>, set: ReadonlySet<T>) {
    return filter(i, item => set.has(item))
  }

  export function* combine<T>(arr: readonly T[], k: number) {
    const {length: n} = arr
    if (k >= n || k <= 0) {
      // shallow copy
      return Array.from(arr)
    }
    const indices = Array.from({length: k}, (_, i) => i)
    for (; ;) {
      if (indices[k - 1] >= n) {
        let some = false
        for (let i = k - 2; i >= 0; i--) {
          if (indices[i] + 1 < indices[i + 1]) {
            indices[i]++
            for (let j = k - i - 1; j >= 1; j--) {
              indices[i + j] = j + indices[i]
            }
            some = true
            break
          }
        }
        if (!some) {
          break
        }
        continue
      }
      yield indices.map(index => arr[index])
      indices[k - 1]++
    }
  }

  export function* zip<T, U>(a: Iterable<T>, b: Iterable<U>) {
    let i = b[Symbol.iterator]()
    for (const x of a) {
      const {done, value: y} = i.next()
      if (done) {
        break
      }
      yield [x, y] as [T, U]
    }
  }

  export function* takeUntil<T>(i: Iterable<T>, predicate: predicate<T>) {
    for (const x of i) {
      yield x
      if (predicate(x)) {
        break
      }
    }
  }
}
