import Dep from './dep.js'

/**
 * 能过 Observer 类为对象设置响应式能力
 * @param data
 * @returns Observer 实例
 */
export function observe(data) {
  // 当data不是对象是结束递归
  if (typeof data !== 'object') return

  /**
   * data.__ob__ 是Observe实例
   * 如果data.__ob__属性已存在，说明data对象已经具备响应式功能
   */
  if (data.__ob__) {
    return data.__ob__
  }

  /**
   那么经过  new Observer(data) 函数处理之后，data 对象应该变成如下这个样子：
   const lang = {
      name: 'vue',
      version: '2.x',
      __ob__: {
        value: lang,     // value 属性指向 data 数据对象本身，这是一个循环引用
        dep: dep实例对象,  // new Dep()
        vmCount: 0
      }
    }
   */
  return  new Observer(data)
}

function def (value, key, val) {
  /**
   那么经过 defineProperty 函数处理之后，data 对象应该变成如下这个样子：
   const data = {
      a: 1,
      __ob__: {
        value: data,     // value 属性指向 data 数据对象本身，这是一个循环引用
        dep: dep实例对象, // new Dep()
        vmCount: 0
      }
    }
   */
  Object.defineProperty(value, key, {
    value: val,
    enumerable: false, // 不可枚举
    writable: true,
    configurable: true
  })
}

export class Observer {
  constructor (value) {
    this.value = value
    this.dep = new Dep()
    this.vmCount = 0
    def(value, '__ob__', this)

    // 处理数组
    if (Array.isArray(value)) {

      // 对数组元素进行响应式功能
      // this.observeArray(value)
    } else {

      // 对象响应式
      this.walk(value)
    }
  }

  /**
   * 遍历对象的每个属性，为这些属性设置 getter、setter 拦截
   */
  walk (obj) {
    for (let key in obj) {
      defineReactive(obj, key, obj[key])
    }
  }

  /**
   * 遍历数组的每个元素，为每个元素设置响应式
   * 达到 this.arr[idx].xx 响应式功能
   */
  observeArray (arr) {
    for (let item of arr) {
      observe(item)
    }
  }
}

/**
 * 通过Object.defineProperty 为 obj.key 设置 getter setter 拦截
 * getter 时收集依赖
 * setter 时依赖能过 watcher 更新
 */
export function defineReactive(obj, key, val) {

  /**
   *  递归调用 observe，处理嵌套对象
   *  data: {
   *   lang: {
   *      name: 'vue',
   *      version: '2.x'
   *    }
   *  }
   */
    // 实列化一个dep
  const dep = new Dep()
  const childObj = observe(val)

  Object.defineProperty(obj, key, {
    /**
     * 读取数据 obj.key
     * @returns {*}
     */
    get() {
      const value =  val
      if (Dep.target) {
        dep.depend()
      }
      if (childObj) {
        childObj.dep.depend()
        console.log('childObj dep')
      }
      return value
    },

    /**
     * 修改数据 obj.key = x
     * @param newVal
     */
    set(newVal) {
      const value = val
      if (newVal === value || (newVal !== newVal && value !== value)) {
        return
      }
      val = newVal

      // 对新值做响应式处理
      observe(val)

      // 依赖通知更新 数据发生变化了
      dep.notify()
    }
  })
}
