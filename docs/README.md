# Siu Cli

![codecov](https://img.shields.io/codecov/c/github/siujs/cli)
![build](https://img.shields.io/github/workflow/status/siujs/cli/Create%20Release)
![language](https://img.shields.io/github/languages/top/siujs/cli)
![version](https://img.shields.io/github/package-json/v/siujs/cli)
![MIT](https://img.shields.io/github/license/siujs/cli)

> 取名`siu`,主要是希望能够像`C罗`进球时那般快速的赶脚, 当然那声`siu...`的庆祝动作也很霸气

`@siujs/cli`是一个基于`Monorepo`+`Typescript`为主基调风格的插件化前端脚手架, 让类库开发亦或多项目开发场景的人员更轻松也更自由；

它主要提供以下几个平常项目开发过程中涉及到的操作而提起的命令：

- `siu init ...`：创建`monorepo`风格项目
- `siu create ...`：创建`monorepo`的`package`模块
- `siu deps ...`：针对`package`执行`add/remove dev/dependencies`操作
- `siu serve ...`：针对`package`启动本地开发
- `siu demo ...`：针对`package`启动本地 demo
- `siu test ...`：批量处理`package`的单测、端测等
- `siu docs ...`：批量构建不同`package`的说明文档
- `siu glint ...`：处理整个项目`git`提交规范验证以及其他`git`生命周期的个性化拦截处理等
- `siu build ...`：批量处理`package`的代码构建输出, 默认提供`rollup`的支持
- `siu publish ...`：整包发布或者特定`package`的发布

除去`init`其他命令都完全支持插件自定义;

> `@siujs/cli`是由于本人在长期使用`lerna`之后, 发现其并没有很好满足本人操作愿景,最终才决定造了这个轮子

## 区别

`siu`不像`vue-cli`、`create-scripts`等其他比较成熟的`cli`工具去专项做某些事情;

- 优势

  - 简单：它只是一个集中地，他把控制权基本上都交给插件，由插件去发挥想象,自身只提供简单的辅助 api 和总的流程控制;
  - 强扩展性：完全可以将`vue-cli`、`create-scripts`包装成`siu`的插件来接入
  - 天然支持`Monorepo`

- 劣势

  - 适用的项目类型只有 Monorepo 风格的

## 脚手架设计

### core

core: 整个脚手架的核心包, 所有插件都必须依赖的包

### cli

cli: 控制台处理模块

cli-init: 专门执行项目初始化的模块

### builtin-\*

builtin-\*: 内置的命令处理模块，等同于在无插件情况下的默认逻辑
