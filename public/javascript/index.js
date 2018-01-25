const fs = require('fs');
const cp = require('child_process');
const electron = require('electron');
const remote = electron.remote;
const app = remote.app;
const ipc = electron.ipcRenderer;
const shell = electron.shell;
const notifier = require('node-notifier');
const path = require('path');
const moment = require('moment');
const shortid = require('shortid');
const request = require('request');
const async = require('async');
const ping = require('ping');
const BrowserWindow = remote.BrowserWindow;
const showdown = require('showdown');
const i18n = require('i18n');
const localeArray = ['en-US', 'zh-CN', 'zh-TW', 'it-IT'];
i18n.configure({
    locales: localeArray,
    directory: path.join(__dirname, '../../locales'),
    objectNotation: true
});
let locale;
try {
    let data = fs.readFileSync(path.resolve(app.getPath('userData'), 'config.json'), 'utf8');
    data = JSON.parse(data);
    locale = data.locale;
} catch (e) {

}
if (!locale) {
    locale = app.getLocale();
}
if (localeArray.indexOf(locale) === -1) {
    locale = 'en-US';
}
i18n.setLocale(locale);

class HostsDock {
    constructor() {
        this.hostsDockDir = path.resolve(app.getPath('userData'), 'LocalHosts'); // local hosts folder
        this.configFile = path.resolve(app.getPath('userData'), 'config.json'); // user config path
        this.reportFile = path.resolve(app.getPath('userData'), 'report.html');
        this.platForm = process.platform;
        this.sysHostsFile = this.platForm === 'win32' ? 'c:\\windows\\system32\\drivers\\etc\\hosts' : '/etc/hosts'; // system hosts path
        this.originalHostsId = 'orignial';
        this.originalHostsName = i18n.__('renderer.original_hosts');
        this.backupHostsId = 'backup';
        this.backupHostsName = i18n.__('renderer.backup_hosts');
        this.systemHostsId = 'system';
        this.loadingMin = 500;
        this.urlPattern = /((\w+:\/\/|\\\\)[-a-zA-Z0-9:@;?&=\/%\+\.\*!'\(\),\$_\{\}\^~\[\]`#|]+)/;
        this.editor = ace.edit('hosts-content');
        this.buffer = null; // the cache for content change, set:editor changed manually, get:listener triggers
        this.bufferTimeInterval = 1000; // interval time to batch write
    }

    /**
     * initial
     */
    init() {
        this.detectFiles();
        this.initUiText();
        this.loadEditor();
        this.watchSysHosts();
        this.bindEvents();
        this.contentChange();
    }

    /**
     * detect necessary files
     */
    detectFiles() {
        // check if original file/folder exists
        async.map([this.hostsDockDir, this.configFile], fs.stat, (err, results) => {
            // first run app
            if (err || !results[0].isDirectory() || !results[1].isFile()) {
                let counter = 0;

                const cb = function () {
                    counter++;
                    if (counter === 3) {
                        // all async func finished
                        $('.mask').remove();
                    }
                };

                // create LocalHosts folder
                fs.mkdir(this.hostsDockDir, err => {
                    if (err && err.code !== 'EEXIST') {
                        swal({
                            title: i18n.__('renderer.create_local_dir_err'),
                            text: err.message,
                            type: 'error'
                        });
                    } else {
                        // create an original file
                        const now = moment(Date.now())
                            .format('YYYY/MM/DD HH:mm:ss');
                        this.writeHostsContent(this.originalHostsId, `# HostsDock - Created at ${now}
#region Localhost
127.0.0.1 localhost
255.255.255.255 broadcasthost
#endregion`, err => {
                                if (err) {
                                    swal({
                                        title: i18n.__('renderer.create_file_err', this.originalHostsName),
                                        text: err.message,
                                        type: 'error'
                                    });
                                } else {
                                    cb();
                                }
                            });

                        // create a system backup file, copy content from system hosts
                        this.copyHostsContent(this.systemHostsId, this.backupHostsId, err => {
                            if (err) {
                                swal({
                                    title: i18n.__('renderer.create_file_err', this.backupHostsName),
                                    text: err.message,
                                    type: 'error'
                                });
                            } else {
                                cb();
                            }
                        });
                    }
                });
                const config = {
                    appliedId: '',
                    locale: '',
                    fontSize: '14',
                    localHosts: [{
                        id: this.originalHostsId,
                        name: this.originalHostsName,
                        file: this.originalHostsId
                    }, {
                        id: this.backupHostsId,
                        name: this.backupHostsName,
                        file: this.backupHostsId
                    }],
                    remoteHosts: []
                };

                // create user config file
                fs.writeFile(this.configFile, JSON.stringify(config, null, 4), err => {
                    if (err) {
                        swal({
                            title: i18n.__('renderer.create_config_err'),
                            text: err.message,
                            type: 'error'
                        });
                    } else {
                        cb();
                    }
                });

                // In order to improve the execution efficiency, the method does not rely on the necessary files when passed true
                this.loadHostsList(true);
            } else {
                this.loadHostsList();
            }
        });
    }

    /**
     * load hosts list
     */
    loadHostsList(isFirst = false) {
        if (isFirst) {
            $('.nav-local')
                .append(`<li><a class='lk-hosts' data-hosts-id='${this.originalHostsId}'><i class='applied fa fa-check' title='${i18n.__('renderer.applied')}'></i><i class='fa fa-file-text-o'></i> <span>${this.originalHostsName}</span><i class='loading fa fa-spinner fa-spin' title='${i18n.__('renderer.loading')}'></i></a></li>` +
                `<li><a class='lk-hosts' data-hosts-id='${this.backupHostsId}'><i class='applied fa fa-check' title='${i18n.__('renderer.applied')}'></i><i class='fa fa-file-text-o'></i> <span>${this.backupHostsName}</span><i class='loading fa fa-spinner fa-spin' title='${i18n.__('renderer.loading')}'></i></a></li>`);
            $(`.lk-hosts[data-hosts-id='${this.systemHostsId}']`)
                .click();
            ipc.send('tray', {
                appliedId: '',
                localHosts: [{
                    id: this.originalHostsId,
                    name: this.originalHostsName
                }, {
                    id: this.backupHostsId,
                    name: this.backupHostsName
                }],
                remoteHosts: []
            });
        } else {
            fs.readFile(this.configFile, 'utf8', (err, data) => {
                if (err) {
                    swal({
                        title: i18n.__('renderer.load_list_err'),
                        text: err.message,
                        type: 'error'
                    });
                } else {
                    data = JSON.parse(data);

                    ipc.send('tray', data);

                    const appliedId = data.appliedId;
                    const localHosts = data.localHosts;
                    const remoteHosts = data.remoteHosts;
                    let localHtml = '';
                    const allIdArr = [];
                    localHosts.forEach(item => {
                        allIdArr.push(item.id);
                        localHtml += `<li><a class='lk-hosts' data-hosts-id='${item.id}'><i class='applied fa fa-check' style='${appliedId === item.id ? 'display:inline-block' : ''}' title='${i18n.__('renderer.applied')}'></i><i class='fa fa-file-text-o'></i> <span>${item.name}</span><i class='loading fa fa-spinner fa-spin' title='${i18n.__('renderer.loading')}'></i></a></li>`;
                    });
                    $('.nav-local')
                        .append(localHtml);
                    let remoteHtml = '';
                    remoteHosts.forEach(item => {
                        allIdArr.push(item.id);
                        remoteHtml += `<li><a class='lk-hosts' data-hosts-id='${item.id}' data-hosts-url='${item.url}'><i class='applied fa fa-check' style='${appliedId === item.id ? 'display:inline-block' : ''}' title='${i18n.__('renderer.applied')}'></i><i class='fa fa-globe'></i> <span>${item.name}</span><i class='loading fa fa-spinner fa-spin' title='${i18n.__('renderer.loading')}'></i></a></li>`;
                    });
                    $('.nav-remote')
                        .append(remoteHtml);

                    // already applied some scheme when last exit
                    if (appliedId && allIdArr.indexOf(appliedId) >= 0) {
                        $(`.lk-hosts[data-hosts-id='${appliedId}']`)
                            .click();
                    } else {
                        $(`.lk-hosts[data-hosts-id='${this.systemHostsId}']`)
                            .click();
                    }

                    // remove mask, show page
                    $('.mask').remove();
                }
            });
        }
    }

    /**
     * init UI text
     */
    initUiText() {
        $('.title-sys span')
            .text(i18n.__('renderer.system'));
        $('.title-sys p')
            .text(i18n.__('renderer.system_desc'));
        $('[data-hosts-id=system] span')
            .text(i18n.__('renderer.system_hosts'));
        $('[data-hosts-id=system] i:eq(1)')
            .attr('title', i18n.__('renderer.loading'));
        $('.time-li')
            .attr('title', i18n.__('renderer.update_time'));
        $('#update-at')
            .text(i18n.__('renderer.update_at'));
        $('.title-local span')
            .text(i18n.__('renderer.local'));
        $('.title-local p')
            .text(i18n.__('renderer.local_desc'));
        $('.title-remote span')
            .text(i18n.__('renderer.remote'));
        $('.title-remote p')
            .text(i18n.__('renderer.remote_desc'));

        $('#btnNew')
            .attr('title', i18n.__('renderer.btnNew'));
        $('#btnRefresh')
            .attr('title', i18n.__('renderer.btnRefresh'));
        $('#btnExport')
            .attr('title', i18n.__('renderer.btnExport'));
        $('#btnEdit')
            .attr('title', i18n.__('renderer.btnEdit'));
        $('#btnCheck')
            .attr('title', i18n.__('renderer.btnCheck'));
        $('#btnDelete')
            .attr('title', i18n.__('renderer.btnDelete'));
        $('#btnApply')
            .attr('title', i18n.__('renderer.btnApply'));
        $('#btnApplyTxt').text(i18n.__('renderer.btnApply'));
        $('#btnSys')
            .attr('title', i18n.__('renderer.btnSysTxt'));
        $('#btnSysTxt').text(i18n.__('renderer.btnSysTxt'));

        $('#btnUndo')
            .attr('title', `${i18n.__('renderer.btnUndo')}(Ctrl+Z)`);
        $('#btnRedo')
            .attr('title', `${i18n.__('renderer.btnRedo')}(Ctrl+Shift+Z)`);
        $('#btnCopy')
            .attr('title', `${i18n.__('renderer.btnCopy')}(Ctrl+C)`);
        $('#btnCut')
            .attr('title', `${i18n.__('renderer.btnCut')}(Ctrl+X)`);
        $('#btnPaste')
            .attr('title', `${i18n.__('renderer.btnPaste')}(Ctrl+V)`);
        $('#btnSearch')
            .attr('title', `${i18n.__('renderer.btnSearch')}(Ctrl+F)`);
        $('#btnReplace')
            .attr('title', `${i18n.__('renderer.btnReplace')}(Ctrl+H)`);

        $('.top')
            .attr('title', i18n.__('renderer.btnTop'));
    }

    /**
     * init Editor
     */
    loadEditor() {
        this.editor.setTheme('ace/theme/hosts');
        this.editor.session.setMode('ace/mode/hosts');
        this.editor.$blockScrolling = Infinity;
        this.editor.session.on('change', () => this.changeHandler());
        this.editor.on('mousemove', e => this.mouseMoveHandler(e));
        this.editor.on('guttermousemove', e => this.mouseMoveHandler(e));
        this.editor.on('guttermousedown', e => this.gutterMousedownHandler(e));
        this.editor.session.on('changeScrollTop', top => this.scollHandler(top));
    }

    /**
     * listen for system hosts
     */
    watchSysHosts() {
        fs.stat(this.sysHostsFile, (err, stats) => {
            if (!err) {
                const lastModified = moment(stats.mtime)
                    .format('YYYY/MM/DD HH:mm:ss');
                $('#modified-time')
                    .text(lastModified);
            }
        });
        fs.watchFile(this.sysHostsFile, curr => {
            const lastModified = moment(curr.mtime)
                .format('YYYY/MM/DD HH:mm:ss');
            $('#modified-time')
                .text(lastModified);
        });
    }

    /**
     * bind elements event
     */
    bindEvents() {
        // receive message from main process, to create new schema
        ipc.on('new', () => {
            this.showModalNew();
        });

        // receive message from main process, to apply a schema
        ipc.on('apply', (event, data) => {
            const id = data.id;
            const name = data.name;
            const url = data.url;
            this.applyHosts(id, name, url, (err, msg) => {
                if (err) {
                    swal({
                        title: i18n.__('renderer.operation_failed'),
                        text: err.message,
                        type: 'error'
                    });
                } else {
                    this.popNotification(msg);
                    $('.applied')
                        .hide();
                    const link = $(`.nav-items a[data-hosts-id='${id}']`);
                    link.children('.applied')
                        .show();
                    link.click();
                }
            });
        });

        ipc.on('export', () => {
            $('#btnExport').click();
        });

        ipc.on('save-file', (event, data) => {
            const id = data.id;
            const url = data.url;
            const fileName = data.fileName;
            if (fileName) {
                this.readHostsContent(id, url, (err, content) => {
                    if (err) {
                        swal({
                            title: i18n.__('renderer.operation_failed'),
                            text: err.message,
                            type: 'error'
                        });
                    } else {
                        fs.writeFile(fileName, content, err => {
                            if (err) {
                                swal({
                                    title: i18n.__('renderer.operation_failed'),
                                    text: err.message,
                                    type: 'error'
                                });
                            } else {
                                swal({
                                    title: i18n.__('renderer.export_success'),
                                    text: `${i18n.__('renderer.file_path')}: ${fileName}`,
                                    type: 'success'
                                });
                            }
                        });
                    }
                });
            }
        });

        ipc.on('update', () => {
            request({
                url: 'https://api.github.com/repos/eshengsky/HostsDock/releases',
                timeout: 3000,
                headers: {
                    'User-Agent': 'Mozilla'
                }
            }, (err, response, body) => {
                if (err) {
                    swal({
                        title: i18n.__('renderer.operation_failed'),
                        text: err.message,
                        type: 'error'
                    });
                    return;
                }
                const data = JSON.parse(body);
                const current = Number(app.getVersion().replace(/\./g, ''));
                const versionStr = data[0].tag_name;
                const name = data[0].name;
                const version = Number(versionStr.replace('v', '').replace(/\./g, ''));
                if (version > current) {
                    // 有更新版本
                    let changelog = data[0].body;
                    const converter = new showdown.Converter();
                    changelog = converter.makeHtml(changelog);

                    swal({
                        title: i18n.__('renderer.has_update'),
                        text: `<div class="changelog"><p>${name}</p>${changelog}</div>`,
                        html: true,
                        showCancelButton: true,
                        confirmButtonText: i18n.__('renderer.download_now'),
                        cancelButtonText: i18n.__('renderer.cancel')
                    }, () => {
                        const assets = data[0].assets;
                        let download = '';
                        switch (this.platForm) {
                            case 'win32':
                                download = assets.find(t => t.name.includes('.exe')).browser_download_url;
                                break;
                            case 'darwin':
                                download = assets.find(t => t.name.includes('darwin')).browser_download_url;
                                break;
                            default:
                                download = assets.find(t => t.name.includes('linux')).browser_download_url;
                                break;
                        }
                        shell.openExternal(download);
                    });
                } else {
                    // 没有更新版本
                    swal({
                        title: i18n.__('renderer.no_update'),
                        text: i18n.__('renderer.no_update_desc', versionStr),
                        type: 'success'
                    });
                }
            });
        });

        // nav toggle
        $('.toggle-title')
            .on('click', e => {
                const $this = $(e.currentTarget);
                $this.parent()
                    .toggleClass('is-open');
            });

        // nav click
        $('.nav-items')
            .on('click', '.lk-hosts', e => this.navClickHandler(e));

        // nav double click
        $('.nav-items')
            .on('dblclick', '.lk-hosts', e => {
                const el = $(e.currentTarget);
                el.click();
                const id = el.attr('data-hosts-id');
                if (id !== this.systemHostsId) {
                    $('#btnApply').click();
                }
            });

        $('.nav-items')
            .on('contextmenu', '.lk-hosts', e => {
                const target = e.currentTarget;
                $(target).click();
                const items = [{
                    title: i18n.__('renderer.btnRefresh'),
                    icon: 'fa fa-refresh',
                    fn: () => {
                        $('#btnRefresh').click();
                    }
                }, {
                    title: i18n.__('renderer.btnExport'),
                    icon: 'fa fa-sign-out',
                    fn: () => {
                        $('#btnExport').click();
                    }
                }];

                if ($(target).attr('data-hosts-id') !== this.systemHostsId) {
                    items.push({
                        title: i18n.__('renderer.btnEdit'),
                        icon: 'fa fa-pencil',
                        fn: () => {
                            $('#btnEdit').click();
                        }
                    }, {
                            title: i18n.__('renderer.btnDelete'),
                            icon: 'fa fa-trash-o',
                            fn: () => {
                                $('#btnDelete').click();
                            }
                        }, {}, {
                            title: i18n.__('renderer.btnApply'),
                            icon: 'fa fa-check',
                            fn: () => {
                                $('#btnApply').click();
                            }
                        });
                } else {
                    items.push({}, {
                        title: i18n.__('renderer.btnSysTxt'),
                        icon: 'fa fa-folder-open-o',
                        fn: () => {
                            $('#btnSys').click();
                        }
                    });
                }
                basicContext.show(items, e.originalEvent);
            });

        // new scheme click
        $('#btnNew')
            .on('click', () => {
                this.showModalNew();
            });

        // edit scheme click
        $('#btnEdit')
            .on('click', () => {
                const $currentActiveBtn = $('.nav-items li.active .lk-hosts');
                if ($currentActiveBtn.length > 0) {
                    const id = $currentActiveBtn.attr('data-hosts-id');
                    const url = $currentActiveBtn.attr('data-hosts-url');
                    const name = $currentActiveBtn.find('span')
                        .text();
                    this.showModalEdit(id, name, url);
                }
            });

        // refresh click
        $('#btnRefresh')
            .on('click', e => this.refreshClickHandler(e));

        // export click
        $('#btnExport')
            .on('click', e => this.exportClickHandler(e));

        // delete click
        $('#btnDelete')
            .on('click', () => this.deleteClickHandler());

        // apply click
        $('#btnApply')
            .on('click', e => this.applyClickHandler(e));

        // check click
        $('#btnCheck')
            .on('click', e => this.checkClickHandler(e));

        // open sys folder click
        $('#btnSys')
            .on('click', e => this.sysClickHandler(e));

        // undo click
        $('#btnUndo')
            .on('click', () => {
                // add command.name, the purpose is to determine artificially modified when a change event is triggered
                this.editor.curOp = {
                    command: { name: 'undoClick' }
                };
                this.editor.undo();
                this.editor.curOp = null;
            });

        // redo click
        $('#btnRedo')
            .on('click', () => {
                // add command.name, the purpose is to determine artificially modified when a change event is triggered
                this.editor.curOp = {
                    command: { name: 'redoClick' }
                };
                this.editor.redo();
                this.editor.curOp = null;
            });

        // copy click
        $('#btnCopy')
            .on('click', () => {
                this.editor.focus();
                document.execCommand('copy');
            });

        // cut click
        $('#btnCut')
            .on('click', () => {
                this.editor.focus();
                document.execCommand('cut');
            });

        // paste click
        $('#btnPaste')
            .on('click', () => {
                this.editor.focus();
                document.execCommand('paste');
            });

        // search click
        $('#btnSearch')
            .on('click', () => {
                ace.require(['ace/ext/searchbox'], obj => {
                    new obj.Search(this.editor);
                });
            });

        // replace click
        $('#btnReplace')
            .on('click', () => {
                ace.require(['ace/ext/searchbox'], obj => {
                    new obj.Search(this.editor, true);
                });
            });

        $('.top')
            .on('click', () => {
                this.editor.session.setScrollTop(0);
            });
    }

    /**
     * timer, listen for cache, write to file if cache is not null
     */
    contentChange() {
        setInterval(() => {
            if (this.buffer !== null) {
                const id = this.buffer.id;
                const content = this.buffer.content;

                // reset cache to null
                this.buffer = null;

                // write changes to file during the interval
                this.writeHostsContent(id, content, err => { });
            }
        }, this.bufferTimeInterval);
    }

    /**
     * read hosts file
     * @param id file id
     * @param [url] remote url
     * @param callback callback function
     */
    readHostsContent(id, url, callback) {
        if (typeof url === 'function') {
            callback = url;
            url = undefined;
        }
        let data = '';

        // local file
        if (!url) {
            let filePath;
            if (id === this.systemHostsId) {
                filePath = this.sysHostsFile;
            } else {
                filePath = path.resolve(this.hostsDockDir, id);
            }
            const rs = fs.createReadStream(filePath, 'utf8');
            rs.on('data', chunk => {
                data += chunk.toString();
            });

            rs.on('end', () => {
                callback(null, data);
            });

            rs.on('error', err => {
                callback(err);
            });
        } else {
            // local file
            if (url.startsWith('\\\\')) {
                const rs = fs.createReadStream(url, 'utf8');
                rs.on('data', chunk => {
                    data += chunk.toString();
                });

                rs.on('end', () => {
                    callback(null, data);
                });

                rs.on('error', err => {
                    callback(err);
                });
            } else {
                // remote file
                request(url, (err, response, body) => {
                    if (err) {
                        callback(err);
                    } else {
                        callback(null, body);
                    }
                });
            }
        }
    }

    /**
     * write hosts file
     * @param id file id
     * @param content file data
     * @param callback callback function
     */
    writeHostsContent(id, content, callback) {
        let filePath;
        if (id === this.systemHostsId) {
            filePath = this.sysHostsFile;
        } else {
            filePath = path.resolve(this.hostsDockDir, id);
        }
        const ws = fs.createWriteStream(filePath, 'utf8');
        ws.write(content, () => {
            callback(null);
        });
        ws.on('error', err => {
            callback(err);
        });
    }

    /**
     * copy hosts content
     * @param fromId source file id
     * @param toId dest file id
     * @param callback callback function
     */
    copyHostsContent(fromId, toId, callback) {
        let pathFrom, pathTo;
        if (fromId === this.systemHostsId) {
            pathFrom = this.sysHostsFile;
        } else {
            pathFrom = path.resolve(this.hostsDockDir, fromId);
        }
        if (toId === this.systemHostsId) {
            pathTo = this.sysHostsFile;
        } else {
            pathTo = path.resolve(this.hostsDockDir, toId);
        }
        const rs = fs.createReadStream(pathFrom, 'utf8');
        const ws = fs.createWriteStream(pathTo, 'utf8');
        rs.pipe(ws);
        rs.on('end', () => {
            callback(null);
        });
        rs.on('error', err => {
            callback(err);
        });
        ws.on('error', err => {
            callback(err);
        });
    }

    /**
     * generate unique id
     * @returns unique id
     */
    static getUid() {
        shortid.characters('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$@');
        return shortid.generate();
    }

    /**
     * flush DNS
     */
    flushDns() {
        if (this.platForm === 'win32') {
            cp.exec('ipconfig /flushdns', err => { });
        } else if (this.platForm === 'linux') {
            cp.exec('rcnscd restart', err => { });
        } else if (this.platForm === 'darwin') {
            cp.exec('killall -HUP mDNSResponder', err => { });
        }
    }

    /**
     * reset show/hidden for buttons
     */
    resetBtnState(id, url) {
        if (id === this.systemHostsId) {
            $('#btnEdit')
                .hide();
            $('#btnCheck')
                .hide();
            $('#btnDelete')
                .hide();
            $('#btnApply')
                .hide();
            $('#btnSys')
                .show();
            $('#editor-tool-dynamic')
                .hide();
        } else {
            $('#btnEdit')
                .show();
            $('#btnCheck')
                .show();
            $('#btnDelete')
                .show();
            $('#btnApply')
                .show();
            $('#btnSys')
                .hide();

            if (url) {
                $('#editor-tool-dynamic')
                    .hide();
            } else {
                $('#editor-tool-dynamic')
                    .show();
            }
        }
    }

    /**
     * new scheme
     */
    showModalNew() {
        let errShowing = false,
            that = this;
        swal.withForm({
            title: i18n.__('renderer.new_scheme'),
            text: i18n.__('renderer.new_scheme_desc'),
            showCancelButton: true,
            confirmButtonColor: '#DD6B55',
            confirmButtonText: i18n.__('renderer.new_scheme_submit'),
            cancelButtonText: i18n.__('renderer.cancel'),
            closeOnConfirm: false,
            formFields: [
                { id: 'txtName', placeholder: i18n.__('renderer.scheme_name') },
                { id: 'txtUrl', placeholder: i18n.__('renderer.scheme_address') }
            ]
        }, function (isConfirm) {
            const $errEl = $('.sa-error-container');
            const name = this.swalForm.txtName.trim();
            const url = this.swalForm.txtUrl.trim();
            if (isConfirm) {
                if (!name) {
                    if (!errShowing) {
                        errShowing = true;
                        $errEl.find('p')
                            .text(i18n.__('renderer.scheme_name_empty'));
                        $errEl.addClass('show');
                        setTimeout(() => {
                            $errEl.removeClass('show');
                            errShowing = false;
                        }, 2000);
                    }
                    return false;
                }
                if (url && !that.urlPattern.test(url)) {
                    if (!errShowing) {
                        errShowing = true;
                        $errEl.find('p')
                            .text(i18n.__('renderer.scheme_address_err'));
                        $errEl.addClass('show');
                        setTimeout(() => {
                            $errEl.removeClass('show');
                            errShowing = false;
                        }, 2000);
                    }
                    return false;
                }
                fs.readFile(that.configFile, 'utf8', (err, data) => {
                    if (err) {
                        $('.swal-form')
                            .remove();
                        swal({
                            title: i18n.__('renderer.submit_failed'),
                            text: err.message,
                            type: 'error'
                        });
                    } else {
                        let isExists = false;
                        const config = JSON.parse(data);
                        if (!url) {
                            config.localHosts.some(item => {
                                if (item.name === name) {
                                    isExists = true;
                                }
                            });
                        } else {
                            config.remoteHosts.some(item => {
                                if (item.name === name) {
                                    isExists = true;
                                }
                            });
                        }
                        if (isExists) {
                            if (!errShowing) {
                                errShowing = true;
                                $errEl.find('p')
                                    .text(i18n.__('renderer.scheme_name_exists'));
                                $errEl.addClass('show');
                                setTimeout(() => {
                                    $errEl.removeClass('show');
                                    errShowing = false;
                                }, 2000);
                            }
                            return false;
                        }
                        const id = HostsDock.getUid();
                        if (!url) {
                            const now = moment(Date.now())
                                .format('YYYY/MM/DD HH:mm:ss');
                            that.writeHostsContent(id, `# HostsDock - Created at ${now}\r\n`, err => {
                                if (err) {
                                    swal({
                                        title: i18n.__('renderer.submit_failed'),
                                        text: err.message,
                                        type: 'error'
                                    });
                                    $('.swal-form')
                                        .remove();
                                } else {
                                    config.localHosts.push({
                                        id,
                                        name,
                                        file: id
                                    });
                                    fs.writeFile(that.configFile, JSON.stringify(config, null, 4), 'utf8', err => {
                                        if (err) {
                                            swal({
                                                title: i18n.__('renderer.submit_failed'),
                                                text: err.message,
                                                type: 'error'
                                            });
                                            $('.swal-form')
                                                .remove();
                                        } else {
                                            const $li = $(`<li><a class='lk-hosts' data-hosts-id='${id}'><i class='applied fa fa-check' title='${i18n.__('renderer.applied')}'></i><i class='fa fa-file-text-o'></i> <span>${name}</span><i class='loading fa fa-spinner fa-spin' title='${i18n.__('renderer.loading')}'></i></a></li>`);
                                            $('.nav-local')
                                                .append($li);
                                            $li.children('.lk-hosts')
                                                .click();
                                            swal({
                                                title: i18n.__('renderer.submit_successfully'),
                                                text: i18n.__('renderer.create_local_successfully', name),
                                                type: 'success',
                                                showConfirmButton: false,
                                                timer: 1500
                                            });
                                            $('.swal-form')
                                                .remove();

                                            // update tray
                                            ipc.send('tray', config);
                                        }
                                    });
                                }
                            });
                        } else {
                            config.remoteHosts.push({
                                id,
                                name,
                                url
                            });
                            fs.writeFile(that.configFile, JSON.stringify(config, null, 4), 'utf8', err => {
                                if (err) {
                                    swal({
                                        title: i18n.__('renderer.submit_failed'),
                                        text: err.message,
                                        type: 'error'
                                    });
                                    $('.swal-form')
                                        .remove();
                                } else {
                                    const $li = $(`<li><a class='lk-hosts' data-hosts-id='${id}' data-hosts-url='${url}'><i class='applied fa fa-check' title='${i18n.__('renderer.applied')}'></i><i class='fa fa-globe'></i> <span>${name}</span><i class='loading fa fa-spinner fa-spin' title='${i18n.__('renderer.loading')}'></i></a></li>`);
                                    $('.nav-remote')
                                        .append($li);
                                    $li.children('.lk-hosts')
                                        .click();
                                    swal({
                                        title: i18n.__('renderer.submit_successfully'),
                                        text: i18n.__('renderer.create_remote_successfully', name),
                                        type: 'success',
                                        showConfirmButton: false,
                                        timer: 1500
                                    });
                                    $('.swal-form')
                                        .remove();

                                    // update tray
                                    ipc.send('tray', config);
                                }
                            });
                        }
                    }
                });
            } else {
                $('.swal-form')
                    .remove();
            }
        });
    }

    /**
     * edit scheme
     * @param id scheme id
     * @param oldName current name
     * @param oldUrl current url
     */
    showModalEdit(id, oldName, oldUrl) {
        let errShowing = false,
            that = this;
        const forms = [{ id: 'txtName', placeholder: i18n.__('renderer.scheme_name'), value: oldName }];
        if (oldUrl) {
            forms.push({ id: 'txtUrl', placeholder: i18n.__('renderer.scheme_address'), value: oldUrl });
        }
        swal.withForm({
            title: i18n.__('renderer.edit_scheme'),
            text: oldUrl ? i18n.__('renderer.edit_scheme_remote_desc') : i18n.__('renderer.edit_scheme_local_desc'),
            showCancelButton: true,
            confirmButtonColor: '#DD6B55',
            confirmButtonText: i18n.__('renderer.edit_scheme_save'),
            cancelButtonText: i18n.__('renderer.cancel'),
            closeOnConfirm: false,
            formFields: forms
        }, function (isConfirm) {
            const $errEl = $('.sa-error-container');
            const name = this.swalForm.txtName.trim();
            let url;
            if (oldUrl) {
                url = this.swalForm.txtUrl.trim();
            }
            if (isConfirm) {
                if (!name) {
                    if (!errShowing) {
                        errShowing = true;
                        $errEl.find('p')
                            .text(i18n.__('renderer.scheme_name_empty'));
                        $errEl.addClass('show');
                        setTimeout(() => {
                            $errEl.removeClass('show');
                            errShowing = false;
                        }, 2000);
                    }
                    return false;
                }
                if (oldUrl && !url) {
                    if (!errShowing) {
                        errShowing = true;
                        $errEl.find('p')
                            .text(i18n.__('renderer.scheme_address_empty'));
                        $errEl.addClass('show');
                        setTimeout(() => {
                            $errEl.removeClass('show');
                            errShowing = false;
                        }, 2000);
                    }
                    return false;
                }
                if (url && !that.urlPattern.test(url)) {
                    if (!errShowing) {
                        errShowing = true;
                        $errEl.find('p')
                            .text(i18n.__('renderer.scheme_address_err'));
                        $errEl.addClass('show');
                        setTimeout(() => {
                            $errEl.removeClass('show');
                            errShowing = false;
                        }, 2000);
                    }
                    return false;
                }
                if (name !== oldName) {
                    fs.readFile(that.configFile, 'utf8', (err, data) => {
                        if (err) {
                            $('.swal-form')
                                .remove();
                            swal({
                                title: i18n.__('renderer.submit_failed'),
                                text: err.message,
                                type: 'error'
                            });
                        } else {
                            let isExists = false;
                            const config = JSON.parse(data);
                            if (!oldUrl) {
                                config.localHosts.some(item => {
                                    if (item.name === name) {
                                        isExists = true;
                                    }
                                });
                            } else {
                                config.remoteHosts.some(item => {
                                    if (item.name === name) {
                                        isExists = true;
                                    }
                                });
                            }
                            if (isExists) {
                                if (!errShowing) {
                                    errShowing = true;
                                    $errEl.find('p')
                                        .text(i18n.__('renderer.scheme_name_exists'));
                                    $errEl.addClass('show');
                                    setTimeout(() => {
                                        $errEl.removeClass('show');
                                        errShowing = false;
                                    }, 2000);
                                }
                                return false;
                            }
                            let hostsJson,
                                hostsArray;
                            if (oldUrl) {
                                hostsArray = config.remoteHosts;
                            } else {
                                hostsArray = config.localHosts;
                            }
                            hostsArray.forEach(item => {
                                if (item.id === id) {
                                    hostsJson = item;
                                    return false;
                                }
                            });
                            if (hostsJson) {
                                hostsJson.name = name;
                                if (oldUrl) {
                                    hostsJson.url = url;
                                }
                                fs.writeFile(that.configFile, JSON.stringify(config, null, 4), 'utf8', err => {
                                    if (err) {
                                        swal({
                                            title: i18n.__('renderer.submit_failed'),
                                            text: err.message,
                                            type: 'error'
                                        });
                                        $('.swal-form')
                                            .remove();
                                    } else {
                                        const $btn = $(`.nav-items a[data-hosts-id='${id}']`);
                                        $btn.find('span')
                                            .text(name);
                                        if (oldUrl) {
                                            $btn.attr('data-hosts-url', url);
                                        }
                                        swal({
                                            title: i18n.__('renderer.save_successfully'),
                                            text: i18n.__('renderer.save_successfully_desc'),
                                            type: 'success',
                                            showConfirmButton: false,
                                            timer: 1500
                                        });
                                        $('.swal-form')
                                            .remove();

                                        // update tray
                                        ipc.send('tray', config);
                                    }
                                });
                            } else {
                                swal({
                                    title: i18n.__('renderer.submit_failed'),
                                    type: 'error'
                                });
                                $('.swal-form')
                                    .remove();
                            }
                        }
                    });
                } else {
                    // actually not modified
                    if ((oldUrl && url === oldUrl) || !oldUrl) {
                        swal({
                            title: i18n.__('renderer.save_successfully'),
                            text: i18n.__('renderer.save_successfully_desc'),
                            type: 'success',
                            showConfirmButton: false,
                            timer: 1500
                        });
                        $('.swal-form')
                            .remove();
                    } else {
                        fs.readFile(that.configFile, 'utf8', (err, data) => {
                            if (err) {
                                $('.swal-form')
                                    .remove();
                                swal({
                                    title: i18n.__('renderer.submit_failed'),
                                    text: err.message,
                                    type: 'error'
                                });
                            } else {
                                const config = JSON.parse(data);
                                let hostsJson;
                                config.remoteHosts.forEach(item => {
                                    if (item.id === id) {
                                        hostsJson = item;
                                        return false;
                                    }
                                });
                                if (hostsJson) {
                                    hostsJson.url = url;
                                    fs.writeFile(that.configFile, JSON.stringify(config, null, 4), 'utf8', err => {
                                        if (err) {
                                            swal({
                                                title: i18n.__('renderer.submit_failed'),
                                                text: err.message,
                                                type: 'error'
                                            });
                                            $('.swal-form')
                                                .remove();
                                        } else {
                                            const $btn = $(`.nav-items a[data-hosts-id='${id}']`);
                                            $btn.attr('data-hosts-url', url)
                                                .find('span')
                                                .text(name);
                                            swal({
                                                title: i18n.__('renderer.save_successfully'),
                                                text: i18n.__('renderer.save_successfully_desc'),
                                                type: 'success',
                                                showConfirmButton: false,
                                                timer: 1500
                                            });
                                            $('.swal-form')
                                                .remove();

                                            // update tray
                                            ipc.send('tray', config);
                                        }
                                    });
                                } else {
                                    swal({
                                        title: i18n.__('renderer.submit_failed'),
                                        type: 'error'
                                    });
                                    $('.swal-form')
                                        .remove();
                                }
                            }
                        });
                    }
                }
            } else {
                $('.swal-form')
                    .remove();
            }
        });
    }

    /**
     * content change handler
     */
    changeHandler() {
        // if has command.name, indicate that the content changes are caused by the user action, instead of program
        if (this.editor.curOp && this.editor.curOp.command.name) {
            const id = $('.nav-items li.active .lk-hosts')
                .attr('data-hosts-id');
            const content = this.editor.getValue();

            // 先将当前内容放入缓存，到时批量写入
            this.buffer = { id, content };
        }

        // undo/redo will handle after changed, so must add to async queue
        setImmediate(() => {
            const um = this.editor.session.getUndoManager();
            if (um.hasUndo()) {
                $('#btnUndo')
                    .removeAttr('disabled');
            } else {
                $('#btnUndo')
                    .attr('disabled', 'disabled');
            }
            if (um.hasRedo()) {
                $('#btnRedo')
                    .removeAttr('disabled');
            } else {
                $('#btnRedo')
                    .attr('disabled', 'disabled');
            }
        });
    }

    /**
     * nav click handler
     * @param e event object
     */
    navClickHandler(e) {
        let $this = $(e.currentTarget),
            $parent = $this.parent(),
            id = $this.attr('data-hosts-id'),
            url = $this.attr('data-hosts-url');
        if (!$parent.hasClass('active')) {
            $('.nav-items li.active')
                .removeClass('active');
            $parent.addClass('active');
            $('.loading')
                .hide();
            $this.children('.loading')
                .show();
            const timeStart = Date.now();
            this.editor.setReadOnly(true);
            this.editor.session.setValue('', -1);
            this.editor.session.setScrollTop(0);
            $('#hosts-content').addClass('no-comment');
            $('#btnUndo')
                .attr('disabled', 'disabled');
            $('#btnRedo')
                .attr('disabled', 'disabled');
            $('#btnRefresh i')
                .removeClass('fa-spin');
            $('#btnRefresh')
                .attr('disabled', 'disabled');
            this.resetBtnState(id, url);
            if (!url) {
                this.readHostsContent(id, (err, data) => {
                    // TODO:no longer perform callback when navigation changed
                    if ($('.nav-items li.active .lk-hosts')
                        .attr('data-hosts-id') === id) {
                        if (err) {
                            swal({
                                title: i18n.__('renderer.load_hosts_failed'),
                                text: err.message,
                                type: 'error'
                            });
                        } else {
                            this.editor.session.setValue(data, -1);
                            if (id !== this.systemHostsId) {
                                this.editor.setReadOnly(false);
                                $('#hosts-content').removeClass('no-comment');
                            }
                        }
                        $('#btnRefresh')
                            .removeAttr('disabled');

                        // clear undo/redo list
                        this.editor.session.getUndoManager()
                            .reset();
                        const timeEnd = Date.now();
                        if (timeEnd - timeStart > this.loadingMin) {
                            $this.children('.loading')
                                .hide();
                        } else {
                            const timeSpan = this.loadingMin - (timeEnd - timeStart);
                            setTimeout(() => {
                                $this.children('.loading')
                                    .hide();
                            }, timeSpan);
                        }
                    }
                });
            } else {
                this.editor.setReadOnly(true);
                this.readHostsContent(id, url, (err, data) => {
                    // TODO:no longer perform callback when navigation changed
                    if ($('.nav-items li.active .lk-hosts')
                        .attr('data-hosts-id') === id) {
                        if (err) {
                            swal({
                                title: i18n.__('renderer.get_remote_failed'),
                                text: err.message,
                                type: 'error'
                            });
                        } else {
                            this.editor.session.setValue(data, -1);
                        }
                        $('#btnRefresh')
                            .removeAttr('disabled');

                        // clear undo/redo list
                        this.editor.session.getUndoManager()
                            .reset();
                        const timeEnd = Date.now();
                        if (timeEnd - timeStart > this.loadingMin) {
                            $this.children('.loading')
                                .hide();
                        } else {
                            const timeSpan = this.loadingMin - (timeEnd - timeStart);
                            setTimeout(() => {
                                $this.children('.loading')
                                    .hide();
                            }, timeSpan);
                        }
                    }
                });
            }
        }
    }

    /**
     * apply hosts
     * @param id scheme id
     * @param name scheme name
     * @param url remote address
     * @param callback callback function
     */
    applyHosts(id, name, url, callback) {
        // just non-system hosts
        if (id !== this.systemHostsId) {
            if (url) {
                this.readHostsContent(id, url, (err, data) => {
                    if (err) {
                        callback(err);
                    } else {
                        const ws = fs.createWriteStream(this.sysHostsFile);
                        ws.write(data, 'utf8', () => {
                            callback(null, i18n.__('renderer.applied_remote_successfully', name));

                            // write applied scheme id to config
                            fs.readFile(this.configFile, 'utf8', (err, data) => {
                                if (!err) {
                                    const config = JSON.parse(data);
                                    config.appliedId = id;
                                    fs.writeFile(this.configFile, JSON.stringify(config, null, 4), 'utf8', err => { });

                                    // update tray
                                    ipc.send('tray', config);
                                }
                            });
                            this.flushDns();
                        });
                        ws.on('error', err => {
                            if (err.message.indexOf('operation not permitted') >= 0) {
                                err = new Error(i18n.__('renderer.run_with_admin'));
                            }
                            callback(err);
                        });
                    }
                });
            } else {
                this.copyHostsContent(id, this.systemHostsId, err => {
                    if (err) {
                        if (err.message.indexOf('operation not permitted') >= 0) {
                            err = new Error(i18n.__('renderer.run_with_admin'));
                        }
                        callback(err);
                    } else {
                        callback(null, i18n.__('renderer.applied_local_successfully', name));

                        // write applied scheme id to config
                        fs.readFile(this.configFile, 'utf8', (err, data) => {
                            if (!err) {
                                const config = JSON.parse(data);
                                config.appliedId = id;
                                fs.writeFile(this.configFile, JSON.stringify(config, null, 4), 'utf8', err => { });

                                // update tray
                                ipc.send('tray', config);
                            }
                        });
                        this.flushDns();
                    }
                });
            }
        }
    }

    /**
     * apply click handler
     * @param e
     */
    applyClickHandler(e) {
        const $this = $(e.currentTarget);
        const $icon = $this.children('i');
        $this.attr('disabled', 'disabled');
        $icon.removeClass('fa-check')
            .addClass('fa-circle-o-notch fa-spin');
        const $currentActiveBtn = $('.nav-items li.active .lk-hosts');
        if ($currentActiveBtn.length > 0) {
            const id = $currentActiveBtn.attr('data-hosts-id');
            const url = $currentActiveBtn.attr('data-hosts-url');
            const name = $currentActiveBtn.find('span')
                .text();
            this.applyHosts(id, name, url, (err, msg) => {
                if (err) {
                    swal({
                        title: i18n.__('renderer.operation_failed'),
                        text: err.message,
                        type: 'error'
                    });
                } else {
                    this.popNotification(msg);
                    $('.applied')
                        .hide();
                    $currentActiveBtn.children('.applied')
                        .show();
                }
                $icon.removeClass('fa-circle-o-notch fa-spin')
                    .addClass('fa-check');
                $this.removeAttr('disabled');
            });
        }
    }

    updateProgress(el, persent) {
        if (persent > 100) {
            persent = 100;
        }
        const txt = $(el).find('.cg-mask span').text();

        // do not change dom if persent not modified
        if (String(persent) === txt) {
            return;
        }
        const deg = persent * 360 / 100;
        const left = $(el).find('.circle-left');
        const right = $(el).find('.circle-right');
        if (deg > 180) {
            // both left & right half circle need transform
            left.css('transition-duration', '.3s');
            right.css('transition-duration', '0s');
            right.css('transform', 'rotate(180deg)');
            left.css('transform', `rotate(${deg - 180}deg)`);
        } else {
            // only right half circle need transform
            left.css('transition-duration', '.3s');
            right.css('transition-duration', '.3s');
            left.css('transform', 'rotate(0deg)');
            right.css('transform', `rotate(${deg}deg)`);
        }
        $(el).find('.cg-mask span').text(persent);
    }

    generateReport(results) {
        results.sort((prev, curr) => {
            return prev.batchStart - curr.batchStart;
        });
        let html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
        body { margin-left: 20px; }
        ul { -webkit-padding-start: 0; list-style: none; }
        li { font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace; font-size: 14px; }
        .num { display: inline-block; width: 36px; }
        .icon { display: inline-block; width: 20px; }
        .alive { color: green; }
        .dead { color: red; }
        </style></head><body><h1></h1><ul>`;
        results.forEach(item => {
            let icon = '<span class="icon"></span>';
            if (item.isAlive === true) {
                icon = '<span class="icon alive">✔</span>';
            } else if (item.isAlive === false) {
                icon = '<span class="icon dead">✘</span>';
            }
            html += `
            <li>${icon}<span class="num">${item.batchStart + 1}</span><span class="line">${item.line}</span></li>`;
        });
        html += '</ul></body></html>';
        fs.writeFile(this.reportFile, html, err => {
            if (err) {
                swal({
                    title: i18n.__('renderer.operation_failed'),
                    text: err.message,
                    type: 'error'
                });
                return;
            }
            let win = new BrowserWindow({
                icon: path.join(__dirname, `${process.platform === 'win32' ? '../image/hostsdock.ico' : '../image/hostsdock.png'}`),
                title: `HostsDock - ${i18n.__('renderer.test_report')}`
            });
            win.on('close', () => {
                win = null;
            });
            win.loadURL(this.reportFile);
            win.setMenu(null);
            win.show();
        });
    }

    /**
     * check click handler
     * 
     * @memberof HostsDock
     */
    checkClickHandler() {
        swal({
            title: i18n.__('renderer.test_hosts'),
            text: `<p class="test-desc">${i18n.__('renderer.test_desc')}</p><div class="cg"><div class="cg-wrap">
            <div class="circle-left-wrap"><div class="circle-left"></div></div>
            <div class="circle-right-wrap"><div class="circle-right"></div></div>
            <div class="cg-mask"><span>0</span>%</div>
                    </div></div>`,
            html: true,
            showCancelButton: true,
            confirmButtonText: i18n.__('renderer.start_test'),
            cancelButtonText: i18n.__('renderer.cancel'),
            closeOnConfirm: false
        }, () => {
            $('.sa-confirm-button-container .confirm').attr('disabled', 'disabled');
            const lineCount = this.editor.session.getLength();
            const reg = new RegExp('^(\\s*(?:(?:2(?:[0-4][0-9]|5[0-5])|[0-1]?[0-9]?[0-9])\\.){3}(?:(?:2(?:[0-4][0-9]|5[0-5])|[0-1]?[0-9]?[0-9])))((?:\\s+(?:[a-zA-Z0-9\\-\\*\\.]+[\\.]{1,}[a-zA-Z0-9\\-\\*]{1,}|localhost|broadcasthost)\\s*)+)$');
            let len = 0;
            const el = document.querySelector('.cg');
            let batchStart = 0;
            const batchSize = 3;
            const results = [];
            let batchProcess;

            const cb = (line, batchStart, batchDone, isAlive) => {
                len++;
                results.push({
                    line,
                    batchStart,
                    isAlive
                });
                this.updateProgress(el, Math.floor(len / lineCount * 100));
                if (len === lineCount) {
                    setTimeout(() => {
                        swal({
                            title: i18n.__('renderer.test_done'),
                            text: i18n.__('renderer.test_done_desc'),
                            type: 'success',
                            showConfirmButton: false,
                            timer: 1000
                        });
                        setTimeout(() => {
                            this.generateReport(results);
                        }, 1000);
                    }, 1000);
                } else if (batchDone) {
                    batchProcess();
                }
            };

            const ipHandler = (batchStart, line, cb, batchDone) => {
                return isAlive => {
                    cb(line, batchStart, batchDone, isAlive);
                };
            };

            batchProcess = () => {
                const max = batchStart + batchSize;
                for (; batchStart < max; batchStart++) {
                    if (batchStart >= lineCount) {
                        return;
                    }

                    const line = this.editor.session.getLine(batchStart).trim();
                    const batchDone = batchStart === (max - 1);

                    // exclude blank or comment line
                    if (!line || line.startsWith('#')) {
                        cb(line, batchStart, batchDone);
                    } else {
                        const matched = line.match(reg);
                        if (matched && matched.length === 3) {
                            const ip = matched[1];
                            ping.sys.probe(ip, ipHandler(batchStart, line, cb, batchDone));
                        } else {
                            cb(line, batchStart, batchDone);
                        }
                    }
                }
            };

            batchProcess();
        });
    }

    /**
     * open sys folder click handler
     * 
     * @memberof HostsDock
     */
    sysClickHandler() {
        shell.showItemInFolder(this.sysHostsFile);
    }

    /**
     * delete scheme handler
     */
    deleteClickHandler() {
        const $currentActiveBtn = $('.nav-items li.active .lk-hosts');
        if ($currentActiveBtn.length > 0) {
            const id = $currentActiveBtn.attr('data-hosts-id');
            const url = $currentActiveBtn.attr('data-hosts-url');
            const name = $currentActiveBtn.find('span')
                .text();
            const that = this;
            swal({
                title: i18n.__('renderer.del_scheme'),
                text: url ? i18n.__('renderer.del_scheme_remote_desc', name) : i18n.__('renderer.del_scheme_local_desc', name),
                type: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#DD6B55',
                confirmButtonText: i18n.__('renderer.del_confirm'),
                cancelButtonText: i18n.__('renderer.cancel'),
                closeOnConfirm: false
            }, () => {
                fs.readFile(that.configFile, 'utf8', (err, data) => {
                    if (err) {
                        swal({
                            title: i18n.__('renderer.operation_failed'),
                            text: err.message,
                            type: 'error'
                        });
                    } else {
                        const config = JSON.parse(data);
                        let hostsArray,
                            hostsJson;
                        if (url) {
                            hostsArray = config.remoteHosts;
                        } else {
                            hostsArray = config.localHosts;
                        }
                        hostsArray.forEach(item => {
                            if (item.id === id) {
                                hostsJson = item;
                                return false;
                            }
                        });
                        if (hostsJson) {
                            // remove this json
                            hostsArray.splice(hostsArray.indexOf(hostsJson), 1);
                            fs.writeFile(that.configFile, JSON.stringify(config, null, 4), 'utf8', err => {
                                if (err) {
                                    swal({
                                        title: i18n.__('renderer.operation_failed'),
                                        text: err.message,
                                        type: 'error'
                                    });
                                } else {
                                    $('.lk-hosts[data-hosts-id=system]')
                                        .click();
                                    $currentActiveBtn.parent()
                                        .remove();
                                    swal({
                                        title: i18n.__('renderer.del_successfully'),
                                        type: 'success',
                                        showConfirmButton: false,
                                        timer: 1500
                                    });

                                    // update tray
                                    ipc.send('tray', config);
                                }
                            });
                        } else {
                            swal({
                                title: i18n.__('renderer.operation_failed'),
                                text: err.message,
                                type: 'error'
                            });
                        }
                    }
                });
            });
        }
    }

    /**
     * refresh click handler
     * @param e
     */
    refreshClickHandler(e) {
        const $this = $(e.currentTarget);
        const $icon = $this.children('i');
        $this.attr('disabled', 'disabled');
        $icon.addClass('fa-spin');
        this.editor.setReadOnly(true);
        this.editor.session.setValue('', -1);
        $('#btnUndo')
            .attr('disabled', 'disabled');
        $('#btnRedo')
            .attr('disabled', 'disabled');
        const $currentActiveBtn = $('.nav-items li.active .lk-hosts');
        const id = $currentActiveBtn.attr('data-hosts-id');
        const url = $currentActiveBtn.attr('data-hosts-url');
        if (!url) {
            this.readHostsContent(id, (err, data) => {
                // TODO:no longer perform callback when navigation changed
                if ($('.nav-items li.active .lk-hosts')
                    .attr('data-hosts-id') === id) {
                    if (err) {
                        swal({
                            title: i18n.__('renderer.load_hosts_failed'),
                            text: err.message,
                            type: 'error'
                        });
                        this.editor.session.setValue('', -1);
                    } else {
                        swal({
                            title: i18n.__('renderer.refresh_successfully'),
                            type: 'success',
                            showConfirmButton: false,
                            timer: 1000
                        });
                        this.editor.setReadOnly(false);
                        this.editor.session.setValue(data, -1);
                    }
                    $icon.removeClass('fa-spin');
                    $this.removeAttr('disabled');
                }
            });
        } else {
            this.readHostsContent(id, url, (err, data) => {
                // TODO:no longer perform callback when navigation changed
                if ($('.nav-items li.active .lk-hosts')
                    .attr('data-hosts-id') === id) {
                    if (err) {
                        swal({
                            title: i18n.__('renderer.get_remote_failed'),
                            text: err.message,
                            type: 'error'
                        });
                        this.editor.session.setValue('', -1);
                    } else {
                        swal({
                            title: i18n.__('renderer.refresh_successfully'),
                            type: 'success',
                            showConfirmButton: false,
                            timer: 1000
                        });
                        this.editor.session.setValue(data, -1);
                    }
                    $icon.removeClass('fa-spin');
                    $this.removeAttr('disabled');
                }
            });
        }
    }

    /**
     * export handler
     */
    exportClickHandler(e) {
        const $currentActiveBtn = $('.nav-items li.active .lk-hosts');
        const id = $currentActiveBtn.attr('data-hosts-id');
        const url = $currentActiveBtn.attr('data-hosts-url');
        ipc.send('save-dialog', {
            id,
            url
        });
    }

    /**
     * editor mouse move handler
     * @param e event object
     */
    mouseMoveHandler(e) {
        const rowNum = e.editor.renderer.screenToTextCoordinates(e.clientX, e.clientY)
            .row;
        const currentBtnPos = $('.button-comment')
            .attr('data-line');
        if (rowNum !== currentBtnPos) {
            $('.button-comment')
                .remove();
            const $gutter = $(`.ace_gutter-cell:contains(${rowNum + 1})`)
                .map(function () {
                    if ($(this)
                        .text() == rowNum + 1) {
                        return this;
                    }
                });
            if ($gutter.length > 0) {
                $gutter.prepend(`<button class='button-comment' data-line='${rowNum}' title='${i18n.__('renderer.comment')}(Ctrl+/)'>#</button>`);
            }
        }
    }

