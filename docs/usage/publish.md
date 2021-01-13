# siu publish

整包发布或者特定`package`的发布

##### 命令

```bash
用法: publish [options] [pkg]

选项:
	-S, --no-strict     			非严格模式（不需要去强制检查siu.config.(js|ts)的所在目录
	-w, --workspace [workspace]  	指定工作区的文件夹名称 (default: "packages")
	-n, --dry-run       			是否执行干跑
	-v, --ver <verson>  			指定发布的版本号，例如: 'independent'、'1.0.0'等
	-r, --repo <repo>   			指定发布的远程npm repository地址，默认：https://registry.npmjs.org/
	-s, --skip <skip>   			发布过程中可以跳过的步骤: lint、build、push
```

##### 案例

- `siu publish -n`: 干跑模式下的整包发布

- `siu publish -n --repo=xxxx`: 指定干跑模式下的发布的远端`npm repository`

- `siu publish -n --skip=lint`: 跳过`lint`步骤来执行发布

- `siu publish -n --skip=lint,build`: 跳过`lint`和`build`步骤来执行发布

##### <span style="color:red">\*\*注意\*\*</span>

- 当前命令行用法是基础内置用法, 可以通过自定义插件来专门扩展对应的控制台选项
- 此命令在无插件的情况下，默认走`@siujs/builtin-publish`提供的逻辑
