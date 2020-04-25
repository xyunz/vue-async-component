import { ComponentOptions } from "vue";
import { isDef } from "../util";

import parseSFC from "../parser/sfc-parser"

export default function loadComponent(
  id: string,
  src: string,
  callback: (component: ComponentOptions<any>, styles: Array<Element>) => void,
): void {
  if (isDef(src)) {
    const xhr = new XMLHttpRequest();

    xhr.open("Get", src);
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          parseSFC(id, src, xhr.responseText, callback);
        }
      }
    }
    xhr.send();
  } else {
    callback({}, []);
  }
}