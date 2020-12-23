# siu deps

> 给指定的包新增或删除 npm 依赖

##### 命令

```bash
用法: siu deps [options] <deps>

Add deps to target monorepo's package, e.g. add foo,foo@1.2.2,foo:D,foo@1.2.2:D

选项:
  -S, --no-strict  No need to force chdir to `siu.config.(ts|js)`'s root
  -t, --target <target>  target package name,e.g. foo、@foo/bar
  -r, --rm               is remove deps from package
```

##### 案例

- `siu deps foo --target=package1`： will install `foo@latest` as `dependencies` into `package1`;
- `siu deps foo:D --target=package1`: will install `foo@latest` as `devDependencies` into `package1`;
- `siu deps foo@1.0.0 --target=package1`: will install `foo@1.0.0` as `dependencies` into `package1`;
- `siu deps foo@1.0.0,foo2:D,foo3 --target=package1`: will install `foo:1.0.0`、`foo3@latest` as `dependencies` and `foo2@latest` as `devDependencies` into `package1`

##### <span style="color:red">\*\*注意\*\*</span>

当前命令行用法是基础内置用法, 可以通过自定义插件来专门扩展对应的控制台选项
