/**
 * 解析模版字符串，生成 AST 语法树
 * @param {*} template 模版字符串
 * @returns {AST} root ast 语法树
 */

export default function parse(template) {
  // 存放所有没有配对的开始标签 AST 对象
  const stack = []
  let root  = null
  let html = template
  console.log(html)
  // while (html.trim()) {
  //   console.log(1)
  // }

  return root
}
