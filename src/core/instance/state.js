import initData from "./initData.js";
import Watcher from "../observer/watcher.js";
import Dep, { pushTarget, popTarget } from '../observer/dep.js'
import { isPlainObject } from '../utils.js'

export function initState (vm) {
  // 存放watcher实例
  vm._watchers = []

  const opts = vm.$options
  if (opts.data) {
    initData(vm)
  } else {
    observe(vm._data = {}, true /* asRootData */)
  }

  /**
   * 是否有watch选项
   */
  if (opts.watch) {
    console.log('opt watch')
    initWatch(vm, opts.watch)
  }
}

function initWatch (vm, watch) {
  // 遍历 watch
  for (const key in watch) {
    const handler = watch[key]
    if (Array.isArray(handler)) {
      for (let i = 0; i < handler.length; i++) {
        createWatcher(vm, key, handler[i])
      }
    } else {
      createWatcher(vm, key, handler)
    }
  }
}

function createWatcher (vm, expOrFn, handler, options) {
  // 做一些类型判断

  // if (isPlainObject(handler)) {
  //   options = handler
  //   handler = handler.handler
  // }
  // if (typeof handler === 'string') {
  //   handler = vm[handler]
  // }

  /**
   * Vue.prototype.$watch
   * 实例方法 this.$watch
   */
  return vm.$watch(expOrFn, handler, options)
}


export function stateMixin(Vue) {

  Vue.prototype.$set = function () {}

  // this.$watch
  Vue.prototype.$watch = function (expOrFn, cb, options) {

    const vm = this
    if (isPlainObject(cb)) {
      return createWatcher(vm, expOrFn, cb, options)
    }

    options = options || []
    options.user = true

    //
    const watcher = new Watcher(vm, expOrFn, cb, options)

    // 存在immediate 立即执行
    if (options.immediate) {
      pushTarget()
      try {
        cb.call(vm, watcher.value)
      } catch (error) {
        console.error(error, vm, `callback for immediate watcher "${watcher.expression}"`)
      }
      popTarget()
    }
  }
}
