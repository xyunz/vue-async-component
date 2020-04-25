export const UNDEFINED = void 0;

export function isUndef(def: any): boolean {
  return def === null || typeof def === 'undefined';
}

export function isDef(def: any): boolean {
  return !isUndef(def);
}

function randomLetter() {
  return String.fromCharCode((97+(Math.random())*26)|0);
}

function s4(): string {
  return (((1+Math.random())*0x10000)|0).toString(16).substring(1)
}

export function uuid(): string {
  return randomLetter() + s4() + s4().substring(1);
}