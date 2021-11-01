import {parse} from "./parse.js";
import {generate} from './codegen/index.js'
import renderHelper from './codegen/renderHelper.js'
import {patch} from "./vdom/patch.js";
import {renderMixin} from "./render.js";

export default function Vue (options) {
  this.$options = options || {}
  this._data = options.data()
  observe(this)
  this._init()
}


Vue.prototype._init = function () {
  renderHelper(Vue)
  renderMixin(Vue)
  this.__patch__ = patch
  // ...
  mount(this)
}

function observe(vm) {
  for (let key in vm._data) {
    proxy(vm, '_data', key)
  }
}

function proxy (target, sourceKey, key) {
  Object.defineProperty(target, key, {
    get() {
      return target[sourceKey][key]
    },
    set(newVal) {
      target[sourceKey][key] = newVal
    }
  })
}


function mount(vm) {
  if (!vm.$options.render) {
    let template = ''

    // 配置选项目是否有模版
    if (vm.$options.template) {
      // 模版存在
      template = vm.$options.template
    } else if (vm.$options.el) {
      template = document.querySelector(vm.$options.el).outerHTML

      vm.$el = document.querySelector(vm.$options.el)

      const render = compileToFunction(template, vm.$options)
      vm.$options.render = render
      console.log(render)
    }
  }
}

/**
 * 解析模版字符串，得到 AST 语法树
 * 将 AST 语法树生成渲染函数
 * @param { String } template 模版字符串
 * @returns 渲染函数
 */
export function compileToFunction(template, options) {
  // 解析模版，生成 ast
  const ast = parse(template, options)
  console.log('ast:', ast)
  // 将 ast 生成渲染函数
  const code = generate(ast, options)
  console.log(code, 111)
  return code.render
}
