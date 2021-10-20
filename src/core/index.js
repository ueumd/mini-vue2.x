import {initState, stateMixin} from "./instance/state.js";
import mount from "../compiler/index.js";
import patch  from "../compiler/patch.js"

export default function Vue(options) {
  this._init(options)
}

Vue.prototype._init = function (options) {
  this.$options = options

  /**
   * 在Vue原型上挂载一些方法，如$watch $set
   */
  stateMixin(Vue)

  // 初始化数据
  initState(this)

  // DIFF
  this.__patch__ = patch

 // 存在 el 配置项，则调用 $mount 方法编译模版
  if(this.$options.el) {
    this.$mount()
  }
}


Vue.prototype.$mount = function () {
  mount(this)
}
