let uidDep = 0

const targetStack = []

export function pushTarget(target) {
  targetStack.push(target)
  Dep.target = target
}

export function popTarget() {
  // 从尾部删除
  targetStack.pop()
  Dep.target = targetStack[targetStack.length - 1]
}


/**
 * 所谓依赖收集，就是把一个数据用到的地方收集起来，在这个数据发生改变的时候，统一去通知各个地方做对应的操作
 */
export default class Dep {
  /**
   * target 存放当前watcher实例
   * @type {null}
   */
  static target = null


  constructor() {
    this.id = uidDep++

    // 存放着Watcher实例
    this.subs = []
  }

  // sub => Watcher实例
  addSub(watcher) {
    this.subs.push(watcher)
  }

  removeSub(watcher) {
    // remove(this.subs, watcher)
    if (this.subs.length) {
      const index = this.subs.indexOf(watcher)
      if (~index) {
        this.subs.slice(index, 1)
      }
    }
  }

  depend() {
    if (Dep.target) {
      Dep.target.addDep(this)
    }
  }

  notify() {
    console.log('dep notify:')
    const subs = this.subs.slice()
    subs.forEach(sub => {
      sub.update()
    })
  }
}
