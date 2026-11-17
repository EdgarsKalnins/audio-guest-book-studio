# 🤖 AI Agent Engineering Handbook & Guidelines (`AGENTS.md`)

> **For AI Coding Agents**: Claude Code, Cursor, Codex, Windsurf, Antigravity, OpenCode, and Gemini CLI.  
> **Repository**: [Audio Guest Book Studio](https://github.com/EdgarsKalnins/audio-guest-book-studio)  
> **Maintainer**: [Edgars Kalniņš](https://github.com/EdgarsKalnins) ([Momentbox.lv](https://momentbox.lv)), Riga, Latvia.

---

## 🧭 Purpose of This Document

This guide provides explicit, actionable architectural instructions, code conventions, and step-by-step implementation playbooks for autonomous and semi-autonomous AI agents working in this repository. 

Whenever you are asked to fix a bug, refactor code, or implement one of the **10 features from [ROADMAP.md](ROADMAP.md)**, follow the instructions in this document without deviating from core project constraints.

---

## ⚡ The 4 Non-Negotiable Directives

Before writing a single line of code, any agent MUST adhere to these 4 core tenets:

1. **Absolute Zero-Telemetry & 100% Offline Guarantee**:
   - **NEVER** introduce external analytics, tracking pixels, cloud logging, Sentry, Mixpanel, or phone-home network calls.
   - All audio processing, DSP algorithms, canvas rendering, FFmpeg pipelines, and machine-learning models (e.g. Whisper) must run entirely on the local client machine without internet access.
   - PRs or code edits violating this rule will be rejected immediately.

2. **Decoupled Architecture**:
   - **Math & DSP** belong in `src/engine/` (pure TypeScript, functional or class-based, testable in node/vitest).
   - **UI & Presentation** belong in `src/components/` (React 19, Tailwind CSS v3, Phosphor Icons).
   - **Desktop Interop** belongs in `electron/` (`main.ts` and `preload.ts` via Context Isolation).
   - **Shared Contracts** belong in `src/types/studio.ts`.

3. **Multi-Platform Native Fidelity (macOS, Windows, Linux)**:
   - Always ensure UI elements accommodate platform-specific chrome (e.g. macOS custom traffic light padding, Windows titlebar, Linux window controls).
   - Use safe cross-platform path resolution via `path.join` and avoid platform-exclusive shell assumptions.
   - Support both Dark Mode (`dark:` classes) and Light Mode (`light:` / default classes) seamlessly.

4. **Test-Driven Verification**:
   - Always run `npm test` before concluding any task.
   - All 18+ existing Vitest unit and integration tests must pass.
   - When introducing new audio logic or export options, write corresponding tests in `tests/`.

---

## 📂 Codebase Anatomy & Module Directory

```
├── electron/
│   ├── main.ts             # Electron main process (IPC handlers, FFmpeg spawning, window controls)
│   ├── preload.ts          # Context-isolated secure IPC bridge (`window.electronAPI`)
│   └── tsconfig.json
├── src/
│   ├── assets/             # Demo audio files & local static assets
│   ├── components/         # React presentation layer
│   │   ├── App.tsx         # Main layout, sequence state, theme switcher, responsive tabs
│   │   ├── CanvasStage.tsx # 60 FPS Canvas preview, aspect ratios, scrubber, drag drop
│   │   ├── MediaDropzone.tsx # Audio & photo file ingestion zone
│   │   ├── VisualizerPanel.tsx # 8 visualizer style glyphs, glow, and scale controls
│   │   ├── TypographyPanel.tsx # Couple names, date, subtitle, font selector
│   │   ├── AudioToolsPanel.tsx # Voice Boost auto-gain and pickup/hangup trimmers
│   │   ├── ExportModal.tsx # MP4 video generation dialog, progress bar, finder launcher
│   │   └── ExitModal.tsx   # Safe session close confirmation dialog
│   ├── engine/             # Core computational engines
│   │   ├── audioEngine.ts  # Web Audio API playback, AnalyserNode, peaks
│   │   ├── audioConcatenator.ts # Seamless multi-track timeline concatenation
│   │   ├── audioDenoise.ts # Voice Boost auto-gain & dynamic range compression
│   │   ├── fft.ts          # Cooley-Tukey Radix-2 FFT with Hann windowing
│   │   ├── frameGenerator.ts # Offscreen canvas frame loop & encoder dispatcher
│   │   ├── videoExporter.ts # Native FFmpeg pipe with auto-directory creation
│   │   └── visualizers/
│   │       ├── renderer.ts # Canvas compositor (background + vignette + waves + text)
│   │       └── styles.ts   # Mathematical renderers for all 8 visualizer modes
│   └── types/
│       └── studio.ts       # Central TypeScript interfaces & configuration schemas
├── tests/                  # Vitest unit & integration test suites
├── AGENTS.md               # This agent instruction manual
├── CONTRIBUTING.md         # Open-source contributor guide
├── ROADMAP.md              # The 10 approved future feature specifications
└── README.md               # Primary project documentation
```

---

## 🛠️ Step-by-Step Playbooks for the 10 Roadmap Features

When assigned to implement a feature from [ROADMAP.md](ROADMAP.md), use these step-by-step instructions:

### Playbook 1: Batch Export Mode (SD Card Processor)
1. **Extend Types**: In `src/types/studio.ts`, add `BatchExportJob` interface with `fileId`, `inputPath`, `outputPath`, `status`, and `progress`.
2. **Queue Orchestration**: Create `src/engine/batchExporter.ts`. Manage an array of jobs sequentially using `Promise.all` with concurrency = 1 to protect GPU/CPU memory.
3. **UI Integration**: Update `src/components/ExportModal.tsx` to display a toggle between "Single Concatenated Film" and "Batch Individual Clips".
4. **Error Handling**: Wrap each job in `try...catch` so an unreadable file marks that item as failed and continues processing remaining files.
5. **Testing**: Add `tests/batchExporter.test.ts` verifying sequential execution and error tolerance.

### Playbook 2: Social Safe-Zone Overlays & Aspect Ratios
1. **Extend Types**: In `src/types/studio.ts`, add `'4:5'` to `AspectRatio` enum (`'9:16' | '16:9' | '1:1' | '4:5'`).
2. **Safe-Zone Overlay**: In `src/components/CanvasStage.tsx`, add a toggle state `showSafeZones` with a viewfinder button. Render a lightweight SVG or CSS outline indicating Instagram Reels & TikTok right-side action buttons and bottom caption margins.
3. **Canvas Protection**: Ensure the safe zone overlay is drawn only on the live DOM canvas and never sent to `frameGenerator.ts`.
4. **Testing**: Verify switching aspect ratios updates canvas dimensions cleanly (`1080x1920`, `1920x1080`, `1080x1080`, `1080x1350`).

### Playbook 3: Audio Noise Cleanup & Speech Clarifier (Voice Isolation)
1. **DSP Filter Pipeline**: In `src/engine/audioDenoise.ts`, expand `applyVoiceBoost` or add `applySpeechClarifier`:
   - High-pass filter at 80Hz (cuts handling noise and electrical AC hum).
   - Dynamic noise gate with hysteresis (zeroes out silent pauses between speech).
   - Formant presence boost at 2.5kHz–3.5kHz.
2. **Audio Tools UI**: In `src/components/AudioToolsPanel.tsx`, add a "Speech Clarifier" switch with a sensitivity slider.
3. **Testing**: Add unit tests in `tests/audioDenoise.test.ts` verifying DC offset removal and frequency filtering.

### Playbook 4: Transparent Alpha Video Export (WebM / Apple ProRes 4444)
1. **Alpha Background State**: In `src/types/studio.ts`, add `backgroundMode: 'photo' | 'solid' | 'transparent'`.
2. **Canvas Compositor**: In `src/engine/visualizers/renderer.ts`, when `backgroundMode === 'transparent'`, clear the canvas with `ctx.clearRect(0, 0, width, height)` and omit the vignette/photo pass.
3. **FFmpeg Transcode Flags**: In `src/engine/videoExporter.ts` and `electron/main.ts`:
   - For ProRes 4444: `-c:v prores_ks -profile:v 4 -pix_fmt yuva444p10le`.
   - For WebM: `-c:v libvpx-vp9 -pix_fmt yuva420p`.
4. **Testing**: Add test in `tests/exporter.test.ts` validating FFmpeg argument construction for transparent formats.

### Playbook 5: Silence Trimmer & Outgoing Greeting Prepend
1. **Silence Detection**: In `src/engine/audioConcatenator.ts`, add `detectSpeechBoundaries(buffer: AudioBuffer, thresholdDb: number)`.
2. **Outgoing Prompt**: Add secondary state in `src/App.tsx` for `greetingAudio: AudioBuffer | null`.
3. **Assembly**: In timeline generation, prepend the greeting buffer followed by a synthesized 800Hz telephone beep (0.3s) before the first guest recording.
4. **Testing**: Test speech boundary trimming on synthetic buffers with silent prefixes/suffixes.

### Playbook 6: Polaroid & Retro Photo Collage Templates
1. **Frame Layout Engine**: Create `src/engine/visualizers/frames.ts`.
2. **Polaroid Renderer**: Draw white border with bevel shadow, image offset, and render couple names onto the Polaroid chin using a handwriting cursive script (`Caveat` or `Marck Script`).
3. **Photo Booth Strip**: Render 3 vertical photo cells on the left 40% of the screen with visualizer in the right 60%.
4. **Testing**: Verify rendering completes without NaN values when dimensions change.

### Playbook 7: Looping Video & Animated B-Roll Backgrounds
1. **Video Background Component**: In `src/components/CanvasStage.tsx`, allow `HTMLVideoElement` playback for background loops.
2. **Export Frame Grabbing**: In `src/engine/frameGenerator.ts`, seek the video element in lockstep with the export frame clock (`currentTime = frameIndex / fps % videoDuration`).
3. **Testing**: Confirm video frames are drawn to canvas context without memory buildup.

### Playbook 8: Local AI Speech-to-Text Subtitles (Whisper Offline)
1. **Local Model Engine**: Use Whisper.cpp WASM (`@remotion/install-whisper-cpp` or `@xenova/transformers` with Whisper-tiny ONNX) strictly bundled locally.
2. **Transcription Pipeline**: Process raw audio PCM in worker thread. Output structured JSON: `Array<{ word: string, start: number, end: number }>`.
3. **Karaoke Subtitle Renderer**: In `src/engine/visualizers/renderer.ts`, render centered captions with the current active word highlighted.
4. **Testing**: Verify parser handles empty transcripts and unusual timestamps gracefully.

### Playbook 9: Fine-Grained Waveform Styling & Gradients
1. **Color Stops**: In `src/types/studio.ts`, change or extend `waveColor` to support array of stops: `{ offset: number, color: string }[]`.
2. **Canvas Gradients**: In `src/engine/visualizers/styles.ts`, use `ctx.createLinearGradient` or `ctx.createRadialGradient` using the configured color stops.
3. **UI Swatches**: In `src/components/VisualizerPanel.tsx`, add preset gradient swatches (Rose Gold, Champagne, Emerald, Monochrome).
4. **Testing**: Confirm backward compatibility when a single color string is provided.

### Playbook 10: Dynamic QR Code Gallery Watermark
1. **Library**: Add `qrcode` (`npm install qrcode @types/qrcode`).
2. **Generation**: Create `src/engine/qrGenerator.ts` converting target URL to an offscreen canvas or SVG path.
3. **Compositor**: In `src/engine/visualizers/renderer.ts`, render QR code in specified corner with customizable opacity and margin.
4. **Testing**: Unit test verifying valid data URL generation from arbitrary strings.

---

## 🔌 Backend-Frontend IPC Contract Verification Protocol

When building, fixing, or extending features that cross the bridge between the Electron backend (`electron/main.ts`, `electron/preload.ts`, `electron/exporter.ts`) and the frontend presentation / DSP layer (`src/App.tsx`, `src/engine/`), all AI coding agents MUST adhere to these 5 invariant directives:

1. **Hardware WebCodecs vs. Native FFmpeg Routing (Alpha Channel Invariant)**:
   - Chromium WebCodecs `VideoEncoder` (`mp4-muxer`) is strictly H.264 AVC (opaque pixels only).
   - Any export involving alpha transparency (`config.backgroundMode === 'transparent'`, Apple ProRes 4444 `.mov`, or Google WebM `.webm`) **MUST bypass WebCodecs** and route to `runFfmpegPipeExport` via the lossless PNG streaming pipe (`-vcodec png`).
   - Never attempt to force alpha into `mp4-muxer` as it will fail or output corrupt opaque frames.

2. **Master Timeline Audio Offset Normalization (Double-Trim Guard)**:
   - When the user trims the timeline (`trimStart` / `trimEnd`) and exports a continuous master video, `audioEngine.getMasterWavBytes(trimStart, trimEnd)` produces an already normalized WAV file (`wedding_sequence_*.wav`) starting at `00:00.000`.
   - Any downstream call to `startExport` with this pre-trimmed master file **MUST pass `trimStart: 0`** to FFmpeg. Passing the original `trimStart` causes FFmpeg to apply `-ss trimStart` a second time, erroneously cutting off the guest's speech.

3. **Container-Aware Audio Multiplexing**:
   - In `electron/main.ts` (`export:muxVideoAndAudio`), never apply MP4-specific flags like `-movflags +faststart` or AAC audio (`-c:a aac`) to Matroska/WebM containers (`.webm`).
   - Always branch based on destination container:
     - `.webm`: `-c:a libopus -b:a 128k` (omit faststart).
     - `.mov`: `-c:a pcm_s16le` or `-c:a aac -b:a 192k` with `-movflags +faststart`.
     - `.mp4`: `-c:a aac -b:a 192k` with `-movflags +faststart`.

4. **Batch SD Card Queue Buffer Isolation**:
   - The global `audioEngineRef.current` in `src/App.tsx` holds the concatenated multi-track sequence.
   - When running batch exports (`src/engine/batchExporter.ts`), each job **MUST receive an isolated `AudioEngine` instance** initialized strictly with that individual track's `AudioBuffer` and relative duration (`trimStart: 0, trimEnd: track.duration`).
   - Never sample offline FFT frames (`getOfflineFrameData`) for individual batch items from the multi-track timeline buffer.

5. **Synchronization of IPC TypeScript Interfaces**:
   - Any addition or change to IPC payloads in `electron/main.ts` (`ipcMain.handle` / `ipcMain.on`) must be mirrored immediately in `electron/preload.ts` (`ExportStartPayload` / `ElectronAPI`) and `src/types/electron.d.ts`.
   - Never rely on `(window as any).electronAPI`. Keep all preload typings 100% type-safe.

---

## 🧪 Verification & Release Workflow

Every AI agent completing a task MUST run:

```bash
# 1. Verify TypeScript types and build
npm run build

# 2. Run full Vitest suite
npm test

# 3. Check git status for unintended artifacts
git status
```

If tests fail, diagnose and fix the root cause before completing your turn. Do not ignore failing tests or disable tests without explicit user instructions.
