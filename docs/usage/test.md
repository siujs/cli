# siu test

> 执行指定包的单元测试或者端测等其他测试案例

##### 命令

```bash

用法: test [options] [pkg]

Test single or multiple monorepo's package

选项:
  -S, --no-strict  No need to force chdir to `siu.config.(ts|js)`'s root
  -h, --help       output usage information
```

##### <span style="color:red">\*\*注意\*\*</span>

- 当前命令行用法是基础内置用法, 可以通过自定义插件来专门扩展对应的控制台选项
