# siu deps

针对`package`执行`add/remove dev/dependencies`操作

##### 命令

```bash
用法: deps [options] <deps>

选项:
  -S, --no-strict  			 非严格模式（不需要去强制检查siu.config.(js|ts)的所在目录）
  -t, --target <target>  安装deps依赖的目标package名称,支持批量(逗号分隔）
  -r, --rm               是否是执行删除依赖的操作
```

##### 案例

- `siu deps foo --target=package1`： will install `foo@latest` as `dependencies` into `package1`;
- `siu deps foo:D --target=package1`: will install `foo@latest` as `devDependencies` into `package1`;
- `siu deps foo@1.0.0 --target=package1`: will install `foo@1.0.0` as `dependencies` into `package1`;
- `siu deps foo@1.0.0,foo2:D,foo3 --target=package1`: will install `foo:1.0.0`、`foo3@latest` as `dependencies` and `foo2@latest` as `devDependencies` into `package1`

##### <span style="color:red">\*\*注意\*\*</span>

- `siu deps`此命令会优先从`siu.config.(js|ts)`中去找到对应具备`deps`hook 的插件并执行, 如果没有的话则默认走内置`deps`逻辑(依赖`@siujs/builtin-deps`)

- 当前命令行用法是基础内置用法, 可以通过自定义插件来专门扩展对应的控制台选项
