const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z]*`;      // 用来描述标签的

// 匹配 xxx:xxx 或 xxx 模式的字符。
const qnameCapture = `((?:${ncname}\\:)?${ncname})`;

// 标签开头的正则 捕获的内容是标签名
const startTagOpen = new RegExp(`^<${qnameCapture}`);

// 匹配结束标签   先是任意数量的空白字符，而后是 />
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`);

// 匹配属性的  分组1 拿到的是属性名  , 分组3 ，4， 5 拿到的是key对应的值
// <div id="mydiv" class="myClass" style="color: #ff0000" >
// id="mydiv"、class="myClass"、style="color: #ff0000"
const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/;

// 匹配标签结束的 /> or >
const startTagClose = /^\s*(\/?)>/;


/**
 * 解析模版字符串，生成 AST 语法树
 * @param {*} template 模版字符串
 * @returns {AST} root ast 语法树
 */

export default function parse(template) {
  // 存放所有没有配对的开始标签 AST 对象
  const stack = []
  let root  = null
  let html = template
  console.log(html)

  function advance(n) {
    html = html.substring(n)
    console.log('剩下 html: ', html)
  }

  function createASTElement(tagName, attrs) {
    return {
      tag: tagName,
      attrs,
      children: [],
      parent: null,
      type: 1
    }
  }



  // 开始标签进栈 （先进后出原理）
  function start(tagName, attrs) {
    let element = createASTElement(tagName, attrs)
    if (root == null) {
      root = element
    }
    let parent = stack[stack.length - 1] // 取到栈中的最后一个
    if (parent) {
      element.parent = parent       // 让这个元素记住自己的父亲是谁
      parent.children.push(element) // 让父亲记住儿子是谁
    }
    stack.push(element) //入栈
  }

  // 结束标签出栈
  function end(tagName) {
    stack.pop() //出栈
  }

  // 处理标签内容
  function chars(text) {
    text = text.replace(/\s/g, '')
    if (text) {
      let parent = stack[stack.length - 1]
      parent.children.push({ // 增加一个子元素
        type: 3, // 类型 3 表示文本
        text
      })
    }
  }

  //  ast 描述的是语法本身 ，语法中没有的，不会被描述出来  虚拟dom 是描述真实dom的可以自己增添属性
  while (html) {
    // 1. 处理开始标签 （就是处理 <div id="app">{{name}}</div>  的 <div id="app"> 部分）
    let textEnd = html.indexOf('<')
    if (textEnd === 0) {
      const startTagMatch = parseStartTag(); // 解析开始标签  {tagName:'div',attrs:[{name:"id",value:"app"}]}
      if (startTagMatch) {
        start(startTagMatch.tagName, startTagMatch.attrs)
        continue
      }

      // 3. 处理结束标签 （就是处理 <div id="app">{{name}}</div>  的 </div> 部分）
      let matches
      if (matches = html.match(endTag)) {
        end(matches[1])
        advance(matches[0].length)
        continue
      }
    }

    // 2. 处理标签内容 （就是处理 <div id="app">{{name}}</div> 的 {{name}} 部分）
    let text
    if (textEnd >= 0) {
      text = html.substring(0, textEnd)
    }
    if (text) {
      advance(text.length) // html 删去 text， 处理一点删一点
      chars(text)
    }
  }

  function parseStartTag() {
    const matches = html.match(startTagOpen) // 获取标签头 <div id="app">{{name}}</div> 的 <div 部分
    if (matches) {
      const match = {
        tagName: matches[1],
        attrs: []
      }
      advance(matches[0].length) // 删除html前面匹配到的标签名字符串
      let end, attr
      while (!(end = html.match(startTagClose)) && (attr = html.match(attribute))) {
        // while循环取属性 直到取完
        match.attrs.push({ name: attr[1], value: attr[3] || attr[4] || attr[5] || true })
        advance(attr[0].length) // 取到一个属性删除一个
      }
      if (end) {
        advance(end[0].length)
        return match
      }
    }
  }


  return root
}
