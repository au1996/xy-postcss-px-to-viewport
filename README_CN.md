# xy-postcss-px-to-viewport

[![NPM version](https://badge.fury.io/js/xy-postcss-px-to-viewport.svg)](http://badge.fury.io/js/xy-postcss-px-to-viewport)

[English](README.md) | 中文

将 px 单位转换为视口单位的 (vw, vh, vmin, vmax) 的 [PostCSS](https://github.com/postcss/postcss) 插件.

## 支持 include 配置

## 简介

如果你的样式需要做根据视口大小来调整宽度，这个脚本可以将你 CSS 中的 px 单位转化为 vw，1vw 等于 1/100 视口宽度。

### 输入

```css
.class {
  margin: -10px .5vh;
  padding: 5vmin 9.5px 1px;
  border: 3px solid black;
  border-bottom-width: 1px;
  font-size: 14px;
  line-height: 20px;
}

.class2 {
  border: 1px solid black;
  margin-bottom: 1px;
  font-size: 20px;
  line-height: 30px;
}

@media (min-width: 750px) {
  .class3 {
    font-size: 16px;
    line-height: 22px;
  }
}
```

### 输出

```css
.class {
  margin: -1.33333vw .5vh;
  padding: 5vmin 1.26667vw 1px;
  border: 0.4vw solid black;
  border-bottom-width: 1px;
  font-size: 1.86667vw;
  line-height: 2.66667vw;
}

.class2 {
  border: 1px solid black;
  margin-bottom: 1px;
  font-size: 2.66667vw;
  line-height: 4vw;
}

@media (min-width: 750px) {
  .class3 {
    font-size: 16px;
    line-height: 22px;
  }
}
```

## 上手

### 安装

使用 npm 安装

```
$ npm install xy-postcss-px-to-viewport --save-dev
```

或者使用 yarn 进行安装

```
$ yarn add -D xy-postcss-px-to-viewport
```

#### 使用 PostCss 配置文件时

在`postcss.config.js`添加如下配置

```js
module.exports = {
  plugins: {
    // ...
    'xy-postcss-px-to-viewport': {
      // 配置参数
    },
  },
}
```

### 配置参数

默认参数:

```js
{
  unitToConvert: 'px',
  viewportUnit: 'vw',
  fontViewportUnit: 'vw',
  viewportWidth: 750,
  unitPrecision: 5,
  minPixelValue: 1,
  selectorBlackList: [],
  propList: ['*'],
  mediaQuery: false,
  replace: true,
  exclude: undefined,
  include: undefined,
  landscape: false,
  landscapeUnit: 'vw',
  landscapeWidth: 425
}
```

- `unitToConvert` (String) 需要转换的单位，默认为"px"
- `viewportWidth` (Number) 设计稿的视口宽度
- `unitPrecision` (Number) 单位转换后保留的精度
- `propList` (Array) 能转化为 vw 的属性列表
  - 传入特定的 CSS 属性；
  - 可以传入通配符"_"去匹配所有属性，例如：['_']；
  - 在属性的前或后添加"*",可以匹配特定的属性. (例如['*position\*'] 会匹配 background-position-y)
  - 在特定属性前加 "!"，将不转换该属性的单位 . 例如: ['*', '!letter-spacing']，将不转换 letter-spacing
  - "!" 和 "_"可以组合使用， 例如: ['_', '!font\*']，将不转换 font-size 以及 font-weight 等属性
- `viewportUnit` (String) 希望使用的视口单位
- `fontViewportUnit` (String) 字体使用的视口单位
- `selectorBlackList` (Array) 需要忽略的 CSS 选择器，不会转为视口单位，使用原有的 px 等单位。
  - 如果传入的值为字符串的话，只要选择器中含有传入值就会被匹配
    - 例如 `selectorBlackList` 为 `['body']` 的话， 那么 `.body-class` 就会被忽略
  - 如果传入的值为正则表达式的话，那么就会依据 CSS 选择器是否匹配该正则
    - 例如 `selectorBlackList` 为 `[/^body$/]` , 那么 `body` 会被忽略，而 `.body` 不会
- `minPixelValue` (Number) 设置最小的转换数值，如果为 1 的话，只有大于 1 的值会被转换
- `mediaQuery` (Boolean) 媒体查询里的单位是否需要转换单位
- `replace` (Boolean) 是否直接更换属性值，而不添加备用属性
- `exclude` (Array or Regexp) 忽略某些文件夹下的文件或特定文件，例如 'node_modules' 下的文件
  - 如果值是一个正则表达式，那么匹配这个正则的文件会被忽略
  - 如果传入的值是一个数组，那么数组里的值必须为正则
- `include` (Array or Regexp) 如果设置了`include`，那将只有匹配到的文件才会被转换，例如只转换 'src/mobile' 下的文件
  (`include: /\/src\/mobile\//`)
  - 如果值是一个正则表达式，将包含匹配的文件，否则将排除该文件
  - 如果传入的值是一个数组，那么数组里的值必须为正则
- `landscape` (Boolean) 是否添加根据 `landscapeWidth` 生成的媒体查询条件 `@media (orientation: landscape)`
- `landscapeUnit` (String) 横屏时使用的单位
- `landscapeWidth` (Number) 横屏时使用的视口宽度

> `exclude`和`include`是可以一起设置的，将取两者规则的交集。

#### 忽略示例

您可以使用特殊注释来忽略单行的转换：

- `/* px-to-viewport-ignore-next */` — 在单独的行上，可防止在下一行进行转换。
- `/* px-to-viewport-ignore */` — 在右侧的属性之后，防止在同一行进行转换。

Example:

```css
/* example input: */
.class {
  /* px-to-viewport-ignore-next */
  width: 10px;
  padding: 10px;
  height: 10px; /* px-to-viewport-ignore */
  border: solid 2px #000; /* px-to-viewport-ignore */
}

/* example output: */
.class {
  width: 10px;
  padding: 1.33333vw;
  height: 10px;
  border: solid 2px #000;
}
```

还有多种原因导致您的像素无法转换，以下选项可能会影响此情况：
`propList`, `selectorBlackList`, `minPixelValue`, `mediaQuery`, `exclude`, `include`.

#### 直接在 gulp 中使用，添加 gulp-postcss

在 `gulpfile.js` 添加如下配置:

```js
var gulp = require('gulp')
var postcss = require('gulp-postcss')
var pxtoviewport = require('xy-postcss-px-to-viewport')

gulp.task('css', function () {
  var processors = [
    pxtoviewport({
      viewportWidth: 320,
      viewportUnit: 'vmin',
    }),
  ]

  return gulp.src(['build/css/**/*.css']).pipe(postcss(processors)).pipe(gulp.dest('build/css'))
})
```

## 参与贡献

在提 PR 之前，请先阅读 [代码指南](CODE-OF-CONDUCT.md)
和 [贡献指南](CONTRIBUTING.md)

## 测试

为了跑测试案例，您需要安装开发套件:

```
$ npm install
```

然后输入下面的命令:

```
$ npm run test
```

## Changelog

变更日志在 [这](CHANGELOG.md).

## 版本跟踪

使用 [SemVer](http://semver.org/) 做版本跟踪， 可用版本可在[这](https://github.com/au1996/postcss-px-to-viewport/tags)看到

## 许可

本项目使用 [MIT License](LICENSE).

## 借鉴自

- 来源于 [evrone](https://github.com/evrone)的[postcss-px-to-viewport](https://github.com/evrone/postcss-px-to-viewport) 的 master 分支;
- 由于它没有在 `npm` 上传包含 `include` 功能的代码；故自行上传
