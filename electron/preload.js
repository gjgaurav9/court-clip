const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  chooseDirectory: () => ipcRenderer.invoke('choose-directory'),
  exportClips: (videoPath, clips, outputDir) =>
    ipcRenderer.invoke('export-clips', videoPath, clips, outputDir),
  fileExists: (filePath) => fs.existsSync(filePath),
  getFileUrl: (filePath) => `file://${path.resolve(filePath)}`,
});
