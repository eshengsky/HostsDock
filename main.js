'use strict';
const path = require('path');
const fs = require('fs');
const i18n = require('i18n');
const electron = require('electron');
// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;
const Menu = electron.Menu;
const debug = /--debug/.test(process.argv[2]);

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow = null;
const config = path.resolve(app.getPath('userData'), 'config.json');
const localeArray = ['en-US', 'zh-CN', 'zh-TW'];

function initialize() {
    var shouldQuit = makeSingleInstance();
    if (shouldQuit) {
        return app.quit();
    }

    i18n.configure({
        locales: localeArray,
        directory: __dirname + '/locales',
        objectNotation: true
    });

    function createWindow() {
        var windowOptions = {
            width: 1080,
            minWidth: 680,
            height: 840,
            icon: path.join(__dirname, `${process.platform === 'win32' ? '/public/image/hostsdock.ico' : '/public/image/hostsdock.png'}`)
        };

        // Create the browser window.
        mainWindow = new BrowserWindow(windowOptions);

        // and load the index.html of the app.
        mainWindow.loadURL(path.join('file://', __dirname, '/index.html'));

        if (debug) {
            mainWindow.webContents.openDevTools();
            mainWindow.maximize();
        }

        // Emitted when the window is closed.
        mainWindow.on('closed', function () {
            // Dereference the window object, usually you would store windows
            // in an array if your app supports multi windows, this is the time
            // when you should delete the corresponding element.
            mainWindow = null;
        });
    }

    /**
     * get current locale
     * @returns {*}
     */
    function getLocale() {
        // get locale from config if exists
        var locale;
        try {
            var data = fs.readFileSync(config, 'utf8');
            data = JSON.parse(data);
            locale = data.locale;
        } catch (e) {

        }

        // then try get current env locale
        if (!locale) {
            locale = app.getLocale();
        }

        // if not in the 3 locales, return en-US
        if (localeArray.indexOf(locale) === -1) {
            locale = 'en-US';
        }
        return locale;
    }

    /**
     * set locale
     * @param locale
     */
    function setLocale(locale) {
        try {
            var data = fs.readFileSync(config, 'utf8');
            data = JSON.parse(data);
            data.locale = locale;
            fs.writeFileSync(config, JSON.stringify(data, null, 4), 'utf8');
        } catch (e) {

        }
    }

    // This method will be called when Electron has finished
    // initialization and is ready to create browser windows.
    app.on('ready', function () {
        createWindow();
        var locale = getLocale();
        i18n.setLocale(locale);
        // Menus
        var template = [{
            label: i18n.__('main_menu.program'),
            submenu: [{
                label: i18n.__('main_menu.reload'),
                accelerator: 'CmdOrCtrl+R',
                click: function (item, focusedWindow) {
                    if (focusedWindow) {
                        // on reload, start fresh and close any old
                        // open secondary windows
                        if (focusedWindow.id === 1) {
                            BrowserWindow.getAllWindows().forEach(function (win) {
                                if (win.id > 1) {
                                    win.close()
                                }
                            })
                        }
                        focusedWindow.reload()
                    }
                }
            }, {
                label: i18n.__('main_menu.full_screen'),
                accelerator: (function () {
                    if (process.platform === 'darwin') {
                        return 'Ctrl+Command+F'
                    } else {
                        return 'F11'
                    }
                })(),
                click: function (item, focusedWindow) {
                    if (focusedWindow) {
                        focusedWindow.setFullScreen(!focusedWindow.isFullScreen())
                    }
                }
            }, {
                label: i18n.__('main_menu.exit'),
                accelerator: 'CmdOrCtrl+W',
                role: 'close'
            }]
        }, {
            label: i18n.__('main_menu.edit'),
            submenu: [{
                label: i18n.__('main_menu.copy'),
                accelerator: 'CmdOrCtrl+C',
                role: 'copy'
            }, {
                label: i18n.__('main_menu.cut'),
                accelerator: 'CmdOrCtrl+X',
                role: 'cut'
            }, {
                label: i18n.__('main_menu.paste'),
                accelerator: 'CmdOrCtrl+V',
                role: 'paste'
            }, {
                label: i18n.__('main_menu.select_all'),
                accelerator: 'CmdOrCtrl+A',
                role: 'selectall'
            }]
        }, {
            label: 'Language',
            submenu: [{
                label: 'English',
                type: 'checkbox',
                checked: locale === 'en-US',
                click: function () {
                    setLocale('en-US');
                    app.relaunch();
                    app.exit(0);
                }
            }, {
                label: '简体中文',
                type: 'checkbox',
                checked: locale === 'zh-CN',
                click: function () {
                    setLocale('zh-CN');
                    app.relaunch();
                    app.exit(0);
                }
            }, {
                label: '繁體中文',
                type: 'checkbox',
                checked: locale === 'zh-TW',
                click: function () {
                    setLocale('zh-TW');
                    app.relaunch();
                    app.exit(0);
                }
            }]
        }, {
            label: i18n.__('main_menu.help'),
            submenu: [{
                label: i18n.__('main_menu.version') + ' ' + app.getVersion(),
                enabled: false
            }, {
                label: i18n.__('main_menu.homepage'),
                click: function () {
                    electron.shell.openExternal('https://github.com/eshengsky/HostsDock')
                }
            }, {
                label: i18n.__('main_menu.about'),
                click: function () {
                    electron.shell.openExternal('http://www.skysun.name/about')
                }
            }]
        }];
        const menu = Menu.buildFromTemplate(template);
        Menu.setApplicationMenu(menu);
    });

    // Quit when all windows are closed.
    app.on('window-all-closed', function () {
        // On OS X it is common for applications and their menu bar
        // to stay active until the user quits explicitly with Cmd + Q
        if (process.platform !== 'darwin') {
            app.quit();
        }
    });

    app.on('activate', function () {
        // On OS X it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (mainWindow === null) {
            createWindow();
        }
    });
}

function makeSingleInstance() {
    return app.makeSingleInstance(function () {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus()
        }
    })
}

initialize();

