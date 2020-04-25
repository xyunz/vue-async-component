import { ComponentOptions, CreateElement, VNode } from "vue";
import { UNDEFINED, isDef, isUndef, uuid } from "../util";
import loadComponent from "./loader";

function redefineRef(vm, $refs, refName, ref) {
  const refDescriptor = {
    _value: ref,
    get() {
      return refDescriptor._value;
    },
    set(value) {
      if (value !== vm) {
        refDescriptor._value = value;
      }
    }
  };

  Object.defineProperty($refs, refName, refDescriptor)
}

const AsyncComponent: ComponentOptions<any> = {
  data() {
    return {
      id: uuid(),
      component: UNDEFINED,
      styles: [],
      childIndex: -1,
      child: this,
      refName: UNDEFINED,
      ref: this
    };
  },
  props: {
    src: String
  },
  methods: {
    computeChildIndex() {
      const { child, $parent } = this;
      this.childIndex = isDef(child) ? $parent.$children.indexOf(child) : -1;
    },
    computeRefName() {
      const $refs = this.$parent.$refs;
      const refName = this.refName;

      if ($refs[refName] === this.ref) {
        $refs[refName] = UNDEFINED;
      }

      for (let refName in $refs) {
        if ($refs.hasOwnProperty(refName) && $refs[refName] === this) {
          this.refName = refName;
        }
      }
    },
    updateComponent(): void {
      const { childIndex, refName, $el, $parent, $children } = this;

      let child, ref;

      if (childIndex >= 0) {
        $parent.$children.splice(childIndex, 1);
      }

      if ($children.length > 0) {
        child = $children[0];

        const styles = this.styles.slice();

        child.$on("hook:destroyed", () => {
          styles.forEach(style => style.parentNode.removeChild(style));
        });

        child.$parent = $parent;
        $parent.$children.splice(childIndex, 0, child);

        ref = child;
      } else {
        ref = $el;
      }

      if (isDef(refName)) {
        redefineRef(this, $parent.$refs, refName, ref);
      }

      this.child = child;
      this.ref = ref;
    }
  },
  watch: {
    src: {
      handler(src: string): void {
        loadComponent(this.id, src, (component, styles) => {
          const { name } = component;

          this.$options.components = {
            [name]: component
          }
          this.component = name;
          this.styles = styles;
        });
      },
      immediate: true
    }
  },

  render(createElement: CreateElement): VNode {
    const { component, $attrs: props, $listeners: on, $slots, $scopedSlots: scopedSlots } = this;
    const slots = $slots.default || [];

    for (let slot in $slots) {
      if ($slots.hasOwnProperty(slot) && slot != "default") {
        $slots[slot].forEach(component => {
          if (isUndef(component.data)) {
            component.data = {};
          }

          component.data.slot = slot;
          component.context = this;

          slots.push(component);
        });
      }
    }

    return createElement(component, {
      props,
      on,
      scopedSlots
    }, slots);
  },

  beforeMount(): void {
    this.computeChildIndex();
  },
  mounted(): void {
    this.$el.parentNode.setAttribute(this.id, "");
    this.computeRefName();
    this.updateComponent();
  },
  beforeUpdate(): void {
    this.computeChildIndex();
  },
  updated(): void {
    this.computeRefName();
    this.updateComponent();
  },

  name: "AsyncComponent",
  inheritAttrs: false
}

export default AsyncComponent;