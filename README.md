# ComicRead iPad

面向 **iPad 漫画阅读**的 ComicRead 修改版，重点调整连续自动滚动和触屏操作。当前版本：**12.15.0.7**。

基于 [hymbz/ComicReadScript](https://github.com/hymbz/ComicReadScript)，并包含 [xfoxfu 分支的快速收藏修复](https://github.com/xfoxfu/ComicReadScript/commit/f767cefc2410331313f9f4261ca0a7474ac8bc4c)。这是独立修改版。

## 主要调整

- **连续向下滚动**：点击播放会进入纵向卷轴模式，按浏览器绘制帧推进。
- **一个速度输入框**：单位为 `px/10ms`，支持 `0.25`、`0.5`、`0.625`、`1` 等小数；数值越大，滚动越快。
- **沉浸阅读**：播放后隐藏工具栏；轻点阅读区只显示或隐藏工具栏，不暂停滚动。
- **手动接管**：点击方形停止按钮可暂停；主动拖动、双指缩放也会暂停。
- 保留 E-Hentai 快速收藏请求格式修复。

新安装的默认速度为 `0.625 px/10ms`。覆盖旧版本时会换算显示原来的速度。

`px/10ms` 是速度单位，并不表示设备每 10 毫秒一定刷新一次画面。实际绘制频率由浏览器、屏幕刷新率和设备负载决定。

## 安装

需要先在 iPad 浏览器中启用支持用户脚本的管理器，并允许它访问要阅读的网站。

1. 打开 [安装脚本 ComicRead.user.js](https://raw.githubusercontent.com/orasenpei/ComicRead-iPad/master/ComicRead.user.js)，使用脚本管理器安装或导入。
2. 如果管理器无法直接导入，打开 [TXT 版本](https://raw.githubusercontent.com/orasenpei/ComicRead-iPad/master/ComicRead-iPad.txt)，复制全文，替换原 ComicRead 脚本的全部代码并保存。
3. 确认脚本已启用，然后刷新漫画网页。

请只启用一个 ComicRead 版本，避免原版与本版同时运行。支持的网站以原项目适配范围为基础。

## 使用

进入阅读模式后，在设置中启用“自动滚动”，填写“滚动速度”，再点击播放。

可以先试 `0.5`，需要更快时调大，需要更慢时调小。轻点屏幕可找回工具栏，再点方形停止按钮暂停。

## 验证范围

已通过脚本及内嵌模块语法检查、速度换算与模拟帧测试，以及隔离的无头 Chrome 页面中的入口初始化、工具栏显示和播放交互测试。尚未进行 iPad 真机兼容性测试，不同 iPadOS、浏览器和脚本管理器的表现可能不同。

## 来源与许可证

- 原项目与原作者：[hymbz/ComicReadScript](https://github.com/hymbz/ComicReadScript)，hymbz。
- 修改基础：[xfoxfu/ComicReadScript](https://github.com/xfoxfu/ComicReadScript)，提交 `f767cefc2410331313f9f4261ca0a7474ac8bc4c`。
- 本版继续采用 **AGPL-3.0-or-later**，保留原有署名及许可声明，完整许可文本见 `LICENSE`。

## 源码与构建

本仓库保留完整的上游源码快照，iPad 修改在解包后的 JavaScript 模块中维护：

- `upstream/`：上述固定提交的完整上游文件，包括 TypeScript/SolidJS 源码、构建脚本、依赖锁文件和原版打包文件。
- `ipad-src/Manga.js`：本版阅读器模块，包含连续滚动、速度设置与触屏操作修改。
- `ipad-src/ehentai.js`：包含快速收藏修复的站点模块。
- `scripts/build.mjs`：将两个修改模块装入固定的上游用户脚本，更新本版元数据，并验证 50 个模块均可解析。
- `release.config.json`：本版版本号和发布仓库地址。

安装 Node.js 18 或更新版本后，在仓库根目录运行：

```sh
node scripts/build.mjs
node scripts/verify.mjs
```

构建不需要安装 npm 依赖或访问网络，会重建根目录的 `ComicRead.user.js` 与 `ComicRead-iPad.txt`。两个文件内容相同。检查命令验证产物与源码逐字一致、模块语法、保留的上游模块和小数速度设置。

本版的维护入口是 `ipad-src/`，不是 `upstream/src/`；只运行上游构建命令不会包含 iPad 修改。上游源码用于提供对应源码及参考，其原有构建方式见 `upstream/package.json` 和 `upstream/README.md`。
