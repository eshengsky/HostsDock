<a href="https://eshengsky.github.io/HostsDock/"><img src="https://github.com/eshengsky/HostsDock/blob/master/public/image/hostsdock.png" height="150" align="right"></a>

# HostsDock

[中文文档](https://github.com/eshengsky/HostsDock/blob/master/README_zh.md)

:tada: Store, manage and switch your hosts quickly. Especially suitable for developers who need to switch frequently between development, test and production environment. Based on [Node.js](https://nodejs.org) and [Electron](http://electron.atom.io/).

[https://eshengsky.github.io/HostsDock/](https://eshengsky.github.io/HostsDock/)

## UI review
![image](https://github.com/eshengsky/HostsDock/blob/master/public/image/review_en.png)

## Features
* Support for both local and remote scheme.
* Support for hosts syntax highlighting.
* Provide search and replace functions.
* Click on the line number can quickly select the entire line.
* Click on the the '#' button before line number can quickly comment/uncomment.
* Original folding syntax, using #region and #endregion can create a folding hosts block.
* Support for testing ips in hosts with `ping` command.
* The program will automatically call CMD (or terminal) to refresh the hosts so that the changes will take effect immediately.
* Support system tray to quickly switch hosts.
* Multi-language support (English, Simplified Chinese, traditional Chinese).

## Compatibility
Support OS X, Windows and Linux platform, see more details in [Supported Platforms](http://electron.atom.io/docs/tutorial/supported-platforms/).

## :gift: [Download](https://github.com/eshengsky/HostsDock/releases)

## Quick start
Firstly be sure you have installed [Node.js](https://nodejs.org/en/download/) and [NPM](https://www.npmjs.com/) successfully.
#### Install bower global
```shell
$ npm install -g bower
```
#### Install dependency
```shell
$ npm install
```
```shell
$ bower install
```
#### Start app
```shell
$ npm start
```
To start app with debug model, use:
```shell
$ npm run dev
```
**Enjoy it!** :smile:

## How to package
We use [electron-packager](https://github.com/electron-userland/electron-packager) package the application to facilitate the distribution of it.
#### Install electron-packager global
```shell
$ npm install -g electron-packager
```
#### Package app
After finished all operations in [Quick start](#quick-start), go into the app folder, execute:
```shell
$ npm run package
```

#### Attentions
* During packing electron-packager will download all required files and cache them in `~/.electron` folder（`user/your_user_name/.electron` in Windows）, it may be very slow, I suggest you to manually download them into the folder through some download tool (the required files see [Electron Release](https://github.com/electron/electron/releases)).
* Packing Darwin app in Windows may fail (even if there is no error, packaged application may also be unable to run in OS X), there seems no nice solution now, I suggest you to package Darwin app on non-Windows platform. See more details in [Issue 164](https://github.com/electron-userland/electron-packager/issues/164).

## License
The MIT License (MIT)

Copyright (c) 2017 Sky

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
