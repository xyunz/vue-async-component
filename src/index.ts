import { VueConstructor } from "vue";
import { isDef } from "./util";
import AsyncComponent from "./component";

function install(Vue: VueConstructor) {
  Vue.component(AsyncComponent.name, AsyncComponent);
}

if (isDef(window) && isDef(window.Vue)) {
  install(window.Vue);
}

export default {
  install
}