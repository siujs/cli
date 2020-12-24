# siu doc

此命令主要是服务于代码的文档构建，尤其体现在类库项目的说明文档或 api 文档的构建工作上

##### 命令

```bash
用法: doc [options] [pkg]

Generate docs of target monorepo's package

选项:
  -S, --no-strict  非严格模式（不需要去强制检查siu.config.(js|ts)的所在目录
  -h, --help       output usage information
```

##### <span style="color:red">\*\*注意\*\*</span>

- 当前命令行用法是基础内置用法, 可以通过自定义插件来专门扩展对应的控制台选项
