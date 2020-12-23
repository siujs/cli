# siu glint

> 处理`git`提交规范验证以及其他`git`生命周期的个性化处理

##### 命令

```bash
用法: glint [options]

Lint for git action

选项:
  -S, --no-strict    No need to force chdir to `siu.config.(ts|js)`'s root
  -h, --hook <hook>  Git lifecycle hook: pre-commit、prepare-commit-msg、commit-msg、post-commit、post-merge
  -h, --help         output usage information
```

##### 案例

- `siu glint -h=pre-commit`: 提交前的检测，可以替代`lint-staged`

##### <span style="color:red">\*\*注意\*\*</span>

当前命令行用法是基础内置用法, 可以通过自定义插件来专门扩展对应的控制台选项
