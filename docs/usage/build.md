# siu build

> 批量处理`package`的代码构建输出, 默认提供`rollup`的支持

##### 命令

```bash
用法: build [options] [pkg]

选项:
  -S, --no-strict        非严格模式（不需要去强制检查siu.config.(js|ts)的所在目录
  -f, --format <format>  输出模式: es、cjs、umd、umd-min
```

##### <span style="color:red">\*\*注意\*\*</span>

- `siu build`此命令会优先从`siu.config.js`/`siu.config.ts`中去找到对应具备`build`钩子的插件并执行, 如果没有的话则默认走`@siujs/builtin-build`的逻辑去处理;

- `@siujs/builtin-build` 内置默认构建是基于`rollup`+`esbuild`来打包基于`typescript`的无 UI 类库项目

- `@siujs/builtin-build`除了作为`siu build`的垫片, 还提供了关于自定义`rollup`、`webpack`配置的构建器，主要服务于`siu`插件开发

- 命令行选项中如果`pkg`没有设置，那么默认会去执行全模块打包

- `pkgs`支持的名称有两种

  - 当前 package 的`文件夹名称`
  - 当前 package 在 package.json 中定义的`name`

- `umd-min`是表示需要执行`mini`处理的`umd`输出模式

- 当前命令行用法是基础内置用法, 可以通过自定义插件来专门扩展对应的控制台选项
