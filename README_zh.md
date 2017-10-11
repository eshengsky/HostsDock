<a href="https://eshengsky.github.io/HostsDock/"><img src="https://github.com/eshengsky/HostsDock/blob/master/public/image/hostsdock.png" height="120" align="right"></a>

# HostsDock

[English Readme](https://github.com/eshengsky/HostsDock/blob/master/README.md)

:tada: 存储、管理、快速切换你的hosts，尤其适合需要在开发环境、测试环境和生产环境之间频繁切换的开发人员使用。基于 [Node.js](https://nodejs.org) 和 [Electron](http://electron.atom.io/) 构建。

[https://eshengsky.github.io/HostsDock/](https://eshengsky.github.io/HostsDock/)


## 界面预览
![image](https://github.com/eshengsky/HostsDock/blob/master/public/image/review_cn.png)

## 功能特色
* 支持创建本地 hosts 方案和远程 hosts 方案。
* 支持 hosts 语法高亮。
* 提供查找和替换功能。
* 点击行号可以快速选中整行。
* 点击行号前的 '#' 按钮，可以快速注释/取消注释。
* 独创折叠语法，使用 #region 和 #endregion 可以创建一个可折叠的 hosts 块。
* 支持使用 `ping` 命令检测 ip 地址连通性。
* 程序会自动调用 cmd 或终端刷新 hosts 让改动立即生效。
* 支持系统托盘以快速切换 hosts。
* 多语言支持（英文、简体中文、繁体中文）。

## 兼容性
支持 OS X, Windows 及 Linux 操作系统，详细的支持情况参见 [支持的平台](http://electron.atom.io/docs/tutorial/supported-platforms/)。

## :gift: [应用下载](https://github.com/eshengsky/HostsDock/releases)

## 快速开始
请先确保已成功安装 [Node.js](https://nodejs.org/en/download/) 和 [NPM](https://www.npmjs.com/)。  
#### 全局安装bower
```shell
$ npm install -g bower
```
#### 安装依赖包
```shell
$ npm install
```
```shell
$ bower install
```
#### 启动应用
```shell
$ npm start
```
如果想以 debug 模式启动应用，请使用：
```shell
$ npm run dev
```
**Enjoy it!** :smile:

## 如何打包
可以使用 [electron-packager](https://github.com/electron-userland/electron-packager) 对程序进行打包以方便分发应用。
#### 全局安装electron-packager
```shell
$ npm install -g electron-packager
```
#### 打包应用
在完成了[快速开始](#快速开始)全部操作的前提下，进入需要打包的应用的目录，执行：
```shell
$ npm run package
```

#### 注意事项
* 打包过程中 electron-packager 会自动下载所需的文件并存放到 `~/.electron` 目录（Windows 系统是 `user/你的用户名/.electron`）中，自动下载可能会比较慢，建议直接在 [Electron Release](https://github.com/electron/electron/releases) 使用下载工具进行下载并放到上述目录中。
* 在 Windows 平台下打包 Darwin 应用可能会失败（即使没有报错打包好的应用放到 OS X 下可能也无法运行），目前没有有效的解决方案，建议在非 Windows 平台打包 Darwin 应用。详见 [Issue 164](https://github.com/electron-userland/electron-packager/issues/164)。

## 许可协议
The MIT License (MIT)

Copyright (c) 2017 Sky

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
