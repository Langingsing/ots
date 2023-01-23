export class DisjointSet {
  private readonly arr: number[] = []

  get length() {
    return this.arr.length
  }

  fatherOf(index: number) {
    return this.arr[index]
  }

  setFather(index: number, fatherIndex: number) {
    this.arr[index] = fatherIndex
  }

  isInternal(i: number) {
    return this.fatherOf(i) < i
  }

  rootOf(i: number) {
    while (this.isInternal(i)) {
      i = this.fatherOf(i)
    }
    return i
  }

  addRoot() {
    const {length} = this
    this.setFather(length, length)
  }
}
