export class SFCDescriptor {
  name: string;
  template: SFCBlock;
  script: SFCBlock;
  styles: Array<SFCBlock> = [];

  constructor(url: string = "") {
    this.name = url.replace(/(\.[^./]+)?\/*$/, "").replace(/^\/*([^/]+\/+)+/, "")
  }

  addBlock(block: SFCBlock) {
    switch (block.type) {
      case "template": this.template = block; break;
      case "script": this.script = block; break;
      case "style": this.styles.push(block); break;
    }
  }
}

export class SFCBlock {
  type: string;
  content: string;
  attrs: {[attribute: string]: string} = {};

  constructor(type: string, content: string = "") {
    this.type = type;
    this.content = content;
  }

  appendContent(content: string) {
    this.content += content;
  }

  trim(n: number) {
    this.content = this.content.slice(0, -n);
  }

  setAttr(name: string, value: string) {
    this.attrs[name] = value;
  }

  hasAttr(name: string) {
    return this.attrs.hasOwnProperty(name);
  }

  getAttr(name: string) {
    return this.attrs[name];
  }
}