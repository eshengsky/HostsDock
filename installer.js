#!/usr/bin/env node

const createWindowsInstaller = require('electron-winstaller')
    .createWindowsInstaller;
const path = require('path');
const rimraf = require('rimraf');

function getInstallerConfig() {
    const rootPath = path.join(__dirname, './');
    const outPath = path.join(rootPath, 'out');

    return Promise.resolve({
        appDirectory: path.join(outPath, 'HostsDock-win32-ia32'),
        exe: 'HostsDock.exe',
        iconUrl: 'https://raw.githubusercontent.com/eshengsky/HostsDock/master/public/image/hostsdock.ico',
        noMsi: true,
        outputDirectory: path.join(outPath, 'windows-installer'),
        setupExe: 'HostsDockSetup.exe',
        setupIcon: path.join(rootPath, 'public', 'image', 'setup.ico'),
        skipUpdateIcon: true
    });
}

function deleteOutputFolder() {
    return new Promise((resolve, reject) => {
        rimraf(path.join(__dirname, './', 'out', 'windows-installer'), error => {
            error ? reject(error) : resolve();
        });
    });
}

deleteOutputFolder()
    .then(getInstallerConfig)
    .then(createWindowsInstaller)
    .catch(error => {
        console.error(error.message || error);
        process.exit(1);
    });
