# 命令清单

| 命令                                | 描述                                                                 |
| ----------------------------------- | -------------------------------------------------------------------- |
| [`siu init ....`](/usage/init)      | 创建`monorepo`风格项目                                               |
| [`siu create ...`](/usage/create)   | 创建`monorepo`的`package`模块                                        |
| [`siu deps ...`](/usage/deps)       | 针对`package`执行`add/remove dev/dependencies`操作                   |
| [`siu serve ...`](/usage/serve)     | 针对`package`启动本地服务                                            |
| [`siu demo ...`](/usage/demo)       | 针对`package`启动本地 demo                                           |
| [`siu test ...`](/usage/test)       | 批量处理`package`的单测、端测等                                      |
| [`siu docs ...`](/usage/docs)       | 批量构建不同`package`的说明文档                                      |
| [`siu glint ...`](/usage/glint)     | 处理整个项目`git`提交规范验证以及其他`git`生命周期的个性化拦截处理等 |
| [`siu build ...`](/usage/build)     | 批量处理`package`的代码构建输出, 默认提供`rollup`的支持              |
| [`siu publish ...`](/usage/publish) | 整包发布或者特定`package`的发布                                      |

除去`init`其他命令都支持插件自定义扩展命令行`option`;
