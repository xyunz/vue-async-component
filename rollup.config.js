import typescript from "@rollup/plugin-typescript";

export default {
  input: 'src/index.ts',
  plugins: [
    typescript()
  ],
  external: ["babel-standalone"],
  output: {
    file: 'dist/vue-async-component.js',
    format: 'umd',
    name: 'AsyncComponent',
    globals: {
      "babel-standalone": "Babel"
    },
  }
}