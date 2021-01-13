# siu create

创建基于`monorepo`的`package`模块

##### 命令

```bash
用法：create [options] <pkg>

选项：
	-S, --no-strict				非严格模式（不需要去强制检查siu.config.(js|ts)的所在目录）
	-w, --workspace [workspace]	指定工作区的文件夹名称 (default: "packages")
	-d, --deps <deps>			需要依赖的同级package的名称
```

##### 使用

- `siu create test`: 将会创建 `packages/test`

##### <span style="color:red">\*\*注意\*\*</span>

- `siu create`此命令会优先从`siu.config.(js|ts)`中去找到对应具备`create`hook 的插件并执行, 如果没有的话则默认走内置`create`逻辑

- 当前命令行用法是基础内置用法, 可以通过自定义插件来专门扩展对应的控制台选项
