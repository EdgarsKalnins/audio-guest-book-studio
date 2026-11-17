import { app, BrowserWindow, ipcMain, dialog, shell, protocol, net } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
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
let isForceClosing = false;
let currentExporter: VideoExporter | null = null;

function createWindow() {
  const possiblePreloads = [
    path.join(__dirname, 'preload.cjs'),
    path.join(__dirname, 'preload.js'),
    path.join(__dirname, 'preload.mjs'),
  ];
  const preloadPath = possiblePreloads.find((p) => fs.existsSync(p)) || possiblePreloads[0];
  console.log('[Main] Loading preload from:', preloadPath);

  const isMac = process.platform === 'darwin';

  win = new BrowserWindow({
    title: 'Audio Guest Book Studio',
    width: 1280,
    height: 840,
    minWidth: 1060,
    minHeight: 700,
    backgroundColor: '#0d0d0f',
    titleBarStyle: isMac ? 'hiddenInset' : 'default', // Sleek traffic lights on macOS, native titlebar on Windows & Linux
    trafficLightPosition: isMac ? { x: 16, y: 16 } : undefined,
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

  win.on('close', (e) => {
    if (!isForceClosing) {
      if (win && !win.isDestroyed() && !win.webContents.isDestroyed()) {
        e.preventDefault();
        try {
          win.webContents.send('app:request-close');
        } catch {
          isForceClosing = true;
          win.close();
        }
      }
    }
  });

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
        {
          name: 'Audio Recordings (*.wav, *.mp3, *.m4a, *.aac, *.ogg, *.flac, *.aiff, etc.)',
          extensions: [
            'wav',
            'mp3',
            'm4a',
            'aac',
            'ogg',
            'flac',
            'aiff',
            'aif',
            'wma',
            'opus',
            'webm',
            'amr',
            'm4r',
            'caf',
          ],
        },
        { name: 'All Files (*.*)', extensions: ['*'] },
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
    const downloadsDir = app.getPath('downloads');
    const safeName = defaultName || 'wedding-audio-video.mp4';
    const res = await dialog.showSaveDialog(win, {
      title: 'Export Video Destination',
      defaultPath: path.join(downloadsDir, safeName),
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

  // App exit and close lifecycle
  ipcMain.handle('app:exit', () => {
    isForceClosing = true;
    if (currentExporter) {
      currentExporter.cancel();
      currentExporter = null;
    }
    app.quit();
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

  // Write temporary master sequence WAV file for FFmpeg export
  ipcMain.handle('audio:writeWavFile', async (_, wavBytes: Uint8Array, fileName: string) => {
    try {
      const tempDir = path.join(os.tmpdir(), 'wedding_studio_timeline');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      const safeName = fileName || `master_timeline_${Date.now()}.wav`;
      const targetPath = path.join(tempDir, safeName);
      await fs.promises.writeFile(targetPath, Buffer.from(wavBytes));
      return targetPath;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to write timeline WAV file: ${msg}`);
    }
  });

  // Transcode any exotic audio format into PCM WAV using bundled FFmpeg
  ipcMain.handle('audio:transcodeToWav', async (_, filePath: string) => {
    try {
      const cleanPath = filePath.replace(/^file:\/\//, '');
      const dummyExporter = new VideoExporter();
      const ffmpegBin = dummyExporter.resolveFfmpegPath();
      const tempOut = path.join(os.tmpdir(), `transcode_${Date.now()}.wav`);

      execFileSync(ffmpegBin, [
        '-y',
        '-i', cleanPath,
        '-ar', '44100',
        '-ac', '2',
        '-c:a', 'pcm_s16le',
        tempOut,
      ]);

      const buf = await fs.promises.readFile(tempOut);
      try {
        fs.unlinkSync(tempOut);
      } catch {
        // Ignored
      }
      return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to transcode audio file ${filePath}: ${msg}`);
    }
  });

  // Active temporary video streaming handles for zero-memory disk streaming
  const activeTempVideoFiles = new Map<string, { path: string; fd: number }>();

  ipcMain.handle('fs:initTempVideoFile', async () => {
    try {
      const tempDir = path.join(os.tmpdir(), 'wedding_studio_export');
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
      const id = `vid_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const tempPath = path.join(tempDir, `temp_hw_video_${id}.mp4`);
      const fd = fs.openSync(tempPath, 'w+');
      activeTempVideoFiles.set(id, { path: tempPath, fd });
      return { id, tempPath };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to initialize temp video file: ${msg}`);
    }
  });

  ipcMain.handle('fs:writeTempVideoChunk', async (_, id: string, chunk: Uint8Array, position: number) => {
    try {
      const entry = activeTempVideoFiles.get(id);
      if (!entry) throw new Error(`Temp video file handle not found: ${id}`);
      const buf = Buffer.from(chunk.buffer, chunk.byteOffset, chunk.byteLength);
      fs.writeSync(entry.fd, buf, 0, buf.length, position);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to write temp video chunk: ${msg}`);
    }
  });

  ipcMain.handle('fs:closeTempVideoFile', async (_, id: string) => {
    try {
      const entry = activeTempVideoFiles.get(id);
      if (!entry) return '';
      fs.closeSync(entry.fd);
      const tempPath = entry.path;
      activeTempVideoFiles.delete(id);
      return tempPath;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to close temp video file: ${msg}`);
    }
  });

  // Save temporary video buffer to disk (fallback)
  ipcMain.handle('fs:saveTempVideo', async (_, videoBuffer: Uint8Array) => {
    try {
      const tempDir = path.join(os.tmpdir(), 'wedding_studio_export');
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
      const tempPath = path.join(tempDir, `temp_hw_video_${Date.now()}.mp4`);
      await fs.promises.writeFile(tempPath, Buffer.from(videoBuffer));
      return tempPath;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to save temp video: ${msg}`);
    }
  });

  // 1-second lossless multiplexer: combines WebCodecs hardware-encoded video with audio (-c:v copy)
  ipcMain.handle(
    'export:muxVideoAndAudio',
    async (_, { videoPath, audioPath, outputPath, voiceBoost }: {
      videoPath: string;
      audioPath: string;
      outputPath: string;
      voiceBoost: boolean;
    }) => {
      return new Promise((resolve, reject) => {
        const dummyExporter = new VideoExporter();
        const ffmpegBin = dummyExporter.resolveFfmpegPath();

        const outDir = path.dirname(outputPath);
        if (!fs.existsSync(outDir)) {
          fs.mkdirSync(outDir, { recursive: true });
        }

        const audioFilterArgs: string[] = [];
        if (voiceBoost) {
          audioFilterArgs.push('-af', 'loudnorm=I=-16:TP=-1.5:LRA=11');
        }

        const args = [
          '-y',
          '-i', videoPath,
          '-i', audioPath,
          '-map', '0:v:0', // Explicitly take video from input 0
          '-map', '1:a:0', // Explicitly take audio from input 1
          '-c:v', 'copy',  // Zero re-encoding of video! Runs at 10,000+ FPS
          ...audioFilterArgs,
          '-c:a', 'aac',   // Universal high-fidelity AAC-LC audio
          '-b:a', '192k',  // 192 kbps
          '-ar', '44100',  // 44.1 kHz stereo
          '-ac', '2',
          '-movflags', '+faststart', // Instant start for Apple QuickTime / iPhone / Web
          '-shortest',
          outputPath,
        ];

        console.log('[Muxer] Spawning lossless audio-video mux:', args.join(' '));
        const proc = spawn(ffmpegBin, args);

        let stderr = '';
        proc.stderr.on('data', (d) => {
          stderr += d.toString();
        });

        proc.on('close', (code) => {
          // Clean up temp video file
          try {
            if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
          } catch {
            // Ignored
          }

          if (code === 0) {
            resolve(outputPath);
          } else {
            reject(
              new Error(`Lossless audio mux failed (exit code ${code}): ${stderr.slice(-300)}`)
            );
          }
        });

        proc.on('error', (err) => {
          reject(new Error(`Failed to spawn FFmpeg muxer: ${err.message}`));
        });
      });
    }
  );

  // Reveal in Finder / Explorer (always resolves to absolute path)
  ipcMain.handle('shell:showItemInFolder', async (_, filePath: string) => {
    try {
      if (!filePath) return false;
      const cleanPath = filePath.replace(/^file:\/\//, '');
      const absPath = path.resolve(cleanPath);
      if (fs.existsSync(absPath)) {
        shell.showItemInFolder(absPath);
        return true;
      }
      const dir = path.dirname(absPath);
      if (fs.existsSync(dir)) {
        shell.openPath(dir);
        return true;
      }
    } catch (e) {
      console.warn('[Shell] showItemInFolder failed:', e);
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
