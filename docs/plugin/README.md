## 介绍

`siu` CLI 使用了一套基于插件的架构。基于插件的架构使得 Siu CLI 灵活且高扩展；如果你对开发一个插件感兴趣，那我们就开始吧：

## 插件命名

官方插件都是以`@siujs/plugin-`开头，具体的列表可以去[plugins]()查看;

其他插件都是以`siujs-plugin-`或者`@xxx/siujs-plugin-`开头;

在`siu.config.js`定义如下:

```js
module.exports = {
	plugins: ["bar", "@siujs/foo", "@xxx/siujs-plugin-foo2"]
};

// will to be : siujs-plugin-bar , @siujs/plugin-foo, @xxx/siujs-plugin-foo2
```

## 项目本地的插件

如果需要在项目里直接使用，而不去通过`npm repo`的情况下，可以在项目根目录下的`siu.config.js`里定义如下:

```js
module.exports = {
	plugins: ["./siu-plugin-xxxx"]
};
```
