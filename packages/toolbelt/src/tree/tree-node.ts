export class TreeNode<T,> {
  public constructor(
    public value: T,
    public left: null | TreeNode<T>,
    public right: null | TreeNode<T>,
  ) {
  }
}
