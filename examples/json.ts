import {Grammar} from "../src/grammar.js"
import {Lexer, Rule} from "../src/lexer.js"

const jsonGrammar = new Grammar([
  ['Value', [
    ['string'],
    ['number'],
    ['Object'],
    ['Array'],
    ['true'],
    ['false'],
    ['null'],
  ]],
  ['Object', [
    ['{', '}'],
    ['{', 'ObjectContent', '}'],
  ]],
  ['ObjectContent', [
    ['Entry'],
    ['Entry', ',', 'ObjectContent'],
  ]],
  ['Entry', [
    ['string', ':', 'Value']
  ]],
  ['Array', [
    ['[', ']'],
    ['[', 'ArrayContent', ']'],
  ]],
  ['ArrayContent', [
    ['Value'],
    ['Value', ',', 'ArrayContent'],
  ]],
])

const identical = <T>(x: T) => x
const semanticRules: ((...args: any[]) => any)[] = [
  /* Value */
  identical,
  (number) => Number(number),
  identical,
  identical,
  () => true,
  () => false,
  () => null,
  /* Object */
  () => ({}),
  (_, objectContent) => Object.fromEntries(objectContent),
  /* ObjectContent */
  (entry) => [entry],
  (entry, _, objectContent) => {
    objectContent.push(entry)
    return objectContent
  },
  /* Entry */
  (string, _, value) => [string, value],
  /* Array */
  () => [],
  (_, arrayContent) => arrayContent,
  /* ArrayContent */
  (value) => [value],
  (value, _, arrayContent) => {
    arrayContent.push(value)
    return arrayContent
  },
]

const str = '{"a": 3.1, "b": [true, "code"]}'
const tokens = new Lexer([
  Rule.BLANK,
  Rule.DOUBLE_QUOTED_STRING.renameNew('string'),
  [',', /,/],
  ['{', /\{/],
  ['}', /}/],
  [':', /:/],
  ['[', /\[/],
  [']', /]/],
  ['number', /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[Ee][+-]?\d+)?/],
  ['true', /true/],
  ['false', /false/],
  ['null', /null/],
]).parse(str)

console.log(jsonGrammar.sSDD(tokens, semanticRules))
