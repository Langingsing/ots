export class Tree<T> {
  constructor(
    public data: T,
    public children: Tree<T>[] = []
  ) {
  }
}
