# 内置模块

## `@siujs/builtin-build`

> 模块构建

### 使用场景

- 使用`rollup`执行模块打包(内置了`es`、`cjs`、`umd`、`umd-min`4 中输出模式)
- 使用`esbuild`执行打包
- 使用`@microsfot/api-extractor`执行 dts 文件的生成
- 自定义扩展可链式调用的`config`配置操作,例如`webpack-chain`

**Note**: 模块内部已经内置了一些`rollup`针对`monorepo package`常用的配置

#### 实例

1. `rollup` + `esbuild`

```js
import { esbuildRollupPlugin, Config, SiuRollupBuilder, TOutputFormatKey } from "@siujs/builtin-build";

const pkgData = {
    root:"../xxx",
    name:"xx",
    path:"foo",
    dirName:"xx",
    metaPath:"xxx",
    meta:{...}
}

const extMap = {
    es:".mjs",
    cjs:".cjs",
    umd:".js",
 "umd-min":".min.js"
}

const builder = new SiuRollupBuilder(pkgData, {
	onConfigTransform: (config: Config, format: TOutputFormatKey) => {
		config.plugin("esbuild").use(esbuildRollupPlugin());
		config.output(format).file(path.resolve(pkgData.path, `dist/index${extMap[format]}`));
	}
});

// 全格式的打包输出, es、cjs、umd、umd-min
await builder.build(); // will create foo/dist/index.mjs、foo/dist/index.cjs、foo/dist/index.js、foo/dist/index.min.js， and may be create foo/dist/index.min.js.gz and foo/dist/index.min.js.br

// 指定输出格式
await builder.build({allowFormats:["es"]}); // will create foo/dist/index.mjs

// 不生成gzip或者brotil压缩的文件
await builder.build({allowFormats:["umd-min"],sizeCalc:false}); // will create foo/dist/index.min.js

```

2. `rollup`+`esbuild`+multiple packages

```js
import { esbuildRollupPlugin, Config, SiuRollupBuilder, stopService, TOutputFormatKey } from "@siujs/builtin-build";

const pkgDatas = [{
    root:"../xxx",
    name:"xx",
    path:"foo",
    dirName:"xx",
    metaPath:"xxx",
    meta:{...}
},{
    root:"../xxx",
    name:"xx",
    path:"bar",
    dirName:"xx",
    metaPath:"xxx",
    meta:{...}
}]

const extMap = {
    es:".mjs",
    cjs:".cjs",
    umd:".js",
 "umd-min":".min.js"
}

for(let l = pkgDatas.length;l--;){
   const builder = new SiuRollupBuilder(pkgData, {
        onConfigTransform: (config: Config, format: TOutputFormatKey) => {
            config.plugin("esbuild").use(esbuildRollupPlugin(),[{closeImmediate:false}]);
            config.output(format).file(path.resolve(pkgData.path, `dist/index${extMap[format]}`));
        }
    });

    await builder.build({allowFormats:["es"]});
}

stopService();

// 设置closeImmedicate=false,可以让esbuild进程一直激活态，不会去关闭，这样可以可以节省多次开启和关闭带来的损耗；
// 一般在做批量packages构建使用esbuild的service情况下，都尽量设置closeImmedicate=false
```

## `@siujs/builtin-deps`

> `Add` or `Remove` `dev|dependencies` of package

### 实例

```js
import { changeDeps } from "@siujs/builtin-deps";

(async () => {
	await changeDeps("foo", "bar@1.0.0,bar2@1.0.0:D", "add");
	// will add bar@1.0.0 as dependencies、bar2@1.0.0 as devDependencies into package 'foo'

	await changeDeps("foo", "bar,bar2:D", "rm");
	// will remove bar(dependencies)、bar2(devDependencies) from package 'foo'
})();
```

## `@siujs/builtin-githooks`

> 针对 git 的 client 端 hook 事件包装,一般用于执行 lintStaged 以及 commit msg valid

### hooks 清单

- `pre-commit`
- `prepare-commit-msg`
- `commit-msg`
- `post-commit`
- `post-merge`

### 使用

```js
import { lintWithGHooks } from "@siujs/builtin-githooks";

(async () => {
	// use default hooks handle
	await lintWithGHooks("preCommit");

	// custom git hooks handle
	await lintWithGHooks("preCommit", {
		hooks: {
			async preCommit(stagedFiles: string[], cwd: string) {}
		}
	});
})();
```

## `@siujs/builtin-publish`

> Release monorepo packages

`@siujs/builtin-publish` is designed as a tool library for publishing monorepo packages;

It supports the release of the following conditions:

- Choose the version number by `prompt`
- Specify the version number
- Support full package and sub-package release

### Usage

```js
const minimist = require("minimist");
const { release, runWhetherDry } = require("@siujs/builtin-publish");

const cmd = minimist(process.argv);

const skips = cmd.skip ? cmd.skip.split(",") : [];

(async () => {
	await release({
		dryRun: !!(cmd.dryRun || cmd["dry-run"]),
		skipPush: skips.length && skips.includes("push"),
		skipLint: false,
		skipBuild: skips.length && skips.includes("build"),
		repo: cmd.repo,
		hooks: {
			async lint({ cwd, dryRun }) {
				await runWhetherDry(dryRun)("yarn", ["test"], { cwd });
			}
		}
	});
})();
```
