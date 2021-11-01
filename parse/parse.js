import {parseHTML} from './parseHTML.js'
import {parseText} from "./parseText.js";

import {isForbiddenTag} from './utils.js'

export function parse (template, options) {
  let root; // 最终返回的AST
  let currentParent; // 设置当前标签的父节点
  let stack = []; // 维护一个栈，保存解析过程中的开始标签，用于匹配结束标签
  // 解析模板的具体实现
  parseHTML(template, {
    expectHTML: true,
    shouldKeepComment: options.comments, // 是否保存注释
    delimiters: options.delimiters, // 自定义的分隔符
    start (tag, attrs, unary) {
      // 处理开始标签，解析的开始标签入栈，设置children以及parent等（其中的属性解析请查看源码）
      let element = createASTElement(tag, attrs, currentParent);

      // 如果tag为script/style标签，设置属性，返回的AST中不含该标签元素结构
      if (isForbiddenTag(tag)) {
        element.forbidden = true;
        console.error('Templates should only be responsible for mapping the state to the ' +
          'UI. Avoid placing tags with side-effects in your templates, such as ' +
          "<" + tag + ">" + ', as they will not be parsed.')
      }

      // 设置根元素节点
      if (!root) {
        root = element;
      }

      // 设置元素的父节点，将当前元素的添加到父节点的children中
      if (currentParent && !element.forbidden) {
        currentParent.children.push(element);
        element.parent = currentParent;
      }

      // 如果不是自闭和标签（没有对应的结束标签），则需要将当前tag入栈，用于匹配结束标签时，调用end方法匹配最近的标签，同时设置父节点为当前元素
      if (!unary) {
        currentParent = element;
        stack.push(element);
      }
    },
    end () {
      // 将匹配结束的标签出栈，修改父节点为之前上一个元素
      let element = stack.pop();
      currentParent = stack[stack.length - 1];
    },
    chars (text) {
      // 保存文本
      if (!currentParent) {
        console.error('Component template requires a root element, rather than just text.');
      } else {
        const children = currentParent.children;
        // text.trim() 处理换行符 空格等
        if (text.trim()) {
          let res;
          // 如果文本节点包含表达式
          if (res = parseText(text, options.delimiters)) {
            children.push({
              type: 2,
              expression: res.expression,
              tokens: res.tokens,
              text
            })
          } else {
            children.push({
              type: 3,
              text
            })
          }
        }
      }
    },
    comment (text) {
      // 保存注释
      if (currentParent) {
        currentParent.children.push({
          type: 3,
          text,
          isComment: true
        })
      }
    }
  })
  return root;
}


function createASTElement (tag, attrs, parent) {
  // attrs：[{name: 'id', value: 'app'}, {name: 'class', value: 'demo'}]
  let attrsMap = {}
  for (let i = 0, len = attrs.length; i < len; i++) {
    attrsMap[attrs[i].name] = attrs[i].value;
  }

  // attrsMap = {id: 'app', class: 'demo'}
  return {
    type: 1,
    tag,
    attrsList: attrs,
    attrsMap: attrsMap,
    parent,
    children: []
  }
}

