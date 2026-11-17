import { contextBridge, ipcRenderer } from 'electron';

export interface ExportStartPayload {
  outputPath: string;
  audioPath: string;
  width: number;
  height: number;
  fps: number;
  duration: number;
  totalFrames: number;
  trimStart: number;
  trimEnd: number;
  voiceBoost: boolean;
}

const api = {
  // File dialogs
  openAudioFiles: () => ipcRenderer.invoke('dialog:openAudio'),
  openImageFile: () => ipcRenderer.invoke('dialog:openImage'),
  selectSavePath: (defaultName: string) => ipcRenderer.invoke('dialog:selectSavePath', defaultName),
  selectFolder: () => ipcRenderer.invoke('dialog:selectFolder'),

  // File system utilities
  readFile: (filePath: string) => ipcRenderer.invoke('fs:readFile', filePath),
  showInFolder: (filePath: string) => ipcRenderer.invoke('shell:showItemInFolder', filePath),

  // Video Export IPC
  startExport: (options: ExportStartPayload) => ipcRenderer.invoke('export:start', options),
  sendFrame: (buffer: Uint8Array) => ipcRenderer.invoke('export:frame', buffer),
  finishExport: () => ipcRenderer.invoke('export:finish'),
  cancelExport: () => ipcRenderer.invoke('export:cancel'),

  // Export event listeners
  onExportProgress: (callback: (data: { percentage: number; frame: number }) => void) => {
    const handler = (_: unknown, data: { percentage: number; frame: number }) => callback(data);
    ipcRenderer.on('export:progress', handler);
    return () => ipcRenderer.removeListener('export:progress', handler);
  },
  onExportComplete: (callback: (data: { outputPath: string }) => void) => {
    const handler = (_: unknown, data: { outputPath: string }) => callback(data);
    ipcRenderer.on('export:complete', handler);
    return () => ipcRenderer.removeListener('export:complete', handler);
  },
  onExportError: (callback: (data: { error: string }) => void) => {
    const handler = (_: unknown, data: { error: string }) => callback(data);
    ipcRenderer.on('export:error', handler);
    return () => ipcRenderer.removeListener('export:error', handler);
  },
};

contextBridge.exposeInMainWorld('electronAPI', api);

export type ElectronAPI = typeof api;
