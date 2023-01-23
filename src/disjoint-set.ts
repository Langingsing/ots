export class DisjointSet {
  private readonly arr: number[] = []

  get length() {
    return this.arr.length
  }

  father(index: number) {
    return this.arr[index]
  }

  setFather(index: number, fatherIndex: number) {
    this.arr[index] = fatherIndex
  }

  find(index: number) {
    while (this.father(index) < index) {
      index = this.father(index)
    }
    return index
  }

  addRoot() {
    const {length} = this
    this.setFather(length, length)
  }
}
