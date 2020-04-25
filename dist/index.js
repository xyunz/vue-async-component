(function () {

  Vue.use(VueCodemirror);

  const DEFAULT_INDEX_CODE = `<html lang="en">
  <head>
    <meta charset="UTF-8">
    
    <script type="text/javascript" src="https://cdn.jsdelivr.net/npm/vue@2.6.11/dist/vue.min.js"></script>
    <script type="text/javascript" src="https://cdn.jsdelivr.net/npm/babel-standalone@6.26.0/babel.min.js"></script>
    <script type="text/javascript" src="vue-async-component.js"></script>
  </head>
  <body>
    <div id="app">
      <input v-model="msg" />
      <hr/>
      <button @click="src = null">clear</button>
      <hr/>
      <async-component :src="src" :msg="msg" class="aaa">
        <template v-slot:my-slot="slot">
          <h1>{{ slot.msg }}</h1>
        </template>
      </async-component>
      <hr/>
    </div>
    <script type="text/javascript">
      new Vue({
        el: "#app",
        data: {
          src: "child.vue",
          msg: "hello",
        }
      });
    </script>
  </body>
</html>`;

  const DEFAULT_COMPONENT_CODE = `<template>
  <div>
    <slot name="my-slot" :msg="msg"></slot>
    <span class="msg">{{msg}}</span>
  </div>
</template>
<script>
export default {
  props: {
    msg: String
  }
}
</script>
<style scoped>
  .aaa {
    color: red
  }
</style>`;

  const mockXHR = {
    readyState: 4,
    status: 200,
    responseText: "",
    open() {},
    send() {
      // mock async
      setTimeout(() => this.onreadystatechange(), Math.round(Math.random() * 1000));
    },
    onreadystatechange: () => {}
  };

  new Vue({
    el: "#app",
    data: {
      editorOptions: {
        mode: "text/x-vue",
        lineNumbers: true,
        line: true,
        tabSize: 2,
      },
      indexCode: DEFAULT_INDEX_CODE,
      componentCode: DEFAULT_COMPONENT_CODE
    },
    methods: {
      run() {
        const doc = this.$refs.preview.contentDocument;

        doc.childNodes.forEach(cn => doc.removeChild(cn));
        doc.write(this.indexCode);
        doc.close();

        mockXHR.responseText = this.componentCode;
      }
    },

    mounted() {
      this.$refs.preview.contentWindow.XMLHttpRequest = function () {
        return mockXHR;
      }

      this.run();
    }
  });

})();