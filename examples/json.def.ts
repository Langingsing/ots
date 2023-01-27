import {Rule} from "../src/lexer.js"
import {genParser} from "../src/def.js"

genParser('json', {
  lex: [
    Rule.BLANK,
    Rule.DOUBLE_QUOTED_STRING.renameNew('string'),
    ',',
    '{',
    '}',
    ':',
    '[',
    ']',
    Rule.NUMBER,
    'true',
    'false',
    'null',
  ],
  start: 'Value',
  sSDD: {
    Value: [
      (string) => string,
      (number) => Number(number),
      (Object) => Object,
      (Array) => Array,
      (_ = 'true') => true,
      (_ = 'false') => false,
      (_ = 'null') => null,
    ],
    Object: [
      (_ = '{', __ = '}') => ({}),
      (_ = '{', ObjectContent, __ = '}') => Object.fromEntries(ObjectContent),
    ],
    ObjectContent: [
      (Entry) => [Entry],
      (ObjectContent, _ = ',', Entry) => {
        ObjectContent.push(Entry)
        return ObjectContent
      },
    ],
    Entry: [
      (string, _ = ':', Value) => [string, Value],
    ],
    Array: [
      (_ = '[', __ = ']') => [],
      (_ = '[', ArrayContent, __ = ']') => ArrayContent,
    ],
    ArrayContent: [
      (Value) => [Value],
      (ArrayContent, _ = ',', Value) => {
        ArrayContent.push(Value)
        return ArrayContent
      },
    ]
  },
})
