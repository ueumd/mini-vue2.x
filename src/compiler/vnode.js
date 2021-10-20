export default function VNode(tag, attr, children, context, text = null) {
  return {
    // 节点类型
    type: 1,
    // 标签
    tag,

    // 属性 map 对象
    attr,

    // 父节点
    parent: null,

    // 子节点组成的 Vnode 数组
    children,

    // 文本节点Ast 对象
    text,

    // Vnode 真实节点
    elm: null,

    // Vue 上下文
    context
  }
}
