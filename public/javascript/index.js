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

class HostsDock {
    constructor() {
        this.hostsDockDir = path.resolve(app.getPath('userData'), 'LocalHosts'); // 用来存放本地方案的路径
        this.configFile = path.resolve(app.getPath('userData'), 'config.json'); // 用户配置文件路径
        this.platForm = process.platform;
        this.sysHostsFile = this.platForm === 'win32' ? 'c:\\windows\\system32\\drivers\\etc\\hosts' : '/etc/hosts'; // 系统hosts文件路径
        this.originalHostsId = 'orignial';
        this.originalHostsName = '初始hosts';
        this.backupHostsId = 'backup';
        this.backupHostsName = '系统hosts备份';
        this.systemHostsId = 'system';
        this.loadingMin = 500;
        this.urlPattern = /((\w+:\/\/|\\\\)[-a-zA-Z0-9:@;?&=\/%\+\.\*!'\(\),\$_\{\}\^~\[\]`#|]+)/;
        this.editor = ace.edit("hosts-content");
        this.buffer = null; // 内容更改缓存，赋值时机：editor内容发生了人为更改，清空时机：监听器触发时清空并将内容写入文件
        this.bufferTimeInterval = 1000; // 批量提交更改的间隔时间
    }

    /**
     * 初始化
     */
    init() {
        this.detectFiles();
        this.loadEditor();
        this.watchSysHosts();
        this.bindEvents();
        this.contentChange();
    }

    /**
     * 检测必要的文件
     */
    detectFiles() {
        async.map([this.hostsDockDir, this.configFile], fs.stat, (err, results)=> {
            // 认为是首次启动程序
            if (err || !results[0].isDirectory() || !results[1].isFile()) {
                // 创建LocalHosts目录
                fs.mkdir(this.hostsDockDir, (err)=> {
                    if (err && err.code !== 'EEXIST') {
                        swal({
                            title: '创建本地hosts目录失败',
                            text: err.message,
                            type: 'error'
                        });
                    } else {
                        // 创建一个hosts文件，作为空白hosts
                        var now = moment(Date.now()).format('YYYY/MM/DD HH:mm:ss');
                        this.writeHostsContent(this.originalHostsId, `# HostsDock - Created at ${now}
#region Localhost
127.0.0.1 localhost
255.255.255.255 broadcasthost
#endregion`, (err)=> {
                            if (err) {
                                swal({
                                    title: `创建${this.originalHostsName}文件失败`,
                                    text: err.message,
                                    type: 'error'
                                });
                            }
                        });
                        // 创建系统hosts备份文件，从系统hosts复制内容
                        this.copyHostsContent(this.systemHostsId, this.backupHostsId, (err)=> {
                            if (err) {
                                swal({
                                    title: `创建${this.backupHostsName}文件失败`,
                                    text: err.message,
                                    type: 'error'
                                });
                            }
                        });
                    }
                });
                let config = {
                    appliedId: '',
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
                // 创建配置文件
                fs.writeFile(this.configFile, JSON.stringify(config, null, 4), (err) => {
                    if (err) {
                        swal({
                            title: '创建用户配置文件失败',
                            text: err.message,
                            type: 'error'
                        });
                    }
                });
                // 为提高执行效率，传入true后该方法不依赖必须的文件
                this.loadHostsList(true);
            } else {
                this.loadHostsList();
            }
        });

        // 检测系统hosts文件的读写权限
        fs.access(this.sysHostsFile, fs.R_OK | fs.W_OK, (err)=> {
            if (err) {
                swal({
                    title: '没有系统hosts文件的读写权限',
                    text: '请尝试使用管理员或超级用户身份启动应用！',
                    type: 'error'
                });
            }
        })
    }

    /**
     * 加载hosts列表
     */
    loadHostsList(isFirst = false) {
        if (isFirst) {
            $('.nav-local').append(`<li><a class='lk-hosts' data-hosts-id='${this.originalHostsId}'><i class='applied fa fa-check' title='已应用'></i><i class='fa fa-file-text-o'></i> <span>${this.originalHostsName}</span><i class='loading fa fa-spinner fa-spin' title='加载中'></i></a></li>` +
                `<li><a class='lk-hosts' data-hosts-id='${this.backupHostsId}'><i class='applied fa fa-check' title='已应用'></i><i class='fa fa-file-text-o'></i> <span>${this.backupHostsName}</span><i class='loading fa fa-spinner fa-spin' title='加载中'></i></a></li>`);
            $(`.lk-hosts[data-hosts-id=${this.systemHostsId}]`).click();
        } else {
            fs.readFile(this.configFile, 'utf8', (err, data) => {
                if (err) {
                    swal({
                        title: '加载hosts方案失败',
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
                        localHtml += `<li><a class='lk-hosts' data-hosts-id='${item.id}'><i class='applied fa fa-check' style='${appliedId === item.id ? "display:inline-block" : ""}' title='已应用'></i><i class='fa fa-file-text-o'></i> <span>${item.name}</span><i class='loading fa fa-spinner fa-spin' title='加载中'></i></a></li>`;
                    });
                    $('.nav-local').append(localHtml);
                    let remoteHtml = '';
                    remoteHosts.forEach((item)=> {
                        allIdArr.push(item.id);
                        remoteHtml += `<li><a class='lk-hosts' data-hosts-id='${item.id}' data-hosts-url='${item.url}'><i class='applied fa fa-check' style='${appliedId === item.id ? "display:inline-block" : ""}' title='已应用'></i><i class='fa fa-globe'></i> <span>${item.name}</span><i class='loading fa fa-spinner fa-spin' title='加载中'></i></a></li>`;
                    });
                    $('.nav-remote').append(remoteHtml);
                    // 上次退出程序时应用了有效的hosts方案
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
     * 初始化Editor
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
     * 监听系统hosts的修改
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
     * 绑定页面事件
     */
    bindEvents() {
        // 导航折叠事件绑定
        $('.toggle-title').on('click', (e) => {
            var $this = $(e.currentTarget);
            $this.parent().toggleClass('is-open');
        });

        // 导航单击事件绑定
        $('.nav-items').on('click', '.lk-hosts', (e) => this.navClickHandler(e));

        // 导航双击事件绑定
        $('.nav-items').on('dblclick', '.lk-hosts', (e) => {
            var $this = $(e.currentTarget),
                id = $this.attr('data-hosts-id'),
                name = $this.find('span').text(),
                url = $this.attr('data-hosts-url');
            this.applyHosts(id, name, url, (err, msg) => {
                if (err) {
                    swal({
                        title: '操作失败',
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

        // 新增按钮单击事件绑定
        $('#btnNew').on('click', () => {
            this.showModalNew();
        });

        // 编辑按钮单击事件绑定
        $('#btnEdit').on('click', () => {
            var $currentActiveBtn = $('.nav-items li.active .lk-hosts');
            if ($currentActiveBtn.length > 0) {
                var id = $currentActiveBtn.attr('data-hosts-id');
                var url = $currentActiveBtn.attr('data-hosts-url');
                var name = $currentActiveBtn.find('span').text();
                this.showModalEdit(id, name, url);
            }
        });

        // 刷新按钮单击事件绑定
        $('#btnRefresh').on('click', (e) => this.refreshClickHandler(e));

        // 删除按钮单击事件绑定
        $('#btnDelete').on('click', () => this.deleteClickHandler());

        // 应用按钮单击事件绑定
        $('#btnApply').on('click', (e) => this.applyClickHandler(e));

        // 撤销按钮单击事件绑定
        $('#btnUndo').on('click', ()=> {
            // 手动添加一个command.name属性，目的是当触发更改事件时，判定为人为修改
            this.editor.curOp = {
                command: {name: 'undoClick'}
            };
            this.editor.undo();
            this.editor.curOp = null;
        });

        // 重做按钮单击事件绑定
        $('#btnRedo').on('click', ()=> {
            // 手动添加一个command.name属性，目的是当触发更改事件时，判定为人为修改
            this.editor.curOp = {
                command: {name: 'redoClick'}
            };
            this.editor.redo();
            this.editor.curOp = null;
        });

        // 复制按钮单击事件绑定
        $('#btnCopy').on('click', ()=> {
            this.editor.focus();
            document.execCommand('copy');
        });

        // 剪切按钮单击事件绑定
        $('#btnCut').on('click', ()=> {
            this.editor.focus();
            document.execCommand('cut');
        });

        // 粘贴按钮单击事件绑定
        $('#btnPaste').on('click', ()=> {
            this.editor.focus();
            document.execCommand('paste')
        });

        // 查找按钮单击事件绑定
        $('#btnSearch').on('click', ()=> {
            ace.require(["ace/ext/searchbox"], (obj) => {
                new obj.Search(this.editor);
            });
        });

        // 替换按钮单击事件绑定
        $('#btnReplace').on('click', ()=> {
            ace.require(["ace/ext/searchbox"], (obj) => {
                new obj.Search(this.editor, true);
            });
        });
    }

    /**
     * 定时器，监听缓存中是否有数据，有的话就写入文件
     */
    contentChange() {
        setInterval(()=> {
            if (this.buffer !== null) {
                let id = this.buffer.id;
                let content = this.buffer.content;
                // 重置缓存为null
                this.buffer = null;
                // 将间隔时间内的更改写入文件
                this.writeHostsContent(id, content, (err)=> {
                })
            }
        }, this.bufferTimeInterval);
    }

    /**
     * 读取hosts文件
     * @param id 文件id
     * @param [url] 远程url
     * @param callback 回调函数
     */
    readHostsContent(id, url, callback) {
        if (typeof url === 'function') {
            callback = url;
            url = undefined;
        }
        var data = '';
        // 本地文件
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
            // 本地文件
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
                // 远程文件
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
     * 写入hosts文件
     * @param id 文件id
     * @param content 文本内容
     * @param callback 回调函数
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
     * 复制hosts内容
     * @param fromId 源文件Id
     * @param toId 目标文件Id
     * @param callback 回调函数
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
     * 生成唯一标识
     * @returns 唯一标识
     */
    static getUid() {
        shortid.characters('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$@');
        return shortid.generate();
    }

    /**
     * 刷新DNS
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
     * 重置按钮的显示隐藏
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
     * 新增方案
     */
    showModalNew() {
        var errShowing = false,
            that = this;
        swal.withForm({
            title: '新增方案',
            text: '若远程hosts文件的地址留空，则是本地方案',
            showCancelButton: true,
            confirmButtonColor: '#DD6B55',
            confirmButtonText: '提交方案',
            cancelButtonText: '取消',
            closeOnConfirm: false,
            animation: 'slide-from-top',
            formFields: [
                {id: 'txtName', placeholder: '方案名称'},
                {id: 'txtUrl', placeholder: '远程hosts文件的地址'}
            ]
        }, function (isConfirm) {
            var $errEl = $('.sa-error-container');
            var name = this.swalForm.txtName.trim();
            var url = this.swalForm.txtUrl.trim();
            if (isConfirm) {
                if (!name) {
                    if (!errShowing) {
                        errShowing = true;
                        $errEl.find('p').text('方案名称不能为空');
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
                        $errEl.find('p').text('远程文件的地址格式不正确');
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
                            title: '提交失败',
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
                                $errEl.find('p').text('方案名称已存在');
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
                                            title: '提交失败',
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
                                                    title: '提交失败',
                                                    text: err.message,
                                                    type: 'error'
                                                });
                                                $('.swal-form').remove();
                                            } else {
                                                var $li = $(`<li><a class='lk-hosts' data-hosts-id='${id}'><i class='applied fa fa-check' title='已应用'></i><i class='fa fa-file-text-o'></i> <span>${name}</span><i class='loading fa fa-spinner fa-spin' title='加载中'></i></a></li>`);
                                                $('.nav-local').append($li);
                                                $li.children('.lk-hosts').click();
                                                swal({
                                                    title: '提交成功',
                                                    text: `已成功创建本地方案：${name}`,
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
                                            title: '提交失败',
                                            text: err.message,
                                            type: 'error'
                                        });
                                        $('.swal-form').remove();
                                    } else {
                                        var $li = $(`<li><a class='lk-hosts' data-hosts-id='${id}' data-hosts-url='${url}'><i class='applied fa fa-check' title='已应用'></i><i class='fa fa-globe'></i> <span>${name}</span><i class='loading fa fa-spinner fa-spin' title='加载中'></i></a></li>`);
                                        $('.nav-remote').append($li);
                                        $li.children('.lk-hosts').click();
                                        swal({
                                            title: '提交成功',
                                            text: `已成功创建远程方案：${name}`,
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
     * 修改方案
     * @param id 方案id
     * @param oldName 当前名称
     * @param oldUrl 当前url
     */
    showModalEdit(id, oldName, oldUrl) {
        var errShowing = false,
            that = this;
        var forms = [{id: 'txtName', placeholder: '方案名称', value: oldName}];
        if (oldUrl) {
            forms.push({id: 'txtUrl', placeholder: '远程hosts文件的地址', value: oldUrl});
        }
        swal.withForm({
            title: '编辑方案',
            text: `当前编辑的是${oldUrl ? '远程' : '本地'}方案`,
            showCancelButton: true,
            confirmButtonColor: '#DD6B55',
            confirmButtonText: '保存方案',
            cancelButtonText: '取消',
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
                        $errEl.find('p').text('方案名称不能为空');
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
                        $errEl.find('p').text('远程地址不能为空');
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
                        $errEl.find('p').text('远程文件的地址格式不正确');
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
                                title: '提交失败',
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
                                    $errEl.find('p').text('方案名称已存在');
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
                                                title: '提交失败',
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
                                                title: '保存成功',
                                                text: `已成功保存方案的更改`,
                                                type: 'success',
                                                showConfirmButton: false,
                                                timer: 1500
                                            });
                                            $('.swal-form').remove();
                                        }
                                    })
                                } else {
                                    swal({
                                        title: '提交失败',
                                        text: err.message,
                                        type: 'error'
                                    });
                                    $('.swal-form').remove();
                                }
                            }
                        }
                    })
                } else {
                    // 实际未作修改
                    if ((oldUrl && url === oldUrl) || !oldUrl) {
                        swal({
                            title: '保存成功',
                            text: `已成功保存方案的更改`,
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
                                    title: '提交失败',
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
                                                title: '提交失败',
                                                text: err.message,
                                                type: 'error'
                                            });
                                            $('.swal-form').remove();
                                        } else {
                                            let $btn = $('.nav-items a[data-hosts-id=' + id + ']');
                                            $btn.attr('data-hosts-url', url).find('span').text(name);
                                            swal({
                                                title: '保存成功',
                                                text: `已成功保存方案的更改`,
                                                type: 'success',
                                                showConfirmButton: false,
                                                timer: 1500
                                            });
                                            $('.swal-form').remove();
                                        }
                                    })
                                } else {
                                    swal({
                                        title: '提交失败',
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
     * 编辑器内容更改的处理函数
     */
    changeHandler() {
        // 如果command有name属性，则说明是用户操作导致的内容更改，而非程序操作
        if (this.editor.curOp && this.editor.curOp.command.name) {
            var id = $('.nav-items li.active .lk-hosts').attr('data-hosts-id');
            var content = this.editor.getValue();
            // 先将当前内容放入缓存，到时批量写入
            this.buffer = {id: id, content: content};
        }
        // undo/redo是在修改完成之后才会处理，所以这里必须加到异步队列中
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
     * 导航单击的处理函数
     * @param e Event对象
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
                    // TODO:当改变导航后不再执行回调
                    if ($('.nav-items li.active .lk-hosts').attr('data-hosts-id') === id) {
                        if (err) {
                            swal({
                                title: '读取hosts文件失败',
                                text: err.message,
                                type: 'error'
                            });
                        } else {
                            this.editor.setReadOnly(false);
                            this.editor.session.setValue(data, -1);
                        }
                        $('#btnRefresh').removeAttr('disabled');
                        // 清除undo/redo列表
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
                    // TODO:当改变导航后不再执行回调
                    if ($('.nav-items li.active .lk-hosts').attr('data-hosts-id') === id) {
                        if (err) {
                            swal({
                                title: '远程文件读取失败',
                                text: err.message,
                                type: 'error'
                            });
                        } else {
                            this.editor.session.setValue(data, -1);
                        }
                        $('#btnRefresh').removeAttr('disabled');
                        // 清除undo/redo列表
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
     * 应用hosts方案
     * @param id 方案id
     * @param name 方案名称
     * @param url 远程地址
     * @param callback 回调函数
     */
    applyHosts(id, name, url, callback) {
        // 取消系统hosts方案的双击作用
        if (id !== this.systemHostsId) {
            if (url) {
                this.readHostsContent(id, url, (err, data)=> {
                    if (err) {
                        callback(err);
                    } else {
                        var ws = fs.createWriteStream(this.sysHostsFile);
                        ws.write(data, 'utf8', ()=> {
                            callback(null, `已成功应用远程方案：${name}`);
                            // 将应用的方案id写入config
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
                            if(err.message.indexOf('operation not permitted') >= 0){
                                err = new Error('请尝试使用管理员或超级用户身份启动应用！');
                            }
                            callback(err);
                        });
                    }
                })
            } else {
                this.copyHostsContent(id, this.systemHostsId, (err)=> {
                    if (err) {
                        if(err.message.indexOf('operation not permitted') >= 0){
                            err = new Error('请尝试使用管理员或超级用户身份启动应用！');
                        }
                        callback(err);
                    } else {
                        callback(null, `已成功应用本地方案：${name}`);
                        // 将应用的方案id写入config
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
     * 应用方案单击处理函数
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
                        title: '操作失败',
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
     * 删除方案的处理函数
     */
    deleteClickHandler() {
        var $currentActiveBtn = $('.nav-items li.active .lk-hosts');
        if ($currentActiveBtn.length > 0) {
            var id = $currentActiveBtn.attr('data-hosts-id');
            var url = $currentActiveBtn.attr('data-hosts-url');
            var name = $currentActiveBtn.find('span').text();
            swal({
                    title: '删除方案',
                    text: `确定要删除${url ? '远程' : '本地'}方案 ${name} 吗？`,
                    type: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#DD6B55',
                    confirmButtonText: '确定删除',
                    cancelButtonText: '取消',
                    closeOnConfirm: false
                }, function () {
                    fs.readFile(this.configFile, 'utf8', (err, data)=> {
                        if (err) {
                            swal({
                                title: '操作失败',
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
                                // 移除该Json
                                hostsArray.splice(hostsArray.indexOf(hostsJson), 1);
                                fs.writeFile(this.configFile, JSON.stringify(config, null, 4), 'utf8', (err)=> {
                                    if (err) {
                                        swal({
                                            title: '操作失败',
                                            text: err.message,
                                            type: 'error'
                                        });
                                    } else {
                                        $('.lk-hosts[data-hosts-id=system]').click();
                                        $currentActiveBtn.parent().remove();
                                        swal({
                                            title: "删除成功",
                                            type: 'success',
                                            showConfirmButton: false,
                                            timer: 1500
                                        });
                                    }
                                })
                            } else {
                                swal({
                                    title: '操作失败',
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
     * 刷新按钮处理函数
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
                // TODO:当改变导航后不再执行回调
                if ($('.nav-items li.active .lk-hosts').attr('data-hosts-id') === id) {
                    if (err) {
                        swal({
                            title: '读取hosts文本失败',
                            text: err.message,
                            type: 'error'
                        });
                        this.editor.session.setValue('', -1);
                    } else {
                        swal({
                            title: "刷新成功",
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
                // TODO:当改变导航后不再执行回调
                if ($('.nav-items li.active .lk-hosts').attr('data-hosts-id') === id) {
                    if (err) {
                        swal({
                            title: '远程文件读取失败',
                            text: err.message,
                            type: 'error'
                        });
                        this.editor.session.setValue('', -1);
                    } else {
                        swal({
                            title: "刷新成功",
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
     * Editor文档区鼠标移动处理函数
     * @param e Event对象
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
                $gutter.prepend(`<button class='button-comment' data-line='${rowNum}' title='注释(Ctrl+/)'>#</button>`);
            }
        }
    }

    /**
     * Editor注释按钮单击处理函数
     * @param e Event对象
     */
    gutterMousedownHandler(e) {
        var $target = $(e.domEvent.target);
        if ($target.hasClass('button-comment')) {
            e.preventDefault();
            var lineNum = $target.attr('data-line');
            var line = this.editor.session.getLine(lineNum);
            var existsComments = false;
            var re = /^(\s*)#(.*)/;

            // 手动添加一个command.name属性，目的是当触发更改事件时，判定为人为修改
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
            // 必须重新设为null
            this.editor.curOp = null;
        }
    }

    /**
     * 系统弹窗提示
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