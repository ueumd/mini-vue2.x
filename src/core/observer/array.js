
/**
 * 基于数组原型对象创建新的对象
 * 覆写 数组原型方法 增强功能 具有依赖通知更新能力
 */

const arrayProto = Array.prototype


export const arrayMethods = Object.create(arrayProto)

const methodsToPatch = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
]

methodsToPatch.forEach(function (method) {
  const original = arrayProto[method]
  Object.defineProperty(arrayMethods, method, {
    value: function (...args) {
      // 完成方法的本职工作，比如 this.arr.push(xx)
      const result = original.apply(this, args)
      const ob = this.__ob__

      // 新增的元素列表
      let inserted

      switch (method) {
        case 'push':
        case 'unshift':
          inserted = args
          break
        case 'splice':
          // this.arr.splice(index, num, ele, ele, ele)
          inserted = args.slice(2)
          break
      }
      // 如果数组有新增的元素，则对新增的元素进行响应式处理
      inserted && ob.observeArray(inserted)

      // 依赖通知更新
      ob.dep.notify()

      return  result
    },
    configurable: true,
    writable: true,
    enumerable: true
  })
})


export default function protoArgument(array) {
  array.__proto__ = arrayMethods
}
