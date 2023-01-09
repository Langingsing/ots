import {Graph} from "../target/graph.js"
import {it, expect} from '@jest/globals'

it('graph iter', function () {
  const graph = new Graph()
  graph.set(1, [2, 3])
  graph.set(2, [3])
  graph.set(3, [1])

  const i = graph.iter(1)
  expect(i.next().value).toBe(1)
  expect(i.next().value).toBe(3)
  expect(i.next().value).toBe(2)
  expect(i.next().done).toBe(true)
})
