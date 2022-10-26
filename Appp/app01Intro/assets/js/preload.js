const { ipcRenderer, contextBridge } = require("electron");

/**
 * Main Api to open
 * select folder dialog.
 */
contextBridge.exposeInMainWorld("api", {
    selectFolderPopup: () => ipcRenderer.invoke("select-folder-popup", true),
});

contextBridge.exposeInMainWorld('ipcRenderer', {
    send: (channel, data) => ipcRenderer.send(channel, data),
    on: (channel, func) =>
    ipcRenderer.on(channel, (event, ...args) => func(...args)),
});
/**
 * Installing text.
 */
contextBridge.exposeInMainWorld('installingText', {
    handleInstalling: (callback) => ipcRenderer.on('update-installing', callback)
});
/**
 * Installing progress
 */
contextBridge.exposeInMainWorld('progressValue', {
    handleProgress: (callback) => ipcRenderer.on('update-progress', callback)
});
/**
 * Close the app.
 */
document.addEventListener('DOMContentLoaded', function() {
    let closeBtn = document.getElementById('close-app');
    closeBtn.addEventListener('click', () => {
        ipcRenderer.send('app-close');
    })
});