    /**
     * editor comment button click handler
     * @param e event object
     */
    gutterMousedownHandler(e) {
        const $target = $(e.domEvent.target);
        if ($target.hasClass('button-comment')) {
            e.preventDefault();
            const lineNum = $target.attr('data-line');
            const line = this.editor.session.getLine(lineNum);
            let existsComments = false;
            const re = /^(\s*)#(.*)/;

            // add command.name, the purpose is to determine artificially modified when a change event is triggered
            this.editor.curOp = {
                command: { name: 'commentClick' }
            };

            if (re.test(this.editor.session.getLine(lineNum))) {
                existsComments = true;
            }

            if (existsComments) {
                const m = line.match(re);
                let newLine;
                if (m) {
                    m.shift();
                    newLine = m.join('');
                    ace.require(['ace/range'], obj => {
                        this.editor.session.replace(new obj.Range(lineNum, 0, lineNum, line.length), newLine);
                    });
                }
            } else {
                this.editor.session.indentRows(lineNum, lineNum, '#');
            }

            // must reset to null
            this.editor.curOp = null;
        }
    }

    scollHandler(top) {
        if (top > 500) {
            $('.top').show();
        } else {
            $('.top').hide();
        }
    }

    /**
     * system pop tips
     * @param msg
     */
    popNotification(msg) {
        notifier.notify({
            title: 'HostsDock',
            message: msg,
            icon: path.join(__dirname, '../image/hostsdock.png'),
            sound: true
        });
    }
}

new HostsDock().init();

