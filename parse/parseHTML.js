import {canBeLeftOpenTag, isUnaryTag, isPlainTextElement, isNonPhrasingTag} from './utils.js'

// 定义几个全局变量
let stack = []; // 保存开始标签tag，和上面类似
let lastTag; // 保存前一个标签，类似于currentParent
let index = 0; // template开始解析索引
let html; // 剩余的template模板
let opt; // 保存对options的引用，方便调用start、end、chars、comment方法

// 匹配属性
const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/
const ncname = '[a-zA-Z_][\\w\\-\\.]*'
const qnameCapture = `((?:${ncname}\\:)?${ncname})`
// 匹配开始标签开始部分
const startTagOpen = new RegExp(`^<${qnameCapture}`)
// 匹配开始标签结束部分
const startTagClose = /^\s*(\/?)>/
// 匹配结束标签
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`)
// 匹配注释
const comment = /^<!\--/

export function parseHTML (template, options) {
  html = template;
  opt = options;
  // 不断循环解析html，直到为""
  while(html) {
    // 如果标签tag不是script/style/textarea
    if (!lastTag || !isPlainTextElement(lastTag)) {
      // 刚开始或tag不为script/style/textarea
      let textEnd = html.indexOf('<');
      if (textEnd === 0) {
        // html以"<"开始

        // 处理html注释
        if (html.match(comment)) {
          let commentEnd = html.indexOf('-->');
          if (commentEnd >= 0) {
            if (opt.shouldKeepComment && opt.comment) {
              // 保存注释内容
              opt.comment(html.substring(4, commentEnd))
            }
            // 调整index以及html
            advance(commentEnd + 3);
            continue;
          }
        }
        // 处理 html条件注释, 如<![if !IE]>

        // 处理html声明Doctype

        // 处理开始标签startTaga
        const startTagMatch = parseStartTag();
        if (startTagMatch) {
          handleStartTag(startTagMatch);
          continue;
        }

        // 匹配结束标签endTag
        const endTagMatch = html.match(endTag);
        if (endTagMatch) {
          // 调整index以及html
          advance(endTagMatch[0].length);
          // 处理结束标签
          parseEndTag(endTagMatch[1]);
          continue;
        }
      }
      let text;
      if (textEnd > 0) {
        // html为纯文本，需要考虑文本中含有"<"的情况，此处省略，请自行查看源码
        text = html.slice(0, textEnd);
        // 调整index以及html
        advance(textEnd);
      }
      if (textEnd < 0) {
        // htlml以文本开始
        text = html;
        html = '';
      }
      // 保存文本内容
      if (opt.chars) {
        opt.chars(text);
      }
    } else {
      // tag为script/style/textarea
      let stackedTag = lastTag.toLowerCase();
      let tagReg = new RegExp('([\\s\\S]*?)(</' + stackedTag + '[^>]*>)', 'i');

      // 简单处理下，详情请查看源码
      let match = html.match(tagReg);
      if (match) {
        let text = match[1];
        if (opt.chars) {
          // 保存script/style/textarea中的内容
          opt.chars(text);
        }
        // 调整index以及html
        advance(text.length + match[2].length);
        // 处理结束标签</script>/</style>/</textarea>
        parseEndTag(stackedTag);
      }
    }
  }


  // 修改模板不断解析后的位置，以及截取模板字符串，保留未解析的template
  function advance (n) {
    index += n;
    html = html.substring(n)
  }

  function parseStartTag () {
    let start = html.match(startTagOpen);
    if (start) {
      // 结构：["<div", "div", index: 0, groups: undefined, input: "..."]
      let match = {
        tagName: start[1],
        attrs: [],
        start: index
      }

      // 调整index以及html
      advance(start[0].length);

      // 循环匹配属性
      let end, attr;
      while (!(end = html.match(startTagClose))&& (attr = html.match(attribute))) {
        // 结构：["id="app"", "id", "=", "app", undefined, undefined, groups: undefined, index: 0, input: "..."]
        advance(attr[0].length);
        match.attrs.push(attr);
      }
      // 匹配到开始标签的结束位置
      if (end) {
        match.unarySlash = end[1]; // end[1]匹配的是"/",如<br/>
        // 调整index以及html
        advance(end[0].length)
        match.end = index;
        return match;
      }
    }
  }

  function handleStartTag(match) {
    const tagName = match.tagName;
    const unarySlash = match.unarySlash;

    if (opt.expectHTML) {

      if (lastTag === 'p' && isNonPhrasingTag(tagName)) {
        // 如果p标签包含了段落标签，如div、h1、h2等
        // 形如: <p><h1></h1></p>
        // 与parseEndTag中tagName为p时相对应，处理</p>，添加<p>
        // 处理结果: <p></p><h1></h1><p></p>
        parseEndTag(lastTag);
      }
      if (canBeLeftOpenTag(tagName) && lastTag === tagName) {
        // 如果标签闭合标签可以省略"/"
        // 形如：<li><li>
        // 处理结果: <li></li>
        parseEndTag(tagName);
      }
    }

    // 处理属性结构（name和vulue形式）
    let attrs = [];
    attrs.length = match.attrs.length;
    for (let i = 0, len = match.attrs.length; i < len; i++) {
      // attrs[i] = { id: 'app' }
      attrs[i] = {
        name: match.attrs[i][1],
        value: match.attrs[i][3] || match.attrs[i][4] || match.attrs[i][5]
      }
    }
    // 判断是不是自闭和标签，如<br>
    let unary = isUnaryTag(tagName) || !!unarySlash;

    // 如果不是自闭合标签，保存到stack中，用于endTag匹配，
    if (!unary) {
      stack.push({
        tag: tagName,
        lowerCasedTag: tagName.toLowerCase(),
        attrs: attrs
      })
      // 重新设置上一个标签
      lastTag = tagName;
    }

    if (opt.start) {
      opt.start(tagName, attrs, unary)
    }
  }

  function parseEndTag (tagName) {
    let pos = 0;

    // 匹配stack中开始标签中，最近的匹配标签位置
    if (tagName) {
      tagName = tagName.toLowerCase();
      for (pos = stack.length - 1; pos >= 0; pos--) {
        if (stack[pos].lowerCasedTag === tagName) {
          break;
        }
      }
    }

    // 如果可以匹配成功
    if (pos >= 0) {
      let i = stack.length - 1;
      if (i > pos || !tagName) {
        console.error(`tag <${stack[i - 1].tag}> has no matching end tag.`)
      }
      // 如果匹配正确: pos === i
      if (opt.end) {
        opt.end();
      }
      // 将匹配成功的开始标签出栈，并修改lastTag为之前的标签
      stack.length = pos;
      lastTag = pos && stack[stack.length - 1].tagName;
    } else if (tagName === 'br') {
      // 处理: </br>
      if (opt.start) {
        opt.start(tagName, [], true)
      }
    } else if (tagName === 'p') {
      // 处理上面说的情况：<p><h1></h1></p>
      if (opt.start) {
        opt.start(tagName, [], false);
      }
      if (opt.end) {
        opt.end();
      }
    }
  }
}
