(function (graph) {
  function require(module) {
    if (!module) {
      return;
    }
    function localRequire(relativePath) {
      return require(graph[module].dependecies[relativePath]);
    }
    var exports = {};
    (function (require, exports, code) {
      eval(code);
    })(localRequire, exports, graph[module].code);
    return exports;
  }
  require("./src/index.js");
})({
  "./src/index.js": {
    dependecies: { "./add.js": "./src\\add.js" },
    code: '"use strict";\n\nvar _add = _interopRequireDefault(require("./add.js"));\n\nfunction _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }\n\nconsole.log((0, _add["default"])(1, 2));',
  },
  "./src\\add.js": {
    dependecies: {},
    code: '"use strict";\n\nObject.defineProperty(exports, "__esModule", {\n  value: true\n});\nexports["default"] = void 0;\n\nvar _default = function _default(a, b) {\n  return a + b;\n};\n\nexports["default"] = _default;',
  },
});
