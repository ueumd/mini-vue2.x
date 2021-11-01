/**
 codegen 代码生成器
 */

export function generate(ast, options) {
  // 渲染函数字符串形式
  const state = new CodegenState(options)
  const code = ast ? (ast.tag === 'script' ? 'null' : genElement(ast, state)) : '_c("div")'
  return {
    render: new Function(`with(this){ return ${code}}`)
  }
}

// DONE 依据 key 值，选出相应模块函数
export function pluckModuleFunction(modules, key) {
  return modules ? modules.map((m) => m[key]).filter((_) => _) : [];
}


export class CodegenState {
  constructor (options) {
    this.options = options
    this.dataGenFns = pluckModuleFunction(options.modules, 'genData')
  }
}

export function genElement (el, state) {
  if (el.staticRoot && !el.staticProcessed) {
    // return genStatic(el, state)
  } else if (el.once && !el.onceProcessed) {
    // return genOnce(el, state)
  } else if (el.for && !el.forProcessed) {
    // return genFor(el, state)
  } else if (el.if && !el.ifProcessed) {
    // return genIf(el, state)
  } else if (el.tag === 'template' && !el.slotTarget) {
    return genChildren(el, state) || 'void 0'
  } else if (el.tag === 'slot') {
    return genSlot(el, state)
  } else {
    // component or element
    let code
    if (el.component) {
      code = genComponent(el.component, el, state)
    } else {

      // 进入这里
      const data = el.plain ? undefined : genData(el, state)

      const children = el.inlineTemplate ? null : genChildren(el, state, true)
      code = `_c('${el.tag}'${data ? `,${data}` : ''}${children ? `,${children}` : ''})`
    }
    // module transforms
    // for (let i = 0; i < state.transforms.length; i++) {
    //   code = state.transforms[i](el, code)
    // }
    return code
  }
}

export function genData (el, state) {
  var data = '{';

  // 首先对directives进行处理
  // directives可能会对el上的其他属性有影响，所以先处理
  var dirs = genDirectives(el, state);
  if (dirs) { data += dirs + ','; }

  //根据本文的例子，没有执行的判断，代码都省略了
  /*处理key,ref,refInFor,pre,component*/

  // module data generation functions
  for (var i = 0; i < state.dataGenFns.length; i++) {
    data += state.dataGenFns[i](el);//调用genData对class进行处理
  }
  if (el.attrs) {
    //进入该判断，调用genProps，对el的属性进行处理
    data += "attrs:{" + (genProps(el.attrs)) + "},";
  }
  /*处理props,events,nativeEvents,slotTarget,scopedSlots,model,inlineTemplate*/
  data = data.replace(/,$/, '') + '}';
  // v-bind data wrap
  if (el.wrapData) {
    data = el.wrapData(data);
  }
  // v-on data wrap
  if (el.wrapListeners) {
    data = el.wrapListeners(data);
  }
  return data
}

function genDirectives (el, state) {
  const dirs = el.directives
  if (!dirs) return
  let res = 'directives:['
  let hasRuntime = false
  let i, l, dir, needRuntime
  for (i = 0, l = dirs.length; i < l; i++) {
    dir = dirs[i]
    needRuntime = true
    const gen = state.directives[dir.name]
    if (gen) {
      // compile-time directive that manipulates AST.
      // returns true if it also needs a runtime counterpart.
      needRuntime = !!gen(el, dir, state.warn)
    }
    if (needRuntime) {
      hasRuntime = true
      res += `{name:"${dir.name}",rawName:"${dir.rawName}"${
        dir.value ? `,value:(${dir.value}),expression:${JSON.stringify(dir.value)}` : ''
      }${
        dir.arg ? `,arg:${dir.isDynamicArg ? dir.arg : `"${dir.arg}"`}` : ''
      }${
        dir.modifiers ? `,modifiers:${JSON.stringify(dir.modifiers)}` : ''
      }},`
    }
  }
  if (hasRuntime) {
    return res.slice(0, -1) + ']'
  }
}

function genProps (props) {
  var res = '';
  // 将属性名，属性值拼接成 "属性名":"属性值"形式的字符串
  //本文例子"id":"test"
  for (var i = 0; i < props.length; i++) {
    var prop = props[i];
    /* istanbul ignore if */
    {
      res += "\"" + (prop.name) + "\":" + (transformSpecialNewlines(prop.value)) + ",";
    }
  }
  return res.slice(0, -1)
}

function genChildren (
  el,
  state,
  checkSkip,
  altGenElement,
  altGenNode
) {
  var children = el.children;
  if (children.length) {
    var el$1 = children[0];
    //对v-for进行简单优化
    if (children.length === 1 &&
      el$1.for &&
      el$1.tag !== 'template' &&
      el$1.tag !== 'slot'
    ) {
      return (altGenElement || genElement)(el$1, state)
    }
    var normalizationType = checkSkip
      ? getNormalizationType(children, state.maybeComponent)
      : 0;
    var gen = altGenNode || genNode;
    return ("[" + (children.map(function (c) { return gen(c, state); }).join(',')) + "]" + (normalizationType ? ("," + normalizationType) : ''))
  }
}


function getNormalizationType (children, maybeComponent) {
  let res = 0
  for (let i = 0; i < children.length; i++) {
    const el = children[i]
    if (el.type !== 1) {
      continue
    }
    if (needsNormalization(el) ||
      (el.ifConditions && el.ifConditions.some(c => needsNormalization(c.block)))) {
      res = 2
      break
    }
    // if (maybeComponent(el) ||
    //   (el.ifConditions && el.ifConditions.some(c => maybeComponent(c.block)))) {
    //   res = 1
    // }
  }
  return res
}

function needsNormalization (el) {
  return el.for !== undefined || el.tag === 'template' || el.tag === 'slot'
}

function genNode (node, state) {
  if (node.type === 1) {
    return genElement(node, state)
  } if (node.type === 3 && node.isComment) {
    return genComment(node)
  } else {
    return genText(node)
  }
}

function genText (text) {
  return ("_v(" + (text.type === 2
    ? text.expression // no need for () because already wrapped in _s()
    : transformSpecialNewlines(JSON.stringify(text.text))) + ")")
}

function genComment (comment) {
  return ("_e(" + (JSON.stringify(comment.text)) + ")")
}

// #3895, #4268
function transformSpecialNewlines (text) {
  return text
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}
