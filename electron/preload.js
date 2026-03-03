const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  chooseDirectory: () => ipcRenderer.invoke('choose-directory'),
  exportClips: (videoPath, clips, outputDir) =>
    ipcRenderer.invoke('export-clips', videoPath, clips, outputDir),
});
