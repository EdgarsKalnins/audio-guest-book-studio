import { app, BrowserWindow, ipcMain, dialog, shell, protocol, net } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { VideoExporter, ExportStartOptions } from './exporter';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env.APP_ROOT = path.join(__dirname, '..');

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST;

// Register privileged custom media scheme before app is ready
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'wedding-media',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
      bypassCSP: true,
    },
  },
]);

let win: BrowserWindow | null = null;
let currentExporter: VideoExporter | null = null;

function createWindow() {
  const possiblePreloads = [
    path.join(__dirname, 'preload.cjs'),
    path.join(__dirname, 'preload.js'),
    path.join(__dirname, 'preload.mjs'),
  ];
  const preloadPath = possiblePreloads.find((p) => fs.existsSync(p)) || possiblePreloads[0];
  console.log('[Main] Loading preload from:', preloadPath);

  win = new BrowserWindow({
    title: 'Wedding Audio Studio',
    width: 1280,
    height: 840,
    minWidth: 1060,
    minHeight: 700,
    backgroundColor: '#0f0e0d',
    titleBarStyle: 'hiddenInset', // Sleek native macOS styling
    trafficLightPosition: { x: 16, y: 16 },
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'));
  }

  win.on('closed', () => {
    win = null;
    if (currentExporter) {
      currentExporter.cancel();
      currentExporter = null;
    }
  });
}

// App lifecycle
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(() => {
  // Handle custom wedding-media:// protocol for fast, secure streaming
  protocol.handle('wedding-media', (request) => {
    try {
      let rawPath = decodeURIComponent(request.url.replace(/^wedding-media:\/\/(?:local-file)?/, ''));
      if (process.platform === 'win32' && !/^[a-zA-Z]:/.test(rawPath)) {
        rawPath = rawPath.replace(/^\//, '');
      } else if (!rawPath.startsWith('/')) {
        rawPath = '/' + rawPath;
      }
      return net.fetch(`file://${rawPath}`);
    } catch (err) {
      console.error('[Protocol] Failed to fetch wedding-media:', err);
      return new Response('Media Not Found', { status: 404 });
    }
  });

  setupIPCHandlers();
  createWindow();
});

function setupIPCHandlers() {
  // Open audio file(s)
  ipcMain.handle('dialog:openAudio', async () => {
    if (!win) return null;
    const res = await dialog.showOpenDialog(win, {
      title: 'Select Wedding Audio Recording(s)',
      filters: [
        { name: 'Audio Files', extensions: ['wav', 'mp3', 'm4a', 'aac', 'ogg', 'flac'] },
      ],
      properties: ['openFile', 'multiSelections'],
    });
    if (res.canceled) return null;
    return res.filePaths.map((fp) => ({
      path: fp,
      name: path.basename(fp),
    }));
  });

  // Open background image
  ipcMain.handle('dialog:openImage', async () => {
    if (!win) return null;
    const res = await dialog.showOpenDialog(win, {
      title: 'Select Background Image',
      filters: [
        { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp'] },
      ],
      properties: ['openFile'],
    });
    if (res.canceled || res.filePaths.length === 0) return null;
    return {
      path: res.filePaths[0],
      name: path.basename(res.filePaths[0]),
    };
  });

  // Select output save file path for single export
  ipcMain.handle('dialog:selectSavePath', async (_, defaultName: string) => {
    if (!win) return null;
    const res = await dialog.showSaveDialog(win, {
      title: 'Export Video Destination',
      defaultPath: defaultName || 'wedding-audio-video.mp4',
      filters: [{ name: 'MP4 Video', extensions: ['mp4'] }],
    });
    if (res.canceled) return null;
    return res.filePath;
  });

  // Select output folder for batch export
  ipcMain.handle('dialog:selectFolder', async () => {
    if (!win) return null;
    const res = await dialog.showOpenDialog(win, {
      title: 'Select Destination Folder for Batch Export',
      properties: ['openDirectory', 'createDirectory'],
    });
    if (res.canceled || res.filePaths.length === 0) return null;
    return res.filePaths[0];
  });

  // Demo assets path provider
  ipcMain.handle('app:getDemoAssets', () => {
    let audioPath = path.join(process.env.APP_ROOT, 'src/assets/demo-audio.mp3');
    let photoPath = path.join(process.env.APP_ROOT, 'src/assets/demo-photo.jpg');

    if (!fs.existsSync(audioPath)) {
      const assetsDir = path.join(RENDERER_DIST, 'assets');
      if (fs.existsSync(assetsDir)) {
        const files = fs.readdirSync(assetsDir);
        const foundAudio = files.find((f) => f.startsWith('demo-audio') && f.endsWith('.mp3'));
        const foundPhoto = files.find((f) => f.startsWith('demo-photo') && (f.endsWith('.jpg') || f.endsWith('.png')));
        if (foundAudio) audioPath = path.join(assetsDir, foundAudio);
        if (foundPhoto) photoPath = path.join(assetsDir, foundPhoto);
      }
    }

    return {
      audioPath,
      photoPath,
      audioUrl: `wedding-media://local-file${audioPath.startsWith('/') ? '' : '/'}${audioPath}`,
      photoUrl: `wedding-media://local-file${photoPath.startsWith('/') ? '' : '/'}${photoPath}`,
    };
  });

  // Read file as buffer
  ipcMain.handle('fs:readFile', async (_, filePath: string) => {
    try {
      const cleanPath = filePath.replace(/^file:\/\//, '');
      const buf = await fs.promises.readFile(cleanPath);
      return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to read file ${filePath}: ${msg}`);
    }
  });

  // Reveal in Finder / Explorer
  ipcMain.handle('shell:showItemInFolder', async (_, filePath: string) => {
    if (fs.existsSync(filePath)) {
      shell.showItemInFolder(filePath);
      return true;
    }
    return false;
  });

  // Video Export: Start
  ipcMain.handle('export:start', async (_, options: ExportStartOptions) => {
    if (currentExporter) {
      currentExporter.cancel();
      currentExporter = null;
    }

    currentExporter = new VideoExporter();

    // Hook drain callback to notify renderer
    currentExporter.setDrainCallback(() => {
      if (win) {
        win.webContents.send('export:drain');
      }
    });

    currentExporter.start(
      options,
      (percent, frame) => {
        if (win) {
          win.webContents.send('export:progress', { percentage: percent, frame });
        }
      },
      (outputPath) => {
        if (win) {
          win.webContents.send('export:complete', { outputPath });
        }
        currentExporter = null;
      },
      (error) => {
        if (win) {
          win.webContents.send('export:error', { error });
        }
        currentExporter = null;
      }
    );
    return true;
  });

  // Video Export: Write Frame (High-performance one-way event listener)
  ipcMain.on('export:frame', (_, frameData: Uint8Array) => {
    if (!currentExporter) return;
    const buffer = Buffer.from(frameData.buffer, frameData.byteOffset, frameData.byteLength);
    currentExporter.writeFrame(buffer, (percent, frame) => {
      if (win) {
        win.webContents.send('export:progress', { percentage: percent, frame });
      }
    });
  });

  // Video Export: Finish
  ipcMain.handle('export:finish', async () => {
    if (currentExporter) {
      currentExporter.finish();
      return true;
    }
    return false;
  });

  // Video Export: Cancel
  ipcMain.handle('export:cancel', async () => {
    if (currentExporter) {
      currentExporter.cancel();
      currentExporter = null;
      return true;
    }
    return false;
  });
}
