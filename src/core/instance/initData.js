import {proxy} from "../utils.js";
import {observe} from "../observer/index.js"

/**
 *
 * @param vm 当前实例 new Vue({})
 */
export default function initData(vm) {
  let {data} = vm.$options

  /**
   * 当前实例 vm下如添加一个 ._data属性 并保证值是一个对象
   * this._data.a
   * this._data.b
   */

  if (!data) {
    vm._data = {}
  } else {
    /**
     * 配置选项里如果data是方法 返回data里的对象
     * data () { return {...} }
     */
    vm._data = typeof data === 'function' ? data() : {}
  }

  /**
   * 不用代理访问 this._data.a
   * 代理访问：将 data 对象上的的各个属性代理到 Vue 实例上，支持通过 this.xx 的方式访问
   *
   * vm {
   *   $options: { ... }
   *   _data: { a:1, b:2 ...}
   *   a: xx
   *   b: xx
   * }
   *
   * vm.a
   */
  for (let key in vm._data) {
    proxy(vm, '_data', key)
  }

  // 设置响应式
  observe(vm._data)
}
