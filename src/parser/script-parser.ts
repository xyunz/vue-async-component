import { ComponentOptions } from "vue";
import { SFCBlock } from "./sfc-descriptor";
import { UNDEFINED } from "../util";
import { transform } from "babel-standalone";

export default function (script: SFCBlock, sourceURL: string): ComponentOptions<any> {

  // transform with babel
  const code = transform(script.content, { presets: ["es2015"] }).code;

  // default exports
  const exports = {
    default: UNDEFINED
  };

  // call script and export module
  new Function(
    "exports",
    `${code}\n//# sourceURL=${sourceURL}`
  )(
    exports
  );

  return exports.default;
}