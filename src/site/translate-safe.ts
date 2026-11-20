if (typeof Node === 'function' && Node.prototype) {
  const remove = Node.prototype.removeChild
  Node.prototype.removeChild = function <T extends Node>(this: Node, child: T): T {
    if (child.parentNode !== this) return child
    return remove.call(this, child) as T
  }
  const insert = Node.prototype.insertBefore
  Node.prototype.insertBefore = function <T extends Node>(this: Node, node: T, ref: Node | null): T {
    if (ref && ref.parentNode !== this) return node
    return insert.call(this, node, ref) as T
  }
}

export {}
