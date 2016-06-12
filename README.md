# HostsDock
:tada: Store, manage and switch your hosts, Especially suitable for developers who need to switch frequently between development, test and production environment. 存储、管理、快速切换你的hosts，尤其适合需要在开发环境、测试环境和生产环境之间频繁切换的开发人员使用。   
Based on [Node.js](https://nodejs.org) and [Electron](http://electron.atom.io/). 基于 [Node.js](https://nodejs.org) 和 [Electron](http://electron.atom.io/) 构建。

## UI review 界面预览
![image](https://github.com/eshengsky/HostsDock/blob/master/public/image/hostsdock.png)

## Functional features 功能特色
* Support for both local and remote scheme. 支持创建本地 hosts 方案和远程 hosts 方案。
* Support for syntax highlighting. 支持 hosts 语法高亮。
* Provide search and replace functions. 提供查找和替换功能。
* Click on the line number can quickly select the entire line. 点击行号可以快速选中整行。
* Click on the the '#' button before line number can quickly comment/uncomment. 点击行号前的 '#' 按钮，可以快速注释/取消注释。
* Original folding syntax, using #region and #endregion can create a folding hosts block. 独创折叠语法，使用 #region 和 #endregion 可以创建一个可折叠的 hosts 块。
* The program will automatically call CMD (or terminal) to refresh the hosts so that the changes will take effect immediately. 程序会自动调用 cmd 或终端刷新 hosts 让改动立即生效。
* Multi-language support (English, Simplified Chinese, traditional Chinese). 多语言支持（英文、简体中文、繁体中文）。

## Compatibility 兼容性
Support OS X, Windows and Linux platform, see more details in [Supported Platforms](http://electron.atom.io/docs/tutorial/supported-platforms/)。 支持 OS X, Windows 及 Linux 操作系统，详细的支持情况参见 [支持的平台](http://electron.atom.io/docs/tutorial/supported-platforms/)。

## :gift: Download 应用下载
Here is packaged app, download directly then extract the compressed package, execute HostsDock or HostsDock.exe to run. 这里是已经打包好的应用，直接下载压缩包并解压，执行文件夹中的 HostsDock 或 HostsDock.exe 即可运行。  
Local 本地下载：https://github.com/eshengsky/HostsDock/releases  
Baidu 百度网盘：http://pan.baidu.com/s/1hrQVrpy  

## Quick start 快速开始
Firstly be sure you have installed [Node.js](https://nodejs.org/en/download/) and [NPM](https://www.npmjs.com/) successfully. 请先确保已成功安装 [Node.js](https://nodejs.org/en/download/) 和 [NPM](https://www.npmjs.com/)。  
#### Install bower global 全局安装bower
```shell
$ npm install -g bower
```
#### Install dependency 安装依赖包
```shell
$ npm install
```
```shell
$ bower install
```
#### Install electron-prebuilt global 全局安装electron-prebuilt
```shell
$ npm install -g electron-prebuilt
```
#### Start app 启动应用
```shell
$ npm start
```
To start app with debug model, use: 如果想以 debug 模式启动应用，请使用：
```shell
$ npm run dev
```
**Enjoy it!** :smile:

## How to package 如何打包
We use [electron-packager](https://github.com/electron-userland/electron-packager) package the application to facilitate the distribution of it. 可以使用 [electron-packager](https://github.com/electron-userland/electron-packager) 对程序进行打包以方便分发应用。
#### Install electron-packager global 全局安装electron-packager
```shell
$ npm install -g electron-packager
```
#### Package app 打包应用
After finished all operations in [Quick start 快速开始](#quick-start-快速开始), go into the app folder, execute: 在完成了[Quick start 快速开始](#quick-start-快速开始)全部操作的前提下，进入需要打包的应用的目录，执行：
```shell
$ electron-packager . --all --asar --prune
```
See more parameter details in [usage](https://github.com/electron-userland/electron-packager/blob/master/usage.txt). 详细参数说明请参见 [usage](https://github.com/electron-userland/electron-packager/blob/master/usage.txt)。

#### Attentions 注意事项
* During packing electron-packager will download all required files and cache them in `~/.electron` folder（`user/your_user_name/.electron` in Windows）, it may be very slow, I suggest you to manually download them into the folder through some download tool (the required files see [Electron Release](https://github.com/electron/electron/releases)). 打包过程中 electron-packager 会自动下载所需的文件并存放到 `~/.electron` 目录（Windows 系统是 `user/你的用户名/.electron`）中，自动下载可能会比较慢，建议直接在 [Electron Release](https://github.com/electron/electron/releases) 使用下载工具进行下载并放到上述目录中。
* Packing Darwin app in Windows may fail (even if there is no error, packaged application may also be unable to run in OS X), there seems no nice solution now, I suggest you to package Darwin app on non-Windows platform. See more details in [Issue 164](https://github.com/electron-userland/electron-packager/issues/164). 在 Windows 平台下打包 Darwin 应用可能会失败（即使没有报错打包好的应用放到 OS X 下可能也无法运行），目前没有有效的解决方案，建议在非 Windows 平台打包 Darwin 应用。详见 [Issue 164](https://github.com/electron-userland/electron-packager/issues/164)。

## License 许可协议
The MIT License (MIT)

Copyright (c) 2016 Sky

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
