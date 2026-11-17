// Preload script running in Electron renderer context
const electron = require('electron');
const { contextBridge, ipcRenderer, webUtils } = electron;

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

  // Reliable disk path resolution for drag-and-drop
  getPathForFile: (file: File): string => {
    try {
      if (webUtils && typeof webUtils.getPathForFile === 'function') {
        const p = webUtils.getPathForFile(file);
        if (p) return p;
      }
    } catch (e) {
      console.warn('[Preload] webUtils.getPathForFile failed:', e);
    }
    return (file as unknown as { path?: string }).path || '';
  },

  // Generates safe custom media streaming URL
  getMediaUrl: (diskPath: string): string => {
    if (!diskPath) return '';
    if (
      diskPath.startsWith('wedding-media://') ||
      diskPath.startsWith('http://') ||
      diskPath.startsWith('https://') ||
      diskPath.startsWith('blob:') ||
      diskPath.startsWith('data:')
    ) {
      return diskPath;
    }
    const cleanPath = diskPath.replace(/^file:\/\//, '');
    return `wedding-media://local-file${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;
  },

  // Demo assets path provider
  getDemoAssets: (): Promise<{
    audioPath: string;
    photoPath: string;
    audioUrl: string;
    photoUrl: string;
  }> => ipcRenderer.invoke('app:getDemoAssets'),

  // File system utilities
  readFile: (filePath: string) => ipcRenderer.invoke('fs:readFile', filePath),
  writeWavFile: (wavBytes: Uint8Array, fileName: string): Promise<string> =>
    ipcRenderer.invoke('audio:writeWavFile', wavBytes, fileName),
  transcodeToWav: (filePath: string): Promise<ArrayBuffer> =>
    ipcRenderer.invoke('audio:transcodeToWav', filePath),
  showInFolder: (filePath: string) => ipcRenderer.invoke('shell:showItemInFolder', filePath),

  // Video Export IPC
  startExport: (options: ExportStartPayload) => ipcRenderer.invoke('export:start', options),
  // High-performance asynchronous one-way frame streaming
  sendFrame: (buffer: Uint8Array) => ipcRenderer.send('export:frame', buffer),
  finishExport: () => ipcRenderer.invoke('export:finish'),
  cancelExport: () => ipcRenderer.invoke('export:cancel'),

  // Hardware WebCodecs fast muxing & zero-memory disk streaming
  initTempVideoFile: (): Promise<{ id: string; tempPath: string }> =>
    ipcRenderer.invoke('fs:initTempVideoFile'),
  writeTempVideoChunk: (id: string, chunk: Uint8Array, position: number): Promise<boolean> =>
    ipcRenderer.invoke('fs:writeTempVideoChunk', id, chunk, position),
  closeTempVideoFile: (id: string): Promise<string> =>
    ipcRenderer.invoke('fs:closeTempVideoFile', id),
  saveTempVideo: (videoBuffer: Uint8Array): Promise<string> =>
    ipcRenderer.invoke('fs:saveTempVideo', videoBuffer),
  muxVideoAndAudio: (options: {
    videoPath: string;
    audioPath: string;
    outputPath: string;
    voiceBoost: boolean;
  }): Promise<string> => ipcRenderer.invoke('export:muxVideoAndAudio', options),

  // Export event listeners
  onExportProgress: (callback: (data: { percentage: number; frame: number }) => void) => {
    const handler = (_: unknown, data: { percentage: number; frame: number }) => callback(data);
    ipcRenderer.on('export:progress', handler);
    return () => ipcRenderer.removeListener('export:progress', handler);
  },
  onExportDrain: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('export:drain', handler);
    return () => ipcRenderer.removeListener('export:drain', handler);
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
