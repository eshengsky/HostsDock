'use strict';
const path = require('path');
const fs = require('fs');
const i18n = require('i18n');
const electron = require('electron');
const ipc = electron.ipcMain;
const Tray = electron.Tray;
const dialog = electron.dialog;

// Module to control application life.
const app = electron.app;

if (require('electron-squirrel-startup')) {
    app.quit();
}

// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;
const Menu = electron.Menu;
const debug = /--debug/.test(process.argv[2]);

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow = null;
let tray = null;
const config = path.resolve(app.getPath('userData'), 'config.json');
const localeArray = ['en-US', 'zh-CN', 'zh-TW'];

function initialize() {
    const shouldQuit = makeSingleInstance();
    if (shouldQuit) {
        return app.exit(0);
    }

    i18n.configure({
        locales: localeArray,
        directory: `${__dirname}/locales`,
        objectNotation: true
    });

    function createWindow() {
        const windowOptions = {
            width: 1080,
            minWidth: 680,
            height: 840,
            icon: path.join(__dirname, `${process.platform === 'win32' ? '/public/image/hostsdock.ico' : '/public/image/hostsdock.png'}`),
            show: false
        };

        // Create the browser window.
        mainWindow = new BrowserWindow(windowOptions);

        // and load the index.html of the app.
        mainWindow.loadURL(path.join('file://', __dirname, '/index.html'));

        if (debug) {
            mainWindow.webContents.openDevTools();
            mainWindow.maximize();
        }

        mainWindow.once('ready-to-show', () => {
            mainWindow.show();
        });

        mainWindow.on('close', event => {
            event.preventDefault();
            mainWindow.hide();
        });

        // Emitted when the window is closed.
        mainWindow.on('closed', () => {
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
        let locale;
        try {
            let data = fs.readFileSync(config, 'utf8');
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
            let data = fs.readFileSync(config, 'utf8');
            data = JSON.parse(data);
            data.locale = locale;
            fs.writeFileSync(config, JSON.stringify(data, null, 4), 'utf8');
        } catch (e) {

        }
    }

    // This method will be called when Electron has finished
    // initialization and is ready to create browser windows.
    app.on('ready', () => {
        createWindow();
        const locale = getLocale();
        i18n.setLocale(locale);

        ipc.on('save-dialog', (event, data) => {
            const options = {
                title: i18n.__('renderer.export_title'),
                defaultPath: 'hosts',
                buttonLabel: i18n.__('renderer.btnExport')
            };
            dialog.showSaveDialog(options, fileName => {
                event.sender.send('save-file', {
                    fileName,
                    id: data.id,
                    url: data.url
                });
            });
        });

        // Tray
        tray = new Tray(path.join(__dirname, `${process.platform === 'win32' ? '/public/image/hostsdock.ico' : '/public/image/hostsdock.png'}`));
        tray.on('double-click', () => {
            mainWindow.show();
        });
        tray.setToolTip('HostsDock');

        ipc.on('tray', (event, data) => {
            const appliedId = data.appliedId;

            // list local schema
            const list = [{
                label: i18n.__('renderer.local'),
                enabled: false
            }];
            data.localHosts.forEach(item => {
                list.push({
                    label: item.name,
                    type: 'checkbox',
                    checked: item.id === appliedId,
                    click() {
                        mainWindow.webContents.send('apply', {
                            id: item.id,
                            name: item.name
                        });
                    }
                });
            });

            // list remote schema
            list.push({
                label: i18n.__('renderer.remote'),
                enabled: false
            });
            data.remoteHosts.forEach(item => {
                list.push({
                    label: item.name,
                    type: 'checkbox',
                    checked: item.id === appliedId,
                    click() {
                        mainWindow.webContents.send('apply', {
                            id: item.id,
                            name: item.name,
                            url: item.url
                        });
                    }
                });
            });

            list.push({
                type: 'separator'
            }, {
                label: i18n.__('tray_menu.win'),
                click() {
                    mainWindow.show();
                }
            }, {
                label: i18n.__('main_menu.exit'),
                click() {
                    app.exit(0);
                }
            });
            const contextMenu = Menu.buildFromTemplate(list);
            tray.setContextMenu(contextMenu);
        });

        // Menus
        const template = [{
            label: i18n.__('main_menu.file'),
            submenu: [{
                label: i18n.__('main_menu.new'),
                accelerator: 'CmdOrCtrl+N',
                click(item, focusedWindow) {
                    // send to renderer
                    focusedWindow.webContents.send('new', true);
                }
            }, {
                label: i18n.__('renderer.btnExport'),
                accelerator: 'CmdOrCtrl+E',
                click(item, focusedWindow) {
                    // send to renderer
                    focusedWindow.webContents.send('export', true);
                }
            }, {
                type: 'separator'
            }, {
                label: i18n.__('main_menu.reload'),
                accelerator: 'CmdOrCtrl+R',
                click(item, focusedWindow) {
                    if (focusedWindow) {
                        app.relaunch();
                        app.exit(0);
                    }
                }
            }, {
                label: i18n.__('main_menu.exit'),
                accelerator: 'CmdOrCtrl+W',
                click() {
                    app.exit(0);
                }
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
                click() {
                    setLocale('en-US');
                    app.relaunch();
                    app.exit(0);
                }
            }, {
                label: '简体中文',
                type: 'checkbox',
                checked: locale === 'zh-CN',
                click() {
                    setLocale('zh-CN');
                    app.relaunch();
                    app.exit(0);
                }
            }, {
                label: '繁體中文',
                type: 'checkbox',
                checked: locale === 'zh-TW',
                click() {
                    setLocale('zh-TW');
                    app.relaunch();
                    app.exit(0);
                }
            }]
        }, {
            label: i18n.__('main_menu.window'),
            submenu: [{
                label: i18n.__('main_menu.min'),
                role: 'minimize'
            }, {
                label: i18n.__('main_menu.full_screen'),
                accelerator: (function () {
                    if (process.platform === 'darwin') {
                        return 'CmdOrCtrl+F';
                    }
                    return 'F11';
                }()),
                click(item, focusedWindow) {
                    if (focusedWindow) {
                        focusedWindow.setFullScreen(!focusedWindow.isFullScreen());
                    }
                }
            }]
        }, {
            label: i18n.__('main_menu.help'),
            submenu: [{
                label: `${i18n.__('main_menu.version')} ${app.getVersion()}`,
                enabled: false
            }, {
                label: i18n.__('main_menu.homepage'),
                click() {
                    electron.shell.openExternal('https://github.com/eshengsky/HostsDock');
                }
            }, {
                label: i18n.__('main_menu.issue'),
                click() {
                    electron.shell.openExternal('https://github.com/eshengsky/HostsDock/issues');
                }
            }, {
                type: 'separator'
            }, {
                label: i18n.__('main_menu.devtool'),
                accelerator: (function () {
                    if (process.platform === 'darwin') {
                        return 'CmdOrCtrl+T';
                    }
                    return 'F12';
                }()),
                role: 'toggledevtools'
            }, {
                type: 'separator'
            }, {
                label: i18n.__('main_menu.about'),
                click() {
                    electron.shell.openExternal('http://www.skysun.name/about');
                }
            }]
        }];
        const menu = Menu.buildFromTemplate(template);
        Menu.setApplicationMenu(menu);
    });

    // Quit when all windows are closed.
    app.on('window-all-closed', () => {
        // On OS X it is common for applications and their menu bar
        // to stay active until the user quits explicitly with Cmd + Q
        if (process.platform !== 'darwin') {
            app.quit();
        }
    });

    app.on('activate', () => {
        if (mainWindow === null) {
            createWindow();
        } else {
            mainWindow.show();
        }
    });

    app.on('before-quit', () => {
        app.isQuiting = true;
    });
}

function makeSingleInstance() {
    return app.makeSingleInstance(() => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
    });
}

initialize();
