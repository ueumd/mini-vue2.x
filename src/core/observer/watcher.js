import {popTarget, pushTarget} from "./dep.js";

let watchId = 0

/**
 https://www.jianshu.com/p/5a5c8e65ff9e
 在vue中，共有4种情况会产生Watcher：

 1. Vue实例对象上的watcher,观测根数据，发生变化时重新渲染组件
    updateComponent = () => {vm._update(vm._render(), hydrating)} vm._watcher = new Watcher(vm, updateComponent, noop)
 2. 用户在vue对象内用watch属性创建的watcher
 3. 用户在vue对象内创建的计算属性，本质上也是watcher
 4. 用户使用vm.$watch创建的watcher

 Wathcer会增减，也可能在render的时候新增。所以，必须有一个Schedule来进行Watcher的调度。

 */
export default class Watcher {
  constructor(vm, expOrFn, cb, options, isRenderWatcher) {
    this.vm = vm

    if (isRenderWatcher) {
      vm._watcher = this
    }

    vm._watchers.push(this)

    this.cb = cb
    this.id = ++watchId
    this.dirty = true

    if (options) {
      this.deep = !!options.deep
      this.user = !!options.user
      this.lazy = !!options.lazy
      this.sync = !!options.sync
      this.before = options.before
    } else {
      this.deep = this.user = this.lazy = this.sync = false
    }

    this.deps = [];
    this.newDeps = []
    this.depIds = new Set()
    this.newDepIds = new Set()

    switch (typeof expOrFn) {
      case 'function' :
        this.getter = expOrFn
        break
      case 'string':
        this.getter = parsePath(expOrFn)
        break
    }

    /**
     *
     * 会读取 data: { a: 1 }
      vm.$watch('a', function (newVal, oldVal) {
          console.log(newVal, oldVal)
      })
     */
    this.value = this.get()
  }

  get() {
    let value
    const vm = this.vm
    // 添加订阅者到栈中并设置为当前正在处理的订阅者
    pushTarget(this)

    // 读取data.a 会触发 getter 依赖收集
    value = this.getter.call(vm, vm)

    // 移除当前订阅者
    popTarget()

    // 清理依赖项
    this.cleanupDeps()
    return value
  }

  /**
   * 添加依赖项
   * @param dep
   */
  addDep (dep) {
    const id = dep.id

    // 根据id，判断依赖项是否已存在
    if (!this.newDepIds.has(id)) {
      this.newDepIds.add(id)
      this.newDeps.push(dep)
      if (!this.depIds.has(id)) {
        // 将 watcher 自己放到 dep 中 双向收集
        dep.addSub(this)
      }
    }
  }


  /**
   * 清理依赖项集合。
   */
  cleanupDeps () {
    let i = this.deps.length;
    while (i--) {
      const dep = this.deps[i];
      if (!this.newDepIds.has(dep.id)) {
        dep.removeSub(this); // 删除
      }
    }

    let tmp = this.depIds;
    this.depIds = this.newDepIds;
    this.newDepIds = tmp;
    this.newDepIds.clear();

    tmp = this.deps;
    this.deps = this.newDeps;
    this.newDeps = tmp;
    this.newDeps.length = 0;
  }

  /*
    data: { a: 1 }
    vm.$watch('a', function (newVal, oldVal) {
        console.log(newVal, oldVal)
    })

    data.a = 100 执行回调函数
 */
  run() {
    const value = this.get()

    // 更新值
    const oldValue = this.value
    this.value = value

    // 执行回调函数
    // function (newVal, oldVal) {
    //   console.log(newVal, oldVal)
    // }
    this.cb.call(this.vm, value, oldValue)
  }

  depend() {
    let i = this.deps.length
    while (i--) {
      this.deep[i].depend()
    }
  }

  update() {
    this.run()
  }
}


/**
 * unicode letters used for parsing html tags, component names and property paths.
 * using https://www.w3.org/TR/html53/semantics-scripting.html#potentialcustomelementname
 * skipping \u10000-\uEFFFF due to it freezing up PhantomJS
 */
export const unicodeRegExp = /a-zA-Z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C-\u200D\u203F-\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD/
const bailRE = new RegExp(`[^${unicodeRegExp.source}.$_\\d]`)
/**
 * 处理
 * data['a.b.c']
 * @param expOFn
 */
function parsePath(expOFn) {
  if (bailRE.test(expOFn)) {
    return
  }
  const segments = expOFn.split('.')
  return function (obj) {
    for (let i = 0; i < segments.length; i++) {
      if (!obj) return

      // 一层层访问
      // obj = data[a]
      // obj = obj[b]
      // obj = obj[c]

      // 读取字段值，触发 get 函数
      obj = obj[segments[i]]
    }
    return obj
  }
}
