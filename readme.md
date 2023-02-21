# ots

A tool for generating parser from syntax-directed definitions.

## Usage

- The core of this package is a function, `genParser`, which receives two parameters. The first indicates your language
  name, and the second is the language's lex rules, grammar and syntax-directed definitions.
- The field `lex` is an array of lex rules, each item could be a string which represents both type and value of the
  correspond token, or a rule instance exported from `lexer.js`.
- The field `start` is a string, indicating the starting non-terminal of your grammar.
- The field `sSDD` is an object, whose keys are non-terminals and each value is an array of syntax-directed definitions.
  Each syntax-directed definition is a js function which takes parameters named from symbols of your grammar. If your
  terminal or non-terminal is NOT a valid js identifier, you can specify it by js parameter's default value.

## Example

Write a typescript file named `json.def.ts`:

```typescript
// json.def.ts
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
```

Compile it and run, and there will be a generated javascript file named `json.js` which exports a function named `parse`
.

Write a file `test.js` for testing:

```javascript
// test.js
import {parse} from './json.js'

console.log(parse('{"a": 1, "b": [true, "foo"]}'))
```

Run it, and we can get the correct parsed js object.
