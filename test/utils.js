import {it, expect} from "@jest/globals";
import {combine} from "../target/utils.js";

it('combine', () => {
  const nums = [1, 2, 3, 4, 5, 6, 7]
  const i = combine(nums, 5)
  expect(i.next().value).toStrictEqual([1, 2, 3, 4, 5])
  expect(i.next().value).toStrictEqual([1, 2, 3, 4, 6])
  expect(i.next().value).toStrictEqual([1, 2, 3, 4, 7])
  expect(i.next().value).toStrictEqual([1, 2, 3, 5, 6])
  expect(i.next().value).toStrictEqual([1, 2, 3, 5, 7])
  expect(i.next().value).toStrictEqual([1, 2, 3, 6, 7])
  expect(i.next().value).toStrictEqual([1, 2, 4, 5, 6])
  expect(i.next().value).toStrictEqual([1, 2, 4, 5, 7])
  expect(i.next().value).toStrictEqual([1, 2, 4, 6, 7])
  expect(i.next().value).toStrictEqual([1, 2, 5, 6, 7])
  expect(i.next().value).toStrictEqual([1, 3, 4, 5, 6])
  expect(i.next().value).toStrictEqual([1, 3, 4, 5, 7])
  expect(i.next().value).toStrictEqual([1, 3, 4, 6, 7])
  expect(i.next().value).toStrictEqual([1, 3, 5, 6, 7])
  expect(i.next().value).toStrictEqual([1, 4, 5, 6, 7])
  expect(i.next().value).toStrictEqual([2, 3, 4, 5, 6])
  expect(i.next().value).toStrictEqual([2, 3, 4, 5, 7])
  expect(i.next().value).toStrictEqual([2, 3, 4, 6, 7])
  expect(i.next().value).toStrictEqual([2, 3, 5, 6, 7])
  expect(i.next().value).toStrictEqual([2, 4, 5, 6, 7])
  expect(i.next().value).toStrictEqual([3, 4, 5, 6, 7])
  expect(i.next().done).toBe(true)
})
