import { SFCBlock } from "./sfc-descriptor";

export default function (id: string, styles: Array<SFCBlock>): Array<Element> {
  const head = document.getElementsByTagName("head")[0];

  const elements: Array<Element> = [];
  styles.forEach(style => {
    let code = style.content;

    if (style.hasAttr("scoped")) {
      code = code.replace(/((^|,|})\s*[^\s,{]+)(?=[^}]*{)/g, $0 => {
        return `[${id}] ${$0}`;
      });
    }

    const el = document.createElement("style");

    el.setAttribute(id, "");
    el.type = "text/css";
    el.innerHTML = code;

    head.appendChild(el);
    elements.push(el);
  });

  return elements;
}