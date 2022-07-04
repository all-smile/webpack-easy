/**
 * 手写webpack核心打包流程
 */
// 获取主入口文件
const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const babel = require('@babel/core');

// 解析单个文件，获取文件路径，依赖文件列表，编译成es5的代码
const getModuleInfo = (file) => {
    const body = fs.readFileSync(path.resolve(__dirname, file), 'utf-8');
    // 新增代码
    const ast = parser.parse(body, {
        sourceType: 'module' // 表示我们要解析的是ES模块
    });

    // 新增代码
    const deps = {};
    traverse(ast, {
        ImportDeclaration({node}) {
            const dirname = path.dirname(file);
            const abspath = './' + path.join(dirname, node.source.value);
            deps[node.source.value] = abspath;
        }
    });
    const {code} = babel.transformFromAst(ast, null, {
        presets: ['@babel/preset-env']
    });
    const moduleInfo = {file, deps, code};
    return moduleInfo;
};
// 编译入口文件，非递归遍历AST依赖树，将所有文件解析后生成平铺的映射对象
const parseModules = (file) => {
    const entry = getModuleInfo(file);
    const temp = [entry];
    const depsGraph = {};
    for (let i = 0; i < temp.length; i++) {
        const deps = temp[i].deps;
        if (deps) {
            for (const key in deps) {
                if (deps.hasOwnProperty(key)) {
                    temp.push(getModuleInfo(deps[key]));
                }
            }
        }
    }

    temp.forEach(moduleInfo => {
        depsGraph[moduleInfo.file] = {
            deps: moduleInfo.deps,
            code: moduleInfo.code
        };
    });
    return depsGraph;
};

// 打包，递归遍历require
// 执行依赖关系树的执行器和AST依赖关系树
const bundle = (file) => {
    const depsGraph = JSON.stringify(parseModules(file), null, 4);
    return `;(function (graph) {
        function require(file) {
            if (!file) {
              return
            }
            function absRequire(relPath) {
                return require(graph[file].deps[relPath])
            }
            var exports = {};
            (function (require, exports, code) {
                eval(code);
            })(absRequire, exports, graph[file].code);
            return exports;
        }
        require('${file}');
    })(${depsGraph});`;

};

const entry = './src/index.js';
const content = bundle(entry);

console.log(content);

// 输出代码
if (!fs.existsSync('./dist')) {
    fs.mkdirSync('./dist');
}
fs.writeFileSync('./dist/bundle.js', content);