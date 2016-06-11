const fs = require('fs');
const cp = require('child_process');
const remote = require('electron').remote;
const app = remote.app;
const notifier = require('node-notifier');
const path = require('path');
const moment = require('moment');
const shortid = require('shortid');
const request = require('request');
const async = require('async');
const i18n = require('i18n');
const localeArray = ['en-US', 'zh-CN', 'zh-TW'];
i18n.configure({
    locales: localeArray,
    directory: path.join(__dirname, '../../locales'),
    objectNotation: true
});
var locale;
try {
    var data = fs.readFileSync(path.resolve(app.getPath('userData'), 'config.json'), 'utf8');
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
        this.platForm = process.platform;
        this.sysHostsFile = this.platForm === 'win32' ? 'c:\\windows\\system32\\drivers\\etc\\hosts' : '/etc/hosts'; // system hosts path
        this.originalHostsId = 'orignial';
        this.originalHostsName = i18n.__('renderer.original_hosts');
        this.backupHostsId = 'backup';
        this.backupHostsName = i18n.__('renderer.backup_hosts');
        this.systemHostsId = 'system';
        this.loadingMin = 500;
        this.urlPattern = /((\w+:\/\/|\\\\)[-a-zA-Z0-9:@;?&=\/%\+\.\*!'\(\),\$_\{\}\^~\[\]`#|]+)/;
        this.editor = ace.edit("hosts-content");
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
        async.map([this.hostsDockDir, this.configFile], fs.stat, (err, results)=> {
            // first run app
            if (err || !results[0].isDirectory() || !results[1].isFile()) {
                // create LocalHosts folder
                fs.mkdir(this.hostsDockDir, (err)=> {
                    if (err && err.code !== 'EEXIST') {
                        swal({
                            title: i18n.__('renderer.create_local_dir_err'),
                            text: err.message,
                            type: 'error'
                        });
                    } else {
                        // create an original file
                        var now = moment(Date.now()).format('YYYY/MM/DD HH:mm:ss');
                        this.writeHostsContent(this.originalHostsId, `# HostsDock - Created at ${now}
#region Localhost
127.0.0.1 localhost
255.255.255.255 broadcasthost
#endregion`, (err)=> {
                            if (err) {
                                swal({
                                    title: i18n.__('renderer.create_file_err', this.originalHostsName),
                                    text: err.message,
                                    type: 'error'
                                });
                            }
                        });
                        // create a system backup file, copy content from system hosts
                        this.copyHostsContent(this.systemHostsId, this.backupHostsId, (err)=> {
                            if (err) {
                                swal({
                                    title: i18n.__('renderer.create_file_err', this.backupHostsName),
                                    text: err.message,
                                    type: 'error'
                                });
                            }
                        });
                    }
                });
                let config = {
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
                fs.writeFile(this.configFile, JSON.stringify(config, null, 4), (err) => {
                    if (err) {
                        swal({
                            title: i18n.__('renderer.create_config_err'),
                            text: err.message,
                            type: 'error'
                        });
                    }
                });
                // In order to improve the execution efficiency, the method does not rely on the necessary files when passed true
                this.loadHostsList(true);
            } else {
                this.loadHostsList();
            }
        });

        // detect system hosts r/w permissions
        fs.access(this.sysHostsFile, fs.R_OK | fs.W_OK, (err)=> {
            if (err) {
                swal({
                    title: i18n.__('renderer.no_permission'),
                    text: i18n.__('renderer.run_with_admin'),
                    type: 'error'
                });
            }
        })
    }

    /**
     * load hosts list
     */
    loadHostsList(isFirst = false) {
        if (isFirst) {
            $('.nav-local').append(`<li><a class='lk-hosts' data-hosts-id='${this.originalHostsId}'><i class='applied fa fa-check' title='${i18n.__('renderer.applied')}'></i><i class='fa fa-file-text-o'></i> <span>${this.originalHostsName}</span><i class='loading fa fa-spinner fa-spin' title='${i18n.__('renderer.loading')}'></i></a></li>` +
                `<li><a class='lk-hosts' data-hosts-id='${this.backupHostsId}'><i class='applied fa fa-check' title='${i18n.__('renderer.applied')}'></i><i class='fa fa-file-text-o'></i> <span>${this.backupHostsName}</span><i class='loading fa fa-spinner fa-spin' title='${i18n.__('renderer.loading')}'></i></a></li>`);
            $(`.lk-hosts[data-hosts-id=${this.systemHostsId}]`).click();
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
                    let appliedId = data.appliedId;
                    let localHosts = data.localHosts;
                    let remoteHosts = data.remoteHosts;
                    let localHtml = '';
                    let allIdArr = [];
                    localHosts.forEach((item)=> {
                        allIdArr.push(item.id);
                        localHtml += `<li><a class='lk-hosts' data-hosts-id='${item.id}'><i class='applied fa fa-check' style='${appliedId === item.id ? "display:inline-block" : ""}' title='${i18n.__('renderer.applied')}'></i><i class='fa fa-file-text-o'></i> <span>${item.name}</span><i class='loading fa fa-spinner fa-spin' title='${i18n.__('renderer.loading')}'></i></a></li>`;
                    });
                    $('.nav-local').append(localHtml);
                    let remoteHtml = '';
                    remoteHosts.forEach((item)=> {
                        allIdArr.push(item.id);
                        remoteHtml += `<li><a class='lk-hosts' data-hosts-id='${item.id}' data-hosts-url='${item.url}'><i class='applied fa fa-check' style='${appliedId === item.id ? "display:inline-block" : ""}' title='${i18n.__('renderer.applied')}'></i><i class='fa fa-globe'></i> <span>${item.name}</span><i class='loading fa fa-spinner fa-spin' title='${i18n.__('renderer.loading')}'></i></a></li>`;
                    });
                    $('.nav-remote').append(remoteHtml);
                    // already applied some scheme when last exit
                    if (appliedId && allIdArr.indexOf(appliedId) >= 0) {
                        $(`.lk-hosts[data-hosts-id=${appliedId}]`).click();
                    } else {
                        $(`.lk-hosts[data-hosts-id=${this.systemHostsId}]`).click();
                    }
                }
            });
        }

    }

    /**
     * init UI text
     */
    initUiText(){
        $('.title-sys span').text(i18n.__('renderer.system'));
        $('.title-sys p').text(i18n.__('renderer.system_desc'));
        $('[data-hosts-id=system] span').text(i18n.__('renderer.system_hosts'));
        $('[data-hosts-id=system] i:eq(1)').attr('title',i18n.__('renderer.loading'));
        $('.time-li').attr('title', i18n.__('renderer.update_time'));
        $('#update-at').text(i18n.__('renderer.update_at'));
        $('.title-local span').text(i18n.__('renderer.local'));
        $('.title-local p').text(i18n.__('renderer.local_desc'));
        $('.title-remote span').text(i18n.__('renderer.remote'));
        $('.title-remote p').text(i18n.__('renderer.remote_desc'));

        $('#btnNew').attr('title', i18n.__('renderer.btnNew'));
        $('#btnRefresh').attr('title', i18n.__('renderer.btnRefresh'));
        $('#btnEdit').attr('title', i18n.__('renderer.btnEdit'));
        $('#btnDelete').attr('title', i18n.__('renderer.btnDelete'));
        $('#btnApply').attr('title', i18n.__('renderer.btnApply'));

        $('#btnUndo').attr('title', i18n.__('renderer.btnUndo') + '(Ctrl+Z)');
        $('#btnRedo').attr('title', i18n.__('renderer.btnRedo') + '(Ctrl+Shift+Z)');
        $('#btnCopy').attr('title', i18n.__('renderer.btnCopy') + '(Ctrl+C)');
        $('#btnCut').attr('title', i18n.__('renderer.btnCut') + '(Ctrl+X)');
        $('#btnPaste').attr('title', i18n.__('renderer.btnPaste') + '(Ctrl+V)');
        $('#btnSearch').attr('title', i18n.__('renderer.btnSearch') + '(Ctrl+F)');
        $('#btnReplace').attr('title', i18n.__('renderer.btnReplace') + '(Ctrl+H)');
    }

    /**
     * init Editor
     */
    loadEditor() {
        this.editor.setTheme("ace/theme/hosts");
        this.editor.session.setMode("ace/mode/hosts");
        this.editor.$blockScrolling = Infinity;
        this.editor.session.on('change', () => this.changeHandler());
        this.editor.on('mousemove', (e) => this.mouseMoveHandler(e));
        this.editor.on('guttermousemove', (e) => this.mouseMoveHandler(e));
        this.editor.on('guttermousedown', (e) => this.gutterMousedownHandler(e));
    }

    /**
     * listen for system hosts
     */
    watchSysHosts() {
        fs.stat(this.sysHostsFile, (err, stats)=> {
            if (!err) {
                var lastModified = moment(stats.mtime).format('YYYY/MM/DD HH:mm:ss');
                $('#modified-time').text(lastModified);
            }
        });
        fs.watchFile(this.sysHostsFile, (curr) => {
            var lastModified = moment(curr.mtime).format('YYYY/MM/DD HH:mm:ss');
            $('#modified-time').text(lastModified);
        });
    }

    /**
     * bind elements event
     */
    bindEvents() {
        // nav toggle
        $('.toggle-title').on('click', (e) => {
            var $this = $(e.currentTarget);
            $this.parent().toggleClass('is-open');
        });

        // nav click
        $('.nav-items').on('click', '.lk-hosts', (e) => this.navClickHandler(e));

        // nav double click
        $('.nav-items').on('dblclick', '.lk-hosts', (e) => {
            var $this = $(e.currentTarget),
                id = $this.attr('data-hosts-id'),
                name = $this.find('span').text(),
                url = $this.attr('data-hosts-url');
            this.applyHosts(id, name, url, (err, msg) => {
                if (err) {
                    swal({
                        title: i18n.__('renderer.operation_failed'),
                        text: err.message,
                        type: 'error'
                    });
                } else {
                    this.popNotification(msg);
                    $('.applied').hide();
                    $this.children('.applied').show();
                }
            })
        });

        // new scheme click
        $('#btnNew').on('click', () => {
            this.showModalNew();
        });

        // edit scheme click
        $('#btnEdit').on('click', () => {
            var $currentActiveBtn = $('.nav-items li.active .lk-hosts');
            if ($currentActiveBtn.length > 0) {
                var id = $currentActiveBtn.attr('data-hosts-id');
                var url = $currentActiveBtn.attr('data-hosts-url');
                var name = $currentActiveBtn.find('span').text();
                this.showModalEdit(id, name, url);
            }
        });

        // refresh click
        $('#btnRefresh').on('click', (e) => this.refreshClickHandler(e));

        // delete click
        $('#btnDelete').on('click', () => this.deleteClickHandler());

        // apply click
        $('#btnApply').on('click', (e) => this.applyClickHandler(e));

        // undo click
        $('#btnUndo').on('click', ()=> {
            // add command.name, the purpose is to determine artificially modified when a change event is triggered
            this.editor.curOp = {
                command: {name: 'undoClick'}
            };
            this.editor.undo();
            this.editor.curOp = null;
        });

        // redo click
        $('#btnRedo').on('click', ()=> {
            // add command.name, the purpose is to determine artificially modified when a change event is triggered
            this.editor.curOp = {
                command: {name: 'redoClick'}
            };
            this.editor.redo();
            this.editor.curOp = null;
        });

        // copy click
        $('#btnCopy').on('click', ()=> {
            this.editor.focus();
            document.execCommand('copy');
        });

        // cut click
        $('#btnCut').on('click', ()=> {
            this.editor.focus();
            document.execCommand('cut');
        });

        // paste click
        $('#btnPaste').on('click', ()=> {
            this.editor.focus();
            document.execCommand('paste')
        });

        // search click
        $('#btnSearch').on('click', ()=> {
            ace.require(["ace/ext/searchbox"], (obj) => {
                new obj.Search(this.editor);
            });
        });

        // replace click
        $('#btnReplace').on('click', ()=> {
            ace.require(["ace/ext/searchbox"], (obj) => {
                new obj.Search(this.editor, true);
            });
        });
    }

    /**
     * timer, listen for cache, write to file if cache is not null
     */
    contentChange() {
        setInterval(()=> {
            if (this.buffer !== null) {
                let id = this.buffer.id;
                let content = this.buffer.content;
                // reset cache to null
                this.buffer = null;
                // write changes to file during the interval
                this.writeHostsContent(id, content, (err)=> {
                })
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
        var data = '';
        // local file
        if (!url) {
            let filePath;
            if (id === this.systemHostsId) {
                filePath = this.sysHostsFile;
            } else {
                filePath = path.resolve(this.hostsDockDir, id);
            }
            let rs = fs.createReadStream(filePath, 'utf8');
            rs.on('data', (chunk)=> {
                data += chunk.toString();
            });

            rs.on('end', ()=> {
                callback(null, data);
            });

            rs.on('error', (err)=> {
                callback(err);
            });
        } else {
            // local file
            if (url.startsWith('\\\\')) {
                let rs = fs.createReadStream(url, 'utf8');
                rs.on('data', (chunk)=> {
                    data += chunk.toString();
                });

                rs.on('end', ()=> {
                    callback(null, data);
                });

                rs.on('error', (err)=> {
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
                })
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
        var filePath;
        if (id === this.systemHostsId) {
            filePath = this.sysHostsFile;
        } else {
            filePath = path.resolve(this.hostsDockDir, id);
        }
        var ws = fs.createWriteStream(filePath, 'utf8');
        ws.write(content, ()=> {
            callback(null);
        });
        ws.on('error', (err)=> {
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
        var pathFrom, pathTo;
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
        var rs = fs.createReadStream(pathFrom, 'utf8');
        var ws = fs.createWriteStream(pathTo, 'utf8');
        rs.pipe(ws);
        rs.on('end', ()=> {
            callback(null);
        });
        rs.on('error', (err)=> {
            callback(err);
        });
        ws.on('error', (err)=> {
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
            cp.exec('ipconfig /flushdns', (err) => {
            });
        } else if (this.platForm === 'linux') {
            cp.exec('rcnscd restart', (err) => {
            });
        } else if (this.platForm === 'darwin') {
            cp.exec('killall -HUP mDNSResponder', (err) => {
            });
        }
    }

    /**
     * reset show/hidden for buttons
     * @param id
     */
    resetBtnState(id) {
        if (id === this.systemHostsId) {
            $('#btnEdit').hide();
            $('#btnDelete').hide();
            $('#btnApply').hide();
        } else {
            $('#btnEdit').show();
            $('#btnDelete').show();
            $('#btnApply').show();
        }
    }

    /**
     * new scheme
     */
    showModalNew() {
        var errShowing = false,
            that = this;
        swal.withForm({
            title: i18n.__('renderer.new_scheme'),
            text: i18n.__('renderer.new_scheme_desc'),
            showCancelButton: true,
            confirmButtonColor: '#DD6B55',
            confirmButtonText: i18n.__('renderer.new_scheme_submit'),
            cancelButtonText: i18n.__('renderer.cancel'),
            closeOnConfirm: false,
            animation: 'slide-from-top',
            formFields: [
                {id: 'txtName', placeholder: i18n.__('renderer.scheme_name')},
                {id: 'txtUrl', placeholder: i18n.__('renderer.scheme_address')}
            ]
        }, function (isConfirm) {
            var $errEl = $('.sa-error-container');
            var name = this.swalForm.txtName.trim();
            var url = this.swalForm.txtUrl.trim();
            if (isConfirm) {
                if (!name) {
                    if (!errShowing) {
                        errShowing = true;
                        $errEl.find('p').text(i18n.__('renderer.scheme_name_empty'));
                        $errEl.addClass('show');
                        setTimeout(()=> {
                            $errEl.removeClass('show');
                            errShowing = false;
                        }, 2000);
                    }
                    return false;
                }
                if (url && !that.urlPattern.test(url)) {
                    if (!errShowing) {
                        errShowing = true;
                        $errEl.find('p').text(i18n.__('renderer.scheme_address_err'));
                        $errEl.addClass('show');
                        setTimeout(()=> {
                            $errEl.removeClass('show');
                            errShowing = false;
                        }, 2000);
                    }
                    return false;
                }
                fs.readFile(that.configFile, 'utf8', (err, data)=> {
                    if (err) {
                        $('.swal-form').remove();
                        swal({
                            title: i18n.__('renderer.submit_failed'),
                            text: err.message,
                            type: 'error'
                        });
                    } else {
                        let isExists = false;
                        var config = JSON.parse(data);
                        if (!url) {
                            config.localHosts.some((item)=> {
                                if (item["name"] === name) {
                                    isExists = true;
                                }
                            });
                        } else {
                            config.remoteHosts.some((item)=> {
                                if (item["name"] === name) {
                                    isExists = true;
                                }
                            });
                        }
                        if (isExists) {
                            if (!errShowing) {
                                errShowing = true;
                                $errEl.find('p').text(i18n.__('renderer.scheme_name_exists'));
                                $errEl.addClass('show');
                                setTimeout(()=> {
                                    $errEl.removeClass('show');
                                    errShowing = false;
                                }, 2000);
                            }
                            return false;
                        } else {
                            let id = HostsDock.getUid();
                            if (!url) {
                                let now = moment(Date.now()).format('YYYY/MM/DD HH:mm:ss');
                                that.writeHostsContent(id, `# HostsDock - Created at ${now}\r\n`, (err)=> {
                                    if (err) {
                                        swal({
                                            title: i18n.__('renderer.submit_failed'),
                                            text: err.message,
                                            type: 'error'
                                        });
                                        $('.swal-form').remove();
                                    } else {
                                        config.localHosts.push({
                                            id: id,
                                            name: name,
                                            file: id
                                        });
                                        fs.writeFile(that.configFile, JSON.stringify(config, null, 4), 'utf8', (err)=> {
                                            if (err) {
                                                swal({
                                                    title: i18n.__('renderer.submit_failed'),
                                                    text: err.message,
                                                    type: 'error'
                                                });
                                                $('.swal-form').remove();
                                            } else {
                                                var $li = $(`<li><a class='lk-hosts' data-hosts-id='${id}'><i class='applied fa fa-check' title='${i18n.__('renderer.applied')}'></i><i class='fa fa-file-text-o'></i> <span>${name}</span><i class='loading fa fa-spinner fa-spin' title='${i18n.__('renderer.loading')}'></i></a></li>`);
                                                $('.nav-local').append($li);
                                                $li.children('.lk-hosts').click();
                                                swal({
                                                    title: i18n.__('renderer.submit_successfully'),
                                                    text: i18n.__('renderer.create_local_successfully', name),
                                                    type: 'success',
                                                    showConfirmButton: false,
                                                    timer: 1500
                                                });
                                                $('.swal-form').remove();
                                            }
                                        })
                                    }
                                });
                            } else {
                                config.remoteHosts.push({
                                    id: id,
                                    name: name,
                                    url: url
                                });
                                fs.writeFile(that.configFile, JSON.stringify(config, null, 4), 'utf8', (err)=> {
                                    if (err) {
                                        swal({
                                            title: i18n.__('renderer.submit_failed'),
                                            text: err.message,
                                            type: 'error'
                                        });
                                        $('.swal-form').remove();
                                    } else {
                                        var $li = $(`<li><a class='lk-hosts' data-hosts-id='${id}' data-hosts-url='${url}'><i class='applied fa fa-check' title='${i18n.__('renderer.applied')}'></i><i class='fa fa-globe'></i> <span>${name}</span><i class='loading fa fa-spinner fa-spin' title='${i18n.__('renderer.loading')}'></i></a></li>`);
                                        $('.nav-remote').append($li);
                                        $li.children('.lk-hosts').click();
                                        swal({
                                            title: i18n.__('renderer.submit_successfully'),
                                            text: i18n.__('renderer.create_remote_successfully', name),
                                            type: 'success',
                                            showConfirmButton: false,
                                            timer: 1500
                                        });
                                        $('.swal-form').remove();
                                    }
                                })
                            }
                        }
                    }
                })
            } else {
                $('.swal-form').remove();
            }
        })
    }

    /**
     * edit scheme
     * @param id scheme id
     * @param oldName current name
     * @param oldUrl current url
     */
    showModalEdit(id, oldName, oldUrl) {
        var errShowing = false,
            that = this;
        var forms = [{id: 'txtName', placeholder: i18n.__('renderer.scheme_name'), value: oldName}];
        if (oldUrl) {
            forms.push({id: 'txtUrl', placeholder: i18n.__('renderer.scheme_address'), value: oldUrl});
        }
        swal.withForm({
            title: i18n.__('renderer.edit_scheme'),
            text: oldUrl ? i18n.__('renderer.edit_scheme_remote_desc') : i18n.__('renderer.edit_scheme_local_desc'),
            showCancelButton: true,
            confirmButtonColor: '#DD6B55',
            confirmButtonText: i18n.__('renderer.edit_scheme_save'),
            cancelButtonText: i18n.__('renderer.cancel'),
            closeOnConfirm: false,
            animation: 'slide-from-top',
            formFields: forms
        }, function (isConfirm) {
            var $errEl = $('.sa-error-container');
            var name = this.swalForm.txtName.trim();
            var url;
            if (oldUrl) {
                url = this.swalForm.txtUrl.trim();
            }
            if (isConfirm) {
                if (!name) {
                    if (!errShowing) {
                        errShowing = true;
                        $errEl.find('p').text(i18n.__('renderer.scheme_name_empty'));
                        $errEl.addClass('show');
                        setTimeout(()=> {
                            $errEl.removeClass('show');
                            errShowing = false;
                        }, 2000);
                    }
                    return false;
                }
                if (oldUrl && !url) {
                    if (!errShowing) {
                        errShowing = true;
                        $errEl.find('p').text(i18n.__('renderer.scheme_address_empty'));
                        $errEl.addClass('show');
                        setTimeout(()=> {
                            $errEl.removeClass('show');
                            errShowing = false;
                        }, 2000);
                    }
                    return false;
                }
                if (url && !urlPattern.test(url)) {
                    if (!errShowing) {
                        errShowing = true;
                        $errEl.find('p').text(i18n.__('renderer.scheme_address_err'));
                        $errEl.addClass('show');
                        setTimeout(()=> {
                            $errEl.removeClass('show');
                            errShowing = false;
                        }, 2000);
                    }
                    return false;
                }
                if (name !== oldName) {
                    fs.readFile(that.configFile, 'utf8', (err, data)=> {
                        if (err) {
                            $('.swal-form').remove();
                            swal({
                                title: i18n.__('renderer.submit_failed'),
                                text: err.message,
                                type: 'error'
                            });
                        } else {
                            let isExists = false;
                            let config = JSON.parse(data);
                            if (!oldUrl) {
                                config.localHosts.some((item)=> {
                                    if (item["name"] === name) {
                                        isExists = true;
                                    }
                                });
                            } else {
                                config.remoteHosts.some((item)=> {
                                    if (item["name"] === name) {
                                        isExists = true;
                                    }
                                });
                            }
                            if (isExists) {
                                if (!errShowing) {
                                    errShowing = true;
                                    $errEl.find('p').text(i18n.__('renderer.scheme_name_exists'));
                                    $errEl.addClass('show');
                                    setTimeout(()=> {
                                        $errEl.removeClass('show');
                                        errShowing = false;
                                    }, 2000);
                                }
                                return false;
                            } else {
                                let hostsJson,
                                    hostsArray;
                                if (oldUrl) {
                                    hostsArray = config.remoteHosts;
                                } else {
                                    hostsArray = config.localHosts;
                                }
                                hostsArray.forEach((item)=> {
                                    if (item["id"] === id) {
                                        hostsJson = item;
                                        return false;
                                    }
                                });
                                if (hostsJson) {
                                    hostsJson.name = name;
                                    if (oldUrl) {
                                        hostsJson.url = url;
                                    }
                                    fs.writeFile(that.configFile, JSON.stringify(config, null, 4), 'utf8', (err)=> {
                                        if (err) {
                                            swal({
                                                title: i18n.__('renderer.submit_failed'),
                                                text: err.message,
                                                type: 'error'
                                            });
                                            $('.swal-form').remove();
                                        } else {
                                            let $btn = $('.nav-items a[data-hosts-id=' + id + ']');
                                            $btn.find('span').text(name);
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
                                            $('.swal-form').remove();
                                        }
                                    })
                                } else {
                                    swal({
                                        title: i18n.__('renderer.submit_failed'),
                                        text: err.message,
                                        type: 'error'
                                    });
                                    $('.swal-form').remove();
                                }
                            }
                        }
                    })
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
                        $('.swal-form').remove();
                    } else {
                        fs.readFile(that.configFile, 'utf8', (err, data)=> {
                            if (err) {
                                $('.swal-form').remove();
                                swal({
                                    title: i18n.__('renderer.submit_failed'),
                                    text: err.message,
                                    type: 'error'
                                });
                            } else {
                                let config = JSON.parse(data);
                                let hostsJson;
                                config.remoteHosts.forEach((item)=> {
                                    if (item["id" === id]) {
                                        hostsJson = item;
                                        return false;
                                    }
                                });
                                if (hostsJson) {
                                    hostsJson.url = url;
                                    fs.writeFile(that.configFile, JSON.stringify(config, null, 4), 'utf8', (err)=> {
                                        if (err) {
                                            swal({
                                                title: i18n.__('renderer.submit_failed'),
                                                text: err.message,
                                                type: 'error'
                                            });
                                            $('.swal-form').remove();
                                        } else {
                                            let $btn = $('.nav-items a[data-hosts-id=' + id + ']');
                                            $btn.attr('data-hosts-url', url).find('span').text(name);
                                            swal({
                                                title: i18n.__('renderer.save_successfully'),
                                                text: i18n.__('renderer.save_successfully_desc'),
                                                type: 'success',
                                                showConfirmButton: false,
                                                timer: 1500
                                            });
                                            $('.swal-form').remove();
                                        }
                                    })
                                } else {
                                    swal({
                                        title: i18n.__('renderer.submit_failed'),
                                        text: err.message,
                                        type: 'error'
                                    });
                                    $('.swal-form').remove();
                                }

                            }
                        })
                    }
                }
            } else {
                $('.swal-form').remove();
            }
        })
    }

    /**
     * content change handler
     */
    changeHandler() {
        // if has command.name, indicate that the content changes are caused by the user action, instead of program
        if (this.editor.curOp && this.editor.curOp.command.name) {
            var id = $('.nav-items li.active .lk-hosts').attr('data-hosts-id');
            var content = this.editor.getValue();
            // 先将当前内容放入缓存，到时批量写入
            this.buffer = {id: id, content: content};
        }
        // undo/redo will handle after changed, so must add to async queue
        setImmediate(()=> {
            var um = this.editor.session.getUndoManager();
            if (um.hasUndo()) {
                $('#btnUndo').removeAttr('disabled');
            } else {
                $('#btnUndo').attr('disabled', 'disabled');
            }
            if (um.hasRedo()) {
                $('#btnRedo').removeAttr('disabled');
            } else {
                $('#btnRedo').attr('disabled', 'disabled');
            }
        })
    }

    /**
     * nav click handler
     * @param e event object
     */
    navClickHandler(e) {
        var $this = $(e.currentTarget),
            $parent = $this.parent(),
            id = $this.attr('data-hosts-id'),
            url = $this.attr('data-hosts-url');
        if (!$parent.hasClass('active')) {
            $('.nav-items li.active').removeClass('active');
            $parent.addClass('active');
            $('.loading').hide();
            $this.children('.loading').show();
            var timeStart = Date.now();
            this.editor.setReadOnly(true);
            this.editor.session.setValue('', -1);
            $('#btnUndo').attr('disabled', 'disabled');
            $('#btnRedo').attr('disabled', 'disabled');
            $('#btnRefresh i').removeClass('fa-spin');
            $('#btnRefresh').attr('disabled', 'disabled');
            this.resetBtnState(id);
            if (!url) {
                this.readHostsContent(id, (err, data) => {
                    // TODO:no longer perform callback when navigation changed
                    if ($('.nav-items li.active .lk-hosts').attr('data-hosts-id') === id) {
                        if (err) {
                            swal({
                                title: i18n.__('renderer.load_hosts_failed'),
                                text: err.message,
                                type: 'error'
                            });
                        } else {
                            this.editor.setReadOnly(false);
                            this.editor.session.setValue(data, -1);
                        }
                        $('#btnRefresh').removeAttr('disabled');
                        // clear undo/redo list
                        this.editor.session.getUndoManager().reset();
                        var timeEnd = Date.now();
                        if (timeEnd - timeStart > this.loadingMin) {
                            $this.children('.loading').hide();
                        } else {
                            var timeSpan = this.loadingMin - (timeEnd - timeStart);
                            setTimeout(()=> {
                                $this.children('.loading').hide();
                            }, timeSpan);
                        }
                    }
                })
            } else {
                this.editor.setReadOnly(true);
                this.readHostsContent(id, url, (err, data)=> {
                    // TODO:no longer perform callback when navigation changed
                    if ($('.nav-items li.active .lk-hosts').attr('data-hosts-id') === id) {
                        if (err) {
                            swal({
                                title: i18n.__('renderer.get_remote_failed'),
                                text: err.message,
                                type: 'error'
                            });
                        } else {
                            this.editor.session.setValue(data, -1);
                        }
                        $('#btnRefresh').removeAttr('disabled');
                        // clear undo/redo list
                        this.editor.session.getUndoManager().reset();
                        var timeEnd = Date.now();
                        if (timeEnd - timeStart > this.loadingMin) {
                            $this.children('.loading').hide();
                        } else {
                            var timeSpan = this.loadingMin - (timeEnd - timeStart);
                            setTimeout(()=> {
                                $this.children('.loading').hide();
                            }, timeSpan);
                        }
                    }
                })
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
                this.readHostsContent(id, url, (err, data)=> {
                    if (err) {
                        callback(err);
                    } else {
                        var ws = fs.createWriteStream(this.sysHostsFile);
                        ws.write(data, 'utf8', ()=> {
                            callback(null, i18n.__('renderer.applied_remote_successfully', name));
                            // write applied scheme id to config
                            fs.readFile(this.configFile, 'utf8', (err, data)=> {
                                if (!err) {
                                    let config = JSON.parse(data);
                                    config.appliedId = id;
                                    fs.writeFile(this.configFile, JSON.stringify(config, null, 4), 'utf8', (err)=> {
                                    });
                                }
                            });
                            this.flushDns();
                        });
                        ws.on('error', (err)=> {
                            if (err.message.indexOf('operation not permitted') >= 0) {
                                err = new Error(i18n.__('renderer.run_with_admin'));
                            }
                            callback(err);
                        });
                    }
                })
            } else {
                this.copyHostsContent(id, this.systemHostsId, (err)=> {
                    if (err) {
                        if (err.message.indexOf('operation not permitted') >= 0) {
                            err = new Error(i18n.__('renderer.run_with_admin'));
                        }
                        callback(err);
                    } else {
                        callback(null, i18n.__('renderer.applied_local_successfully', name));
                        // write applied scheme id to config
                        fs.readFile(this.configFile, 'utf8', (err, data)=> {
                            if (!err) {
                                let config = JSON.parse(data);
                                config.appliedId = id;
                                fs.writeFile(this.configFile, JSON.stringify(config, null, 4), 'utf8', (err)=> {
                                });
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
        var $this = $(e.currentTarget);
        var $icon = $this.children('i');
        $this.attr('disabled', 'disabled');
        $icon.removeClass('fa-check').addClass('fa-circle-o-notch fa-spin');
        var $currentActiveBtn = $('.nav-items li.active .lk-hosts');
        if ($currentActiveBtn.length > 0) {
            var id = $currentActiveBtn.attr('data-hosts-id');
            var url = $currentActiveBtn.attr('data-hosts-url');
            var name = $currentActiveBtn.find('span').text();
            this.applyHosts(id, name, url, (err, msg) => {
                if (err) {
                    swal({
                        title: i18n.__('renderer.operation_failed'),
                        text: err.message,
                        type: 'error'
                    });
                } else {
                    this.popNotification(msg);
                    $('.applied').hide();
                    $currentActiveBtn.children('.applied').show();
                }
                $icon.removeClass('fa-circle-o-notch fa-spin').addClass('fa-check');
                $this.removeAttr('disabled');
            })
        }
    }

    /**
     * delete scheme handler
     */
    deleteClickHandler() {
        var $currentActiveBtn = $('.nav-items li.active .lk-hosts');
        if ($currentActiveBtn.length > 0) {
            var id = $currentActiveBtn.attr('data-hosts-id');
            var url = $currentActiveBtn.attr('data-hosts-url');
            var name = $currentActiveBtn.find('span').text();
            swal({
                    title: i18n.__('renderer.del_scheme'),
                    text: url ? i18n.__('renderer.del_scheme_remote_desc', name) : i18n.__('renderer.del_scheme_local_desc', name),
                    type: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#DD6B55',
                    confirmButtonText: i18n.__('renderer.del_confirm'),
                    cancelButtonText: i18n.__('renderer.cancel'),
                    closeOnConfirm: false
                }, function () {
                    fs.readFile(this.configFile, 'utf8', (err, data)=> {
                        if (err) {
                            swal({
                                title: i18n.__('renderer.operation_failed'),
                                text: err.message,
                                type: 'error'
                            });
                        } else {
                            let config = JSON.parse(data);
                            let hostsArray,
                                hostsJson;
                            if (url) {
                                hostsArray = config.remoteHosts;
                            } else {
                                hostsArray = config.localHosts;
                            }
                            hostsArray.forEach((item)=> {
                                if (item["id"] === id) {
                                    hostsJson = item;
                                    return false;
                                }
                            });
                            if (hostsJson) {
                                // remove this json
                                hostsArray.splice(hostsArray.indexOf(hostsJson), 1);
                                fs.writeFile(this.configFile, JSON.stringify(config, null, 4), 'utf8', (err)=> {
                                    if (err) {
                                        swal({
                                            title: i18n.__('renderer.operation_failed'),
                                            text: err.message,
                                            type: 'error'
                                        });
                                    } else {
                                        $('.lk-hosts[data-hosts-id=system]').click();
                                        $currentActiveBtn.parent().remove();
                                        swal({
                                            title: i18n.__('renderer.del_successfully'),
                                            type: 'success',
                                            showConfirmButton: false,
                                            timer: 1500
                                        });
                                    }
                                })
                            } else {
                                swal({
                                    title: i18n.__('renderer.operation_failed'),
                                    text: err.message,
                                    type: 'error'
                                });
                            }
                        }
                    })
                }
            );
        }
    }

    /**
     * refresh click handler
     * @param e
     */
    refreshClickHandler(e) {
        var $this = $(e.currentTarget);
        var $icon = $this.children('i');
        $this.attr('disabled', 'disabled');
        $icon.addClass('fa-spin');
        this.editor.setReadOnly(true);
        $('#btnUndo').attr('disabled', 'disabled');
        $('#btnRedo').attr('disabled', 'disabled');
        var $currentActiveBtn = $('.nav-items li.active .lk-hosts');
        var id = $currentActiveBtn.attr('data-hosts-id');
        var url = $currentActiveBtn.attr('data-hosts-url');
        if (!url) {
            this.readHostsContent(id, (err, data)=> {
                // TODO:no longer perform callback when navigation changed
                if ($('.nav-items li.active .lk-hosts').attr('data-hosts-id') === id) {
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
                            timer: 1500
                        });
                        this.editor.setReadOnly(false);
                        this.editor.session.setValue(data, -1);
                    }
                    $icon.removeClass('fa-spin');
                    $this.removeAttr('disabled');
                }
            });
        } else {
            this.readHostsContent(id, url, (err, data)=> {
                // TODO:no longer perform callback when navigation changed
                if ($('.nav-items li.active .lk-hosts').attr('data-hosts-id') === id) {
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
                            timer: 1500
                        });
                        this.editor.session.setValue(data, -1);
                    }
                    $icon.removeClass('fa-spin');
                    $this.removeAttr('disabled');
                }
            })
        }
    }

    /**
     * editor mouse move handler
     * @param e event object
     */
    mouseMoveHandler(e) {
        var rowNum = e.editor.renderer.screenToTextCoordinates(e.clientX, e.clientY).row;
        var currentBtnPos = $('.button-comment').attr('data-line');
        if (rowNum !== currentBtnPos) {
            $('.button-comment').remove();
            var $gutter = $('.ace_gutter-cell:contains(' + (rowNum + 1) + ')').map(function () {
                if ($(this).text() == rowNum + 1) {
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
        var $target = $(e.domEvent.target);
        if ($target.hasClass('button-comment')) {
            e.preventDefault();
            var lineNum = $target.attr('data-line');
            var line = this.editor.session.getLine(lineNum);
            var existsComments = false;
            var re = /^(\s*)#(.*)/;

            // add command.name, the purpose is to determine artificially modified when a change event is triggered
            this.editor.curOp = {
                command: {name: 'commentClick'}
            };

            if (re.test(this.editor.session.getLine(lineNum))) {
                existsComments = true;
            }

            if (existsComments) {
                var m = line.match(re);
                var newLine;
                if (m) {
                    m.shift();
                    newLine = m.join('');
                    ace.require(['ace/range'], (obj)=> {
                        this.editor.session.replace(new obj.Range(lineNum, 0, lineNum, line.length), newLine);
                    });
                }
            }
            else {
                this.editor.session.indentRows(lineNum, lineNum, "#");
            }
            // must reset to null
            this.editor.curOp = null;
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

var hostsDock = new HostsDock();
hostsDock.init();