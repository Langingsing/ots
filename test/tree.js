import {Tree} from "../target/tree.js"
import {it, expect} from '@jest/globals'

it('tree iter', () => {
  const tree = new Tree(1, [
    new Tree(2, [
      new Tree(4),
      new Tree(5),
    ]),
    new Tree(3),
  ])
  const i = tree[Symbol.iterator]()
  expect(i.next().value).toBe(1)
  expect(i.next().value).toBe(2)
  expect(i.next().value).toBe(4)
  expect(i.next().value).toBe(5)
  expect(i.next().value).toBe(3)
  expect(i.next().done).toBe(true)
})
