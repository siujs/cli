### siu.config.js|ts

通过`siu` CLI 创建的项目都会在根目录创建`siu.config.xx`的配置文件,这个配置文件是可选的；如果项目的(和`package.json`同级的)根目录中存在这个文件，那么它就会被`@siujs/core`自动加载。
当然也可以使用`package.json`中的`siu`字段,但是注意这种写法需要严格遵照 JSON 的格式来写;

当然，更推荐是直接使用`siu.config.js|ts`的形式来处理，`@siujs/cli`提供了`defineConfig`方法来增强大家配置时候的智能提示

这个文件应该导出一个包含了选项的对象：

```js
// siu.config.js
module.exports = {
	// 选项...
};

// siu.config.ts
export default {
	// 选项...
};

// in package.json
{
	"siu": {
		// 选项...
	}
}
```

### excludePkgs

- Type: `Array<string> | {["build"|"create"|"xxx"]: string[]}`

- Default: `[]`

用于排除当前`monorepo`项目中不需要参与流程处理的`package`名称;

```js
// siu.config.js
module.exports = {
	excludePkgs: ["foo"]
	// package: foo,将被列入黑名单不在参与任何插件中的命令执行
};

// siu.config.js
module.exports = {
	excludePkgs: {
		build: ["foo"],
		publish: ["bar"]
	}
	// foo不参与所有插件的build命令处理中，bar不参与所有插件的publish命令处理中
};

// in package.json
{
	"siu": {
		"excludePkgs": {
			"build": ["foo"],
			"publish": ["bar"]
		}
	}
}
```

### plugins

- Type: `Array<string | [string,{ .... }]>`

- Default: `[]`

当前项目所使用的`siu`插件列表; 每个插件都支持自定义插件配置,但是插件配置也有对应的限制; 配置案例如下：

- 无插件配置

```js
// siu.config.js
module.exports = {
	plugins: ["@siujs/foo", "bar"]
};

// siu.config.ts
export default = {
	plugins: ["@siujs/foo", "bar"]
}；

// in package.json
{
	"siu": {
		"plugins": ["@siujs/foo", "bar"]
	}
}
```

- 插件有配置

```js
// siu.config.js
module.exports = {
	plugins: [
		"@siujs/foo",
		[
			"bar",
			{
				excludePkgs: [],
				custom: {
					// 此处key已被限定，
					build: {
						// 此处可以定义插件的配置
						foo: "xxxx"
					}
				}
			}
		]
	]
};
// siujs-plugin-bar插件针对build命令下的配置参数{foo:"xxxx"}
```

```json
// package.json
{
	"siu": {
		"plugins": [
			"@siujs/foo",
			[
				"bar",
				{
					"excludePkgs": [],
					"custom": {
						"build": {
							"foo": "xxxx"
						}
					}
				}
			]
		]
	}
}
```

### plugins.excludePkgs

插件内细化`excludePkgs`,实现更细粒度的黑名单控制和插件组合

```js
// siu.config.js
module.exports = {
	plugins: [
		["foo", { excludePkgs: { build: ["pkg1"] } }],
		["bar", { excludePkgs: { build: ["pkg2"] } }]
	]
};
// pkg1不参与siujs-plugin-foo的构建过程,但是会参与siujs-plugin-bar插件的构建过程
// pkg2不参与siujs-plugin-bar的构建过程,但是会参与siujs-plugin-foo插件的构建过程

// 通过这种方式可以针对同一个package模块实现不同的插件组合
```

### pkgsOrder

- Type: `auto`|`priority` | `string[]`;

- Default: `priority`

指定排序来控制 package 模块的执行顺序

- `auto`: 默认按照`packages`下目录名称排序
- `priority`: 通过分析当前`packages`下模块之间依赖关系形成的优先级数组(从高到低)
- `string[]`: 自定义排序好的 `package`名称列表

特殊场景:

- 想通过 esbuild 来快速打包 ts 项目, 但是这个时候又需要 dts 声明的情况下，可以利用这个优先级使用(ts --emitDeclarationOnly + @microsoft/api-extractor)来保证构建过程的依赖顺序正常
