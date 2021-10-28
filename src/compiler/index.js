import mountComponent from "./mountComponent.js";
import parse1 from './parse.js'
import generate from './generate.js'

export default function mount(vm) {
  if (!vm.$options.render) {
    let template = ''

    // 配置选项目是否有模版
    if (vm.$options.template) {
      // 模版存在
      template = vm.$options.template
    } else if (vm.$options.el) {
      template = document.querySelector(vm.$options.el).outerHTML

      vm.$el = document.querySelector(vm.$options.el)

      /**
       * 解析模版 生成render函数
       * @type {渲染函数}
       */
      const render = compileToFunction(template)

      vm.$options.render = render
      console.log(render)
    }
  }

  // 一些挂载
  mountComponent(vm)
}


/**
 * 解析模版字符串，得到 AST 语法树
 * 将 AST 语法树生成渲染函数
 * @param { String } template 模版字符串
 * @returns 渲染函数
 */
export function compileToFunction(template) {
  // 解析模版，生成 ast
  const ast = parse1(template)
  console.log(ast)
  // 将 ast 生成渲染函数
  const render = generate(ast)
  return render
}
