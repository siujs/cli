# siu create

> 创建基于`monorepo`的`package`模块

##### 命令

```bash
用法：siu create [options] <pkg>

选项：
  -S, --no-strict  No need to force chdir to `siu.config.(ts|js)`'s root
  -d, --deps <deps> 需要依赖的同级package的名称
```

`siu create`此命令会优先从`siu.config.js`中去找到对应具备`create`hook 的插件并执行, 如果没有的话则默认走`@siujs/cmd-create`的逻辑去处理;

##### 使用

- `siu create test`: 将会创建 `packages/test`

##### <span style="color:red">\*\*注意\*\*</span>

当前命令行用法是基础内置用法, 可以通过自定义插件来专门扩展对应的控制台选项
