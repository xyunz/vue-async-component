(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('babel-standalone')) :
    typeof define === 'function' && define.amd ? define(['babel-standalone'], factory) :
    (global = global || self, global.AsyncComponent = factory(global.Babel));
}(this, (function (babelStandalone) { 'use strict';

    var UNDEFINED = void 0;
    function isUndef(def) {
        return def === null || typeof def === 'undefined';
    }
    function isDef(def) {
        return !isUndef(def);
    }
    function randomLetter() {
        return String.fromCharCode((97 + (Math.random()) * 26) | 0);
    }
    function s4() {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    }
    function uuid() {
        return randomLetter() + s4() + s4().substring(1);
    }

    var SFCDescriptor = /** @class */ (function () {
        function SFCDescriptor(url) {
            if (url === void 0) { url = ""; }
            this.styles = [];
            this.name = url.replace(/(\.[^./]+)?\/*$/, "").replace(/^\/*([^/]+\/+)+/, "");
        }
        SFCDescriptor.prototype.addBlock = function (block) {
            switch (block.type) {
                case "template":
                    this.template = block;
                    break;
                case "script":
                    this.script = block;
                    break;
                case "style":
                    this.styles.push(block);
                    break;
            }
        };
        return SFCDescriptor;
    }());
    var SFCBlock = /** @class */ (function () {
        function SFCBlock(type, content) {
            if (content === void 0) { content = ""; }
            this.attrs = {};
            this.type = type;
            this.content = content;
        }
        SFCBlock.prototype.appendContent = function (content) {
            this.content += content;
        };
        SFCBlock.prototype.trim = function (n) {
            this.content = this.content.slice(0, -n);
        };
        SFCBlock.prototype.setAttr = function (name, value) {
            this.attrs[name] = value;
        };
        SFCBlock.prototype.hasAttr = function (name) {
            return this.attrs.hasOwnProperty(name);
        };
        SFCBlock.prototype.getAttr = function (name) {
            return this.attrs[name];
        };
        return SFCBlock;
    }());

    function parseScript (script, sourceURL) {
        // transform with babel
        var code = babelStandalone.transform(script.content, { presets: ["es2015"] }).code;
        // default exports
        var exports = {
            "default": UNDEFINED
        };
        // call script and export module
        new Function("exports", code + "\n//# sourceURL=" + sourceURL)(exports);
        return exports["default"];
    }

    function parseStyles (id, styles) {
        var head = document.getElementsByTagName("head")[0];
        var elements = [];
        styles.forEach(function (style) {
            var code = style.content;
            if (style.hasAttr("scoped")) {
                code = code.replace(/((^|,|})\s*[^\s,{]+)(?=[^}]*{)/g, function ($0) {
                    return "[" + id + "] " + $0;
                });
            }
            var el = document.createElement("style");
            el.setAttribute(id, "");
            el.type = "text/css";
            el.innerHTML = code;
            head.appendChild(el);
            elements.push(el);
        });
        return elements;
    }

    var unicodeRegExp = /a-zA-Z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C-\u200D\u203F-\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD/;
    // Regular Expressions for parsing tags and attributes
    var attribute = /^\s*([^\s""<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|"([^"]*)"+|([^\s""=<>`]+)))?/;
    var ncname = "[a-zA-Z_][\\-\\.0-9_a-zA-Z" + (unicodeRegExp.source) + "]*";
    var qnameCapture = "((?:" + ncname + "\\:)?" + ncname + ")";
    var startTagOpen = new RegExp(("^<" + qnameCapture));
    var startTagClose = /^\s*(\/?)>/;
    var endTag = new RegExp(("^<\\/" + qnameCapture + "[^>]*>"));
    var doctype = /^<!DOCTYPE [^>]+>/i;
    // #7298: escape - to avoid being pased as HTML comment when inlined in page
    var comment = /^<!\--/;
    var conditionalComment = /^<!\[/;
    function parseHTML(sfc, html) {
        var ltIndex, gtIndex, match;
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
                var tagName = match[1];
                var block = new SFCBlock(tagName);
                var end = void 0, attr = void 0;
                // 解析标签属性
                while (!(end = html.match(startTagClose)) && (attr = html.match(attribute))) {
                    advance(attr[0].length);
                    block.setAttr(attr[1], attr[3]);
                }
                // 只需要解析最外层标签
                if (end) {
                    advance(end[0].length);
                    var level = 1, content = "";
                    var startTagMatch = void 0, endTagMatch = void 0;
                    while (level-- && (endTagMatch = html.match(new RegExp("([\\s\\S]*?)(</" + tagName + "[^>]*>)", "i")))) {
                        content = endTagMatch[0];
                        advance(content.length);
                        block.appendContent(content);
                        // 相同标签嵌套
                        startTagMatch = content.match(new RegExp("<" + tagName + "[^>]*>", "g"));
                        if (startTagMatch) {
                            level += startTagMatch.length;
                        }
                        if (!level) {
                            // 去除关闭标签
                            block.trim(endTagMatch[2].length);
                        }
                    }
                    sfc.addBlock(block);
                }
            }
            else {
                // 如果以上情况均未匹配成功
                // 则说明该 `<` 为文本内容
                // 忽略之
                advance(1);
            }
        }
        function advance(n) {
            html = html.substring(n);
        }
    }
    function parseSFC (id, url, content, callback) {
        if (content === void 0) { content = ""; }
        content = content.trim();
        var sfc = new SFCDescriptor(url);
        if (content.charAt(0) === "<") {
            parseHTML(sfc, content);
        }
        else {
            sfc.addBlock(new SFCBlock("script", content));
        }
        var options = sfc.script ? parseScript(sfc.script, url) : {};
        options.name = sfc.name;
        if (sfc.template && !options.template) {
            options.template = sfc.template.content;
        }
        var styles = parseStyles(id, sfc.styles);
        callback(options, styles);
    }

    function loadComponent(id, src, callback) {
        if (isDef(src)) {
            var xhr_1 = new XMLHttpRequest();
            xhr_1.open("Get", src);
            xhr_1.onreadystatechange = function () {
                if (xhr_1.readyState === 4) {
                    if (xhr_1.status === 200) {
                        parseSFC(id, src, xhr_1.responseText, callback);
                    }
                }
            };
            xhr_1.send();
        }
        else {
            callback({}, []);
        }
    }

    function redefineRef(vm, $refs, refName, ref) {
        var refDescriptor = {
            _value: ref,
            get: function () {
                return refDescriptor._value;
            },
            set: function (value) {
                if (value !== vm) {
                    refDescriptor._value = value;
                }
            }
        };
        Object.defineProperty($refs, refName, refDescriptor);
    }
    var AsyncComponent = {
        data: function () {
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
            computeChildIndex: function () {
                var _a = this, child = _a.child, $parent = _a.$parent;
                this.childIndex = isDef(child) ? $parent.$children.indexOf(child) : -1;
            },
            computeRefName: function () {
                var $refs = this.$parent.$refs;
                var refName = this.refName;
                if ($refs[refName] === this.ref) {
                    $refs[refName] = UNDEFINED;
                }
                for (var refName_1 in $refs) {
                    if ($refs.hasOwnProperty(refName_1) && $refs[refName_1] === this) {
                        this.refName = refName_1;
                    }
                }
            },
            updateComponent: function () {
                var _a = this, childIndex = _a.childIndex, refName = _a.refName, $el = _a.$el, $parent = _a.$parent, $children = _a.$children;
                var child, ref;
                if (childIndex >= 0) {
                    $parent.$children.splice(childIndex, 1);
                }
                if ($children.length > 0) {
                    child = $children[0];
                    var styles_1 = this.styles.slice();
                    child.$on("hook:destroyed", function () {
                        styles_1.forEach(function (style) { return style.parentNode.removeChild(style); });
                    });
                    child.$parent = $parent;
                    $parent.$children.splice(childIndex, 0, child);
                    ref = child;
                }
                else {
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
                handler: function (src) {
                    var _this = this;
                    loadComponent(this.id, src, function (component, styles) {
                        var _a;
                        var name = component.name;
                        _this.$options.components = (_a = {},
                            _a[name] = component,
                            _a);
                        _this.component = name;
                        _this.styles = styles;
                    });
                },
                immediate: true
            }
        },
        render: function (createElement) {
            var _this = this;
            var _a = this, component = _a.component, props = _a.$attrs, on = _a.$listeners, $slots = _a.$slots, scopedSlots = _a.$scopedSlots;
            var slots = $slots["default"] || [];
            var _loop_1 = function (slot) {
                if ($slots.hasOwnProperty(slot) && slot != "default") {
                    $slots[slot].forEach(function (component) {
                        if (isUndef(component.data)) {
                            component.data = {};
                        }
                        component.data.slot = slot;
                        component.context = _this;
                        slots.push(component);
                    });
                }
            };
            for (var slot in $slots) {
                _loop_1(slot);
            }
            return createElement(component, {
                props: props,
                on: on,
                scopedSlots: scopedSlots
            }, slots);
        },
        beforeMount: function () {
            this.computeChildIndex();
        },
        mounted: function () {
            this.$el.parentNode.setAttribute(this.id, "");
            this.computeRefName();
            this.updateComponent();
        },
        beforeUpdate: function () {
            this.computeChildIndex();
        },
        updated: function () {
            this.computeRefName();
            this.updateComponent();
        },
        name: "AsyncComponent",
        inheritAttrs: false
    };

    function install(Vue) {
        Vue.component(AsyncComponent.name, AsyncComponent);
    }
    if (isDef(window) && isDef(window.Vue)) {
        install(window.Vue);
    }
    var index = {
        install: install
    };

    return index;

})));
