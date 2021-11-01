// 匹配默认的分隔符 "{{}}"
const defaultTagRE = /\{\{((?:.|\n)+?)\}\}/g

export function parseText (text, delimiters) {
  let open;
  let close;
  let resDelimiters;
  // 处理自定义的分隔符
  if (delimiters) {
    open = delimiters[0].replace(regexEscapeRE, '\\$&');
    close = delimiters[1].replace(regexEscapeRE, '\\$&');
    resDelimiters = new RegExp(open + '((?:.|\\n)+?)' + close, 'g');
  }
  const tagRE = delimiters ? resDelimiters : defaultTagRE;
  // 没有匹配，文本中不含表达式，返回
  if (!tagRE.test(text)) {
    return;
  }
  const tokens = []
  const rawTokens = [];

  let lastIndex = tagRE.lastIndex = 0;
  let index;
  let match;
  // 循环匹配本文中的表达式
  while(match = tagRE.exec(text)) {
    index = match.index;

    if (index > lastIndex) {
      let value = text.slice(lastIndex, index);
      tokens.push(JSON.stringify(value));
      rawTokens.push(value)
    }
    // 取出'{{ }}'中间的变量exp
    // 此处需要处理过滤器，暂不处理，请查看源码
    let exp = match[1].trim();
    tokens.push(`_s(${exp})`);
    rawTokens.push({'@binding': exp})
    lastIndex = index + match[0].length;
  }
  if (lastIndex < text.length) {
    let value = text.slice(lastIndex);
    tokens.push(JSON.stringify(value));
    rawTokens.push(value);
  }
  return {
    expression: tokens.join('+'),
    tokens: rawTokens
  }
}
