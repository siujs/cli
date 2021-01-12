## 开始

`siu`内部的插件流程主要是通过内置了`命令+周期`的方式进行流转;

## 插件命令

`siu`内置了如下的命令,分别对应`CLI`的命令操作:

- `create`: 创建`package`
- `deps`: 针对`package`新增/删除依赖
- `doc`: 创建文档
- `demo`: 本地 demo 运行
- `serve`: 本地开发环境启动
- `test`: unit-test、e2e
- `build`: 构建
- `publish`: 发布
- `glint`: git commit lint

## 插件命令操作周期

`siu`针对每个命令都提供了统一的操作周期标记：

- `cli`: (只执行一次) 扩展对应命令的选项
- `start`: 该命令流程开始
- `process`: 该命令流程处理中
- `complete`: 该命令流程处理完成
- `error`: 该命令流程发生异常
- `clean`: 该命令的最终清理操作

<div style="background:yellow;">注意：</div>

- `clean`无论流程是否发生异常都会执行
- `start`流程是可选的
- `@siujs/core`内部已经在流程最外层捕获了异常，所有如果需要处理异常信息的话，请在`error`里面执行`ctx.ex()`获取异常信息

![整个流程周期如下图所示](/siu-plugin-flow.png)

## 编写插件

```typescript
import { CLIOptionHandlerParams, PluginApi } from "@siujs/core";

export default (api: PluginApi) => {
	api.create.cli((option: CLIOptionHandlerParams) => {
		option("-d, --deps <deps>", "name of siblings package, e.g. `pkg1` or `pkg1,pkg2`");
	});

	// or

	api.publish.cli((option: CLIOptionHandlerParams) => {
		option(
			"-s, --skip <skip>",
			"Will skip steps: lint | build | publish | commit | push , support comma join"
		)({
			/**
			 * 自定义针对当前option的prompt功能
			 */
			questions: {
				type: "checkbox",
				name: "skip",
				message: "Select skip steps:",
				choices: ["lint", "build", "publish", "commit", "push"]
			},
			/**
			 * 自定义针对当前prompt所得到的的answer的自定义转换
			 */
			answerTransform(answer: any) {
				return answer && answer.join(",");
			}
		});
	});

	api.create.start(async (ctx: HookHandlerContext) => {
		// do something
		// ctx: 插件上下文
	});

	api.create.process(async (ctx: HookHandlerContext) => {
		// do something
	});

	api.create.complete(async (ctx: HookHandlerContext) => {
		// do something
	});

	api.create.error(async (ctx: HookHandlerContext) => {
		// do something
	});

	api.create.clean(async (ctx: HookHandlerContext) => {
		// do something
	});
};
```

### 插件上下文

插件上下文`ctx:HookHandlerContext)`是`@siujs/core`提供给插件开发者用来在当前命令流程处理中的辅助`api`:

#### ctx.opts(key?)

获取插件在当前命令的配置信息`A`中指定名称的数据；

`A`来自如下几个地方：

1. 通过`cli`配置的 option 参数
2. 通过`siu.config.js|ts`中自定义的配置参数

最终： `A = deepMerge(1,2)`

使用如下:

```typescript
/**
 * opts:
 * {
 *   "foo": "2"
 * }
 *
 */

ctx.opts<string>("foo");
// will output "2";

ctx.opts<{ foo: string }>();
// will output {foo:"2"}
```

#### ctx.keys

获取/设置插件全局可使用的临时键值对， 主要为了实现数据跨步骤甚至跨命令共享；

最常用的使用场景是在`start`周期中使用`ctx.keys("startTime",Date.now())`记录流程开始时间，在`complete`周期中使用`const diffTime = Date.now() - ctx.keys("startTime")`来得到当前命令所花费的时间`diffTime`；

<div style="background:yellow;">注意：</div>

- 此操作设置的键值对是整个插件执行周期里面可共享的，即可跨命令共享;

#### ctx.scopedKeys

更加细粒度的临时键值对, 用法同`ctx.keys`; 唯一的区别就是`scopedKeys`只在插件当前所执行命令的运行环境下才生效; 它没有`ctx.keys`的共享范围大;

#### ctx.ex

获取/设置插件在当前执行命令的运行环境下的异常信息

- 获取: `const err = ctx.ex()`
- 设置： `ctx.ex(new Error('xxxx'))` or `ctx.ex('msg')`

Note: 只要在`start`、`process`周期中使用了异常记录，那么就认为当前命令处理流程发生了异常，会停止向下流转；

#### ctx.pkg

获取/设置当前正在调用插件的目标`package`的元数据信息

- 获取: `const pkgData = ctx.pkg()`;
- 设置: `ctx.pkg({...})`

<div style="background:yellow;">注意：</div>

- 此操作在命令为`publish`、`deps`、`glint`下不生效，会返回无效数据;
- 设置操作只会更新当前`package`模块下`package.json`中的内容(对象合并方式，非覆盖式)
