export function createTextVNode(text) {
  return vNode(undefined, undefined, undefined, undefined, text)
}

export function createElement(tag, data = {}, ...children) {
  //vue 中的 key 不会作为属性传递给组件
  return vNode(tag, data, data.key, children)
}

function vNode(tag, data, key, children, text) {
  return {
    tag,
    data,
    key,
    children,
    text
  }
}
