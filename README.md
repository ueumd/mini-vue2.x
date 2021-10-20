# mini-vue
实现一个基础版的vue.js 支持 数据响应式绑定 模版渲染 虚拟dom更新 生命周期

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Title</title>
</head>
<body>
<script type="module">
  import Vue from './src/core/index.js'
  let vm = new Vue({
    el: '#app',
    data() {
      return {
        a: 1,
        lang: {
          name: 'vue',
          version: '2.x'
        }
      }
    },
    watch: {
      'a': function (newVal, oldVal) {
        console.log('watch newVal: ', newVal, 'oldVal: ', oldVal)
      }
    }
  })

  vm.$watch('a', function (newVal, oldVal) {
    console.log('$watch newVal: ', newVal, 'oldVal: ', oldVal)
  })

  vm.$watch('lang.name', function (newVal, oldVal) {
    console.log('$watch newVal: ', newVal, 'oldVal: ', oldVal)
  })

  window.vm = vm
  console.log(vm)
</script>
</body>
</html>

```

# 参考
- Vue技术内幕 http://caibaojian.com/vue-design/art/
- Vue虚拟DOM https://segmentfault.com/a/1190000038949032
- Vue秘籍 https://jonny-wei.github.io/blog/vue/
