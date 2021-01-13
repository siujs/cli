# siu init

通过下载远程模板仓库地址来初始化项目,依赖于`@siujs/cli-init`

##### 命令

```bash
用法: init [options] <template> <app>

选项:
	-s, --source <source> 项目模板来源： gitlab、github、gitee 或者私人git地址
	--skipInstall         是否跳过yarn/npm的install过程
	-h, --help            显示命令帮助文档

```

`siu init`命令会默认通过远端 git repo 的形式去下载对应的项目模板，然后再对应的进行一些内部处理;

##### 使用

- `siu init @foo/bar .` : will download template files from `https://github.com/foo/bar`
- `siu init bar .` : will download template files from `https://github.com/bar`
- `siu init foo#dev .`: will download template files from `https://github.com/foo` and branch `dev`
- `siu init git@foo .`: will download template files from `git@foo`
- `siu init https://xxx/foo .`: will download template files from `https://xxx/foo`;
- `siu init foo --source=gitee .`: will download template files from `https://gitee.com/foo`
