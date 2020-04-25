import { ComponentOptions } from "vue";
import { SFCDescriptor, SFCBlock } from "./sfc-descriptor";
import parseScript from "./script-parser";
import parseStyles from "./style-parser";

const unicodeRegExp = /a-zA-Z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C-\u200D\u203F-\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD/;

// Regular Expressions for parsing tags and attributes
const attribute = /^\s*([^\s""<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|"([^"]*)"+|([^\s""=<>`]+)))?/;
const ncname = "[a-zA-Z_][\\-\\.0-9_a-zA-Z" + (unicodeRegExp.source) + "]*";
const qnameCapture = "((?:" + ncname + "\\:)?" + ncname + ")";
const startTagOpen = new RegExp(("^<" + qnameCapture));
const startTagClose = /^\s*(\/?)>/;
const endTag = new RegExp(("^<\\/" + qnameCapture + "[^>]*>"));
const doctype = /^<!DOCTYPE [^>]+>/i;
// #7298: escape - to avoid being pased as HTML comment when inlined in page
const comment = /^<!\--/;
const conditionalComment = /^<!\[/;

function parseHTML(sfc: SFCDescriptor, html: string) {
  let ltIndex: number, gtIndex: number, match: RegExpMatchArray;

  while (html) {
    // 获取 html 中 `<` 的位置
    ltIndex = html.indexOf("<");
    if (ltIndex < 0) {
      break;
    }

    // 忽略 `<` 之前的内容
    advance(ltIndex);

    // 忽略注释，条件注释，DOCTYPE和没有起始标签的结束标签
    // Comment:
    if (comment.test(html) && (gtIndex = html.indexOf("-->")) >= 0) {
      advance(gtIndex + 3);
      continue;
    }
    // Conditional Comment:
    if (conditionalComment.test(html) && (gtIndex = html.indexOf("]>")) >= 0) {
      advance(gtIndex + 2);
      continue;
    }
    // Doctype:
    match = html.match(doctype);
    if (match) {
      advance(match[0].length);
      continue;
    }
    // End Tag:
    match = html.match(endTag);
    if (match) {
      advance(match[0].length);
      continue;
    }
    // 解析起始标签
    // Start Tag:
    match = html.match(startTagOpen);
    if (match) {
      advance(match[0].length);

      const tagName: string = match[1];
      const block: SFCBlock = new SFCBlock(tagName);

      let end: RegExpMatchArray, attr: RegExpMatchArray;
      // 解析标签属性
      while (!(end = html.match(startTagClose)) && (attr = html.match(attribute))) {
        advance(attr[0].length);

        block.setAttr(attr[1], attr[3]);
      }

      // 只需要解析最外层标签
      if (end) {
        advance(end[0].length);

        let level: number = 1, content: string = "";
        let startTagMatch: RegExpMatchArray, endTagMatch: RegExpMatchArray;

        while (level-- && (endTagMatch = html.match(new RegExp("([\\s\\S]*?)(</" + tagName + "[^>]*>)", "i")))) {
          content = endTagMatch[0];

          advance(content.length);

          block.appendContent(content);

          // 相同标签嵌套
          startTagMatch = content.match(new RegExp("<" + tagName + "[^>]*>", "g"));
          if (startTagMatch) {
            level += startTagMatch.length
          }

          if (!level) {
            // 去除关闭标签
            block.trim(endTagMatch[2].length);
          }
        }

        sfc.addBlock(block);
      }
    } else {
      // 如果以上情况均未匹配成功
      // 则说明该 `<` 为文本内容
      // 忽略之
      advance(1);
    }
  }

  function advance(n: number): void {
    html = html.substring(n);
  }
}

export default function (
  id: string,
  url: string,
  content: string = "",
  callback: (component: ComponentOptions<any>, styles: Array<Element>) => void
): void {
  content = content.trim();

  const sfc: SFCDescriptor = new SFCDescriptor(url);

  if (content.charAt(0) === "<") {
    parseHTML(sfc, content);
  } else {
    sfc.addBlock(new SFCBlock("script", content));
  }

  const options: ComponentOptions<any> = sfc.script ? parseScript(sfc.script, url) : {};

  options.name = sfc.name;

  if (sfc.template && !options.template) {
    options.template = sfc.template.content;
  }

  const styles = parseStyles(id, sfc.styles);

  callback(options, styles);
}