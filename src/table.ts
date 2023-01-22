export class Table<T> extends Array<Array<T>> {
  constructor(
    public readonly defaultV?: T
  ) {
    super()
  }

  get width() {
    return this.calcWidth()
  }

  calcWidth() {
    return this.reduce((width, row) => Math.max(width, row.length), 0)
  }

  newRow() {
    const row: T[] = []
    this.push(row)
    return row
  }

  uniform(defaultV = this.defaultV) {
    const {width} = this
    if (defaultV != undefined) {
      for (const row of this) {
        for (let i = 0; i < width; i++) {
          if (row[i] == undefined) {
            row[i] = defaultV
          }
        }
      }
    }
    return this
  }
}

export class FmtTable extends Table<string> {
  constructor(
    public readonly cellSplitter = '\t',
    placeholder?: string,
  ) {
    super(placeholder)
  }

  private colWidths(width = this.width) {
    const colWidths = Array.from({length: width}, () => 0)
    for (const row of this) {
      for (let i = 0; i < width; i++) {
        colWidths[i] = Math.max(colWidths[i], row[i].length)
      }
    }
    return colWidths
  }

  uniform() {
    super.uniform('')

    const {width} = this
    const colWidths = this.colWidths(width)
    for (const row of this) {
      for (let i = 0; i < width; i++) {
        row[i] = row[i].padEnd(colWidths[i])
      }
    }
    return this
  }

  toString() {
    return this.map(row => row.join(this.cellSplitter)).join('\n')
  }
}
