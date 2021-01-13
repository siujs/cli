# siu glint

处理整个项目`git`提交规范验证以及其他`git`生命周期的个性化拦截处理等

##### 命令

```bash
用法: glint [options]

Lint for git action

选项:
  -S, --no-strict    非严格模式（不需要去强制检查siu.config.(js|ts)的所在目录
  -h, --hook <hook>  git的客户端hook: pre-commit、prepare-commit-msg、commit-msg、post-commit、post-merge
  -h, --help         output usage information
```

##### 案例

- `siu glint -h=pre-commit`: 提交前的检测，可以替代`lint-staged`

##### <span style="color:red">\*\*注意\*\*</span>

- `siu glint`此命令会优先从`siu.config.(js|ts)`中去找到对应具备`glint`hook 的插件并执行, 如果没有的话则默认走内置`glint`逻辑(依赖`@siujs/builtin-githooks`)
- 当前命令行用法是基础内置用法, 可以通过自定义插件来专门扩展对应的控制台选项
