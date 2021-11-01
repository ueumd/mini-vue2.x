
// script、style、textarea标签
export function isPlainTextElement (tag) {
  let tags = {
    script: true,
    style: true,
    textarea: true
  }
  return tags[tag]
}

// script、style标签
export function isForbiddenTag (tag) {
  let tags = {
    script: true,
    style: true
  }
  return tags[tag]
}

// 自闭和标签
export function isUnaryTag (tag) {
  let strs = `area,base,br,col,embed,frame,hr,img,input,isindex,keygen,link,meta,param,source,track,wbr`;
  let tags = makeMap(strs);
  return tags[tag];
}

// 结束标签可以省略"/"
export function canBeLeftOpenTag (tag) {
  let strs = `colgroup,dd,dt,li,options,p,td,tfoot,th,thead,tr,source`;
  let tags = makeMap(strs);
  return tags[tag];
}

// 段落标签
export function isNonPhrasingTag (tag) {
  let strs = `address,article,aside,base,blockquote,body,caption,col,colgroup,dd,details,dialog,div,dl,dt,fieldset,figcaption,figure,footer,form,h1,h2,h3,h4,h5,h6,head,header,hgroup,hr,html,legend,li,menuitem,meta,optgroup,option,param,rp,rt,source,style,summary,tbody,td,tfoot,th,thead,title,tr,track`;
  let tags = makeMap(strs);
  return tags[tag];
}

// 结构：如
//  {
//    script: true,
//    style: true
//  }
export function makeMap(strs) {
  let tags = strs.split(',');
  let o = {}
  for (let i = 0; i < tags.length; i++) {
    o[tags[i]] = true;
  }
  return o;
}

