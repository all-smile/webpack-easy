const fs = require("fs");
const path = require("path");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const babel = require("@babel/core");

function getModuleInfo(file) {
  // 读取文件
  const body = fs.readFileSync(file, "utf-8");

  // 转化AST语法树
  const ast = parser.parse(body, {
    sourceType: "module", //表示我们要解析的是ES模块
  });
  // console.log('ast=', ast);

  // 依赖收集
  const deps = {};
  traverse(ast, {
    ImportDeclaration({ node }) {
      const dirname = path.dirname(file);
      // console.log('dirname=', dirname, node);
      const abspath = "./" + path.join(dirname, node.source.value);
      console.log('abspath=', abspath, dirname, node.source.value);
      deps[node.source.value] = abspath;
    },
  });

  // ES6转成ES5
  const { code } = babel.transformFromAst(ast, null, {
    presets: ["@babel/preset-env"],
  });
  const moduleInfo = { file, deps, code };
  return moduleInfo;
}
const info = getModuleInfo("./src/index.js");
// console.log("info:", info);

/**
 * 模块解析
 * @param {*} file
 * @returns
 */
 function parseModules(file) {
  const entry = getModuleInfo(file);
  const temp = [entry];
  const depsGraph = {};

  getDeps(temp, entry);

  temp.forEach((moduleInfo) => {
    depsGraph[moduleInfo.file] = {
      deps: moduleInfo.deps,
      code: moduleInfo.code,
    };
  });
  return depsGraph;
}

/**
 * 获取依赖
 * @param {*} temp
 * @param {*} param1
 */
function getDeps(temp, { deps }) {
  Object.keys(deps).forEach((key) => {
    const child = getModuleInfo(deps[key]);
    temp.push(child);
    getDeps(temp, child);
  });
}

// 打包
function bundle(file) {
  const depsGraph = JSON.stringify(parseModules(file));
  // console.log('depsGraph===', depsGraph);
  return `(function (graph, fileName) {
        function require(fileName) {
            if (!fileName) {
              return
            }
            function absRequire(relPath) {
                return require(graph[fileName].deps[relPath])
            }
            var exports = {};
            (function (require,exports,code) {
                eval(code)
            })(absRequire,exports,graph[fileName].code)
            return exports
        }
        require('${file}')
    })(${depsGraph}, \"${file}\")`;
}


const entry = './src/index.js';
const content = bundle(entry);

// console.log('content=', content);

!fs.existsSync("./dist") && fs.mkdirSync("./dist");
fs.writeFileSync("./dist/bundle.js", content);