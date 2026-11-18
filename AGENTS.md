# 🤖 AI Agent Engineering Handbook & Guidelines (`AGENTS.md`)

> **For Autonomous & Semi-Autonomous AI Coding Agents**: Claude Code, Cursor, Codex, Windsurf, Antigravity, OpenCode, and Gemini CLI.  
> **Repository**: [Audio Guest Book Studio](https://github.com/EdgarsKalnins/audio-guest-book-studio)  
> **Maintainer**: [Edgars Kalniņš](https://github.com/EdgarsKalnins) ([Momentbox.lv](https://momentbox.lv)), Riga, Latvia.  
> **Last Updated**: November 2026 • Status: **All 10 Core Roadmap Features Completed & Verified**

---

## 🧭 Purpose & Agent Instructions

This document is the **Single Source of Truth** for AI coding agents operating in this repository. 

Whenever you are tasked with extending functionality, squashing bugs, optimizing performance, or performing visual audits:
1. Adhere strictly to the **4 Non-Negotiable Directives**.
2. Preserve all **Backend-Frontend IPC Invariants**.
3. Respect the **Stability & Performance Invariants** (zero heap allocation hot-paths, offscreen canvas caches, backpressure drains).
4. Run `npm test` and `npm run build` to verify that all 60 Vitest tests pass without regressions before completing your turn.

---

## ⚡ The 4 Non-Negotiable Directives

Before modifying or adding code, any agent MUST adhere to these 4 foundational rules:

1. **Absolute Zero-Telemetry & 100% Offline Guarantee**:
   - **NEVER** introduce external analytics, tracking pixels, telemetry, cloud logging, Sentry, Mixpanel, or phone-home network calls.
   - All audio DSP algorithms, canvas compositing, FFmpeg transcoding, and machine-learning models (e.g., Whisper) must run entirely on the local client machine without internet access.
   - Any PR or code change introducing network egress or cloud dependencies will be rejected immediately.

2. **Decoupled Architecture**:
   - **Math & DSP** belong in `src/engine/` (pure TypeScript, functional or class-based, testable in Node/Vitest).
   - **UI & Presentation** belong in `src/components/` (React 19, Tailwind CSS v3, Phosphor Icons).
   - **Desktop Interop** belongs in `electron/` (`main.ts` and `preload.ts` via Context Isolation).
   - **Shared Contracts** belong in `src/types/studio.ts`.

3. **Multi-Platform Native Fidelity (macOS, Windows, Linux)**:
   - Accommodate platform-specific chrome (e.g., macOS custom traffic light padding, Windows custom titlebar, Linux window controls).
   - Use safe cross-platform path resolution via `path.join` and avoid platform-exclusive shell assumptions.
   - Support both Dark Mode (`dark:` classes) and Light Mode (`light:` / default classes) seamlessly.

4. **Test-Driven Verification**:
   - Always run `npm test` before concluding any turn.
   - All 60 Vitest unit and integration tests across 12 suites must pass.
   - When introducing new audio logic or export options, write corresponding tests in `tests/`.

---

## 📂 Codebase Anatomy & Directory Map

```
├── electron/
│   ├── main.ts             # Electron main process (IPC handlers, FFmpeg streaming, window lifecycle)
│   ├── preload.ts          # Context-isolated secure IPC bridge (`window.electronAPI`)
│   ├── exporter.ts         # Native FFmpeg child_process spawn, backpressure drain, muxing
│   └── tsconfig.json
├── src/
│   ├── assets/             # Demo audio, photos & local static typography fonts
│   ├── components/         # React 19 presentation layer
│   │   ├── App.tsx         # Main layout, 2-row tab deck, sequence state, theme switcher
│   │   ├── CanvasStage.tsx # 60 FPS Canvas preview, aspect ratios, scrubber, safe zones
│   │   ├── SafeZoneOverlay.tsx # Translucent Instagram Reels & TikTok safe zone guides
│   │   ├── MediaDropzone.tsx # Multi-track audio & photo ingestion dropzone
│   │   ├── VisualizerPanel.tsx # 8 visualizer styles, multi-stop gradients, stroke controls
│   │   ├── FrameTemplatePanel.tsx # Polaroid, Photostrip, Vinyl & Haute-Couture frames
│   │   ├── MotionBackgroundPanel.tsx # Procedural candlelight bokeh, film dust & grain shaders
│   │   ├── TypographyPanel.tsx # Couple names, date, cursive typography & live font loader
│   │   ├── SubtitlePanel.tsx # Offline Whisper SRT/VTT captions, word timing editor
│   │   ├── QrWatermarkPanel.tsx # Offline scannable audio gallery QR code watermark
│   │   ├── AudioToolsPanel.tsx # Voice Boost auto-gain, 80Hz clarifier, noise gate, trimmers
│   │   ├── ExportModal.tsx # Single MP4 & Batch SD Card queue progress dialog
│   │   └── ExitModal.tsx   # Safe session close dialog with active export warning
│   ├── engine/             # Core computational & DSP engines
│   │   ├── audioEngine.ts  # Web Audio API playback, AnalyserNode, offline FFT peaks
│   │   ├── audioConcatenator.ts # Multi-track timeline sequencing & WAV binary encoder
│   │   ├── audioDenoise.ts # Dynamic range compression, 80Hz high-pass & noise gate
│   │   ├── batchExporter.ts # Multi-item FIFO queue orchestrator with memory isolation
│   │   ├── fft.ts          # Cooley-Tukey Radix-2 FFT with Hann windowing
│   │   ├── frameGenerator.ts # Unified export dispatcher (WebCodecs vs FFmpeg pipe)
│   │   ├── qrGenerator.ts  # Offline vector & canvas QR code generation
│   │   ├── subtitleEngine.ts # SRT/VTT parsing & sub-millisecond word alignment
│   │   ├── videoExporter.ts # Native FFmpeg pipe with auto-directory creation
│   │   ├── webCodecsExporter.ts # Hardware-accelerated VideoEncoder (mp4-muxer)
│   │   └── visualizers/
│   │       ├── frames.ts   # Procedural canvas frame layouts (Polaroid, Strip, Vinyl)
│   │       ├── motionBackground.ts # Procedural 60 FPS motion shaders & video loops
│   │       ├── renderer.ts # Canvas compositor (background + frames + waves + text)
│   │       ├── styles.ts   # Mathematical renderers for all 8 visualizer modes
│   │       └── subtitleRenderer.ts # Karaoke word-by-word highlighted canvas compositor
│   └── types/
│       ├── electron.d.ts   # Global window.electronAPI TypeScript declarations
│       └── studio.ts       # Central interfaces, presets & configuration schemas
├── tests/                  # 12 Vitest unit & integration test suites (60 tests)
├── AGENTS.md               # This agent instruction manual
├── CONTRIBUTING.md         # Open-source contributor guide
├── ROADMAP.md              # Feature specifications & technical architectural notes
└── README.md               # Primary project documentation
```

---

## ✅ What Was Done (Completed Architecture & Features)

All **10 Core Roadmap Features** plus a major **Studio UI/UX System Redesign** have been fully implemented, rigorously tested, and merged into `main`:

### 1. The 10 Completed Roadmap Features
1. **Batch Export Mode (SD Card Processor)** (`src/engine/batchExporter.ts`, `tests/batchExporter.test.ts`):
   - Multi-file FIFO queue manager processing 50–100+ voicemails sequentially.
   - Memory isolation: concurrency = 1 ensures GPU/CPU memory never accumulates.
   - Auto-skips unreadable or corrupted files with clear error reporting without aborting the queue.
2. **Aspect Ratio Presets & Social Safe Zones** (`src/components/SafeZoneOverlay.tsx`, `src/components/CanvasStage.tsx`):
   - Presets: `9:16` (Story/Reels 1080x1920), `4:5` (Social Feed 1080x1350), `1:1` (Square 1080x1080), `16:9` (Cinema Landscape 1920x1080).
   - Viewfinder toggle for Instagram Reels & TikTok right-side action buttons and bottom caption margins (preview-only DOM layer; never burned into video).
3. **Audio Noise Cleanup & Speech Clarifier** (`src/engine/audioDenoise.ts`, `src/components/AudioToolsPanel.tsx`):
   - Multi-stage local DSP: 80Hz high-pass filter (cuts handling rumble and 50/60Hz AC electrical hum).
   - Dynamic noise gate with hysteresis (zeroes out silent pauses between spoken words).
   - Voice clarity presence boost at 2.5kHz–3.5kHz.
4. **Transparent Alpha Video Export (WebM / Apple ProRes 4444)** (`src/engine/frameGenerator.ts`, `electron/main.ts`):
   - Supports genuine alpha channel export for NLE compositing in DaVinci Resolve, Final Cut Pro, and Adobe Premiere.
   - ProRes 4444: `-c:v prores_ks -profile:v 4 -pix_fmt yuva444p10le`.
   - WebM Alpha: `-c:v libvpx-vp9 -pix_fmt yuva420p`.
5. **Silence Trimmer & Outgoing Greeting Prepend** (`src/engine/audioConcatenator.ts`):
   - RMS boundary scanning (`detectSpeechBoundaries`) accurately detects speech start/end points.
   - Prepend outgoing greeting audio with synthesized 800Hz telephone beep before guest recordings.
6. **Polaroid & Retro Photo Collage Templates** (`src/engine/visualizers/frames.ts`, `src/components/FrameTemplatePanel.tsx`):
   - 4 procedural frame templates: Haute Couture (borderless full-bleed), Vintage Polaroid (paper card, 3D shadow, cursive handwriting chin note), Photo Booth Strip (3 vertical cells), Vinyl Record Sleeve (spinning grooves at 33 RPM).
   - Photo color grading filters: Natural, Warm Glow, B&W Monochrome, Vintage Sepia.
7. **Looping Video & Animated B-Roll Backgrounds** (`src/engine/visualizers/motionBackground.ts`, `src/components/MotionBackgroundPanel.tsx`):
   - 100% offline procedural motion shaders: Candlelight Bokeh, Vintage 8mm Film Dust & Grain, Stardust Sparkle.
   - Video Background Loop: Seeks and draws live `.mp4`, `.mov`, `.webm` frames in lockstep with the frame clock during export.
8. **Local AI Speech-to-Text Subtitles (Whisper Offline)** (`src/engine/subtitleEngine.ts`, `src/engine/visualizers/subtitleRenderer.ts`):
   - Parses SubRip (`.srt`), WebVTT (`.vtt`), and Whisper structured JSON word timestamp outputs.
   - 4 caption styles: Karaoke Gold (spoke word illuminated with gold glow), Minimalist Pill (frosted glass), Classic Serif (Cormorant Garamond), Cinematic Caps.
9. **Fine-Grained Waveform Styling & Gradients** (`src/engine/visualizers/styles.ts`, `src/components/VisualizerPanel.tsx`):
   - Multi-stop cinematic gradients: Rose Gold Shimmer, Champagne Silk, Tuscan Sunset, Velvet Emerald, Minimalist Platinum.
   - Customizable stroke weights (`0.5x` to `3.0x`), line caps (Round, Butt, Square), and particle physics densities.
10. **Dynamic QR Code Gallery Watermark** (`src/engine/qrGenerator.ts`, `src/components/QrWatermarkPanel.tsx`):
    - Offline vector & canvas QR code generator linking directly to online audio galleries or booking pages.
    - Customizable placement (Top-Right, Bottom-Right, Bottom-Left), opacity, and size.

### 2. Studio UI/UX System Redesign
- **2-Row Segmented Tab Deck**:
  - Row 1: Visual & Scene Effects (`Visualizer`, `Frames`, `Motion`).
  - Row 2: Editorial & Sound Processing (`Titles`, `Captions`, `QR Code`, `Audio`).
  - 100% visible layout: zero truncation, zero horizontal scrollbar overflow.
- **Collapsible Step-by-Step 1-2-3 Navigation**:
  - Step 1: *Audio Timeline* (multi-file ingestion, track division markers, inter-track silence gap).
  - Step 2: *Canvas Background* (Photo, Solid, Alpha transparent mode chips).
  - Step 3: *Visualizer & Waveform Styling* (8 styles, gradients, dynamics & glow).
  - Individual compact/unpack buttons + master "Compact All" / "Unpack All" header toolbar.
- **Standardized Amber-500 Design Language**:
  - All icons across all 7 panels and modals strictly use `text-amber-500`.
  - All range sliders standardized to `accent-amber-500 cursor-pointer h-1.5`.
  - All toggle switches unified to `bg-amber-500` active background.
- **Draggable Studio Controls Resizer**:
  - Split-pane layout with custom draggable divider (`w-2 cursor-col-resize`) allowing flexible stage vs controls width adjustment.
- **Session Protection Exit Dialog** (`ExitModal.tsx`):
  - Intercepts accidental window close events when audio tracks are queued or when 1080p video compilation is actively in progress.

---

## 🔌 Backend-Frontend IPC Contract Verification Protocol

When building, fixing, or extending features across the Electron bridge (`electron/main.ts`, `electron/preload.ts`, `electron/exporter.ts`) and the frontend presentation / DSP layer (`src/App.tsx`, `src/engine/`), all AI agents MUST adhere to these 5 invariant directives:

1. **Hardware WebCodecs vs. Native FFmpeg Routing (Alpha Channel Invariant)**:
   - Chromium WebCodecs `VideoEncoder` (`mp4-muxer`) is strictly H.264 AVC (opaque pixels only).
   - Any export involving alpha transparency (`config.backgroundMode === 'transparent'`, Apple ProRes 4444 `.mov`, or Google WebM `.webm`) **MUST bypass WebCodecs** and route to `runFfmpegPipeExport` via the lossless PNG streaming pipe (`-vcodec png`).
   - Never attempt to force alpha into `mp4-muxer` as it will fail or output corrupt opaque frames.

2. **Master Timeline Audio Offset Normalization (Double-Trim Guard)**:
   - When the user trims the timeline (`trimStart` / `trimEnd`) and exports a continuous master video, `audioEngine.getMasterWavBytes(trimStart, trimEnd)` produces an already normalized WAV file (`wedding_sequence_*.wav`) starting at `00:00.000`.
   - Any downstream call to `startExport` with this pre-trimmed master file **MUST pass `trimStart: 0`** to FFmpeg. Passing the original `trimStart` causes FFmpeg to apply `-ss trimStart` a second time, erroneously cutting off the guest's speech.

3. **Container-Aware Audio Multiplexing & Lossless Trimming**:
   - In `electron/main.ts` and `electron/exporter.ts` (`export:muxVideoAndAudio` / `VideoExporter.buildMuxArgs`), never apply MP4-specific flags like `-movflags +faststart` or AAC audio (`-c:a aac`) to Matroska/WebM containers (`.webm`).
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

## ⚡ Stability, Performance & Memory Directives

To guarantee that the desktop app runs silky smooth (60 FPS preview, 200+ FPS export) even during multi-hour wedding timeline processing:

1. **Zero Heap Allocations in Hot Paths**:
   - In `src/engine/audioEngine.ts`: `getOfflineFrameData` reuses a pre-allocated scratch buffer `scratchRawTimeSlice = new Float32Array(512)` instead of creating new arrays on every frame.
   - In `src/engine/visualizers/renderer.ts`: Render loops avoid instantiating temporary objects, arrays, or regexes during canvas frame drawing.
2. **Static Background Offscreen Canvas Caching**:
   - In `src/engine/frameGenerator.ts`: Call `createStaticBackgroundCache(width, height, bgImage, config)` before rendering export frames. Draw the static backdrop once to an offscreen cache canvas; copy it per frame via `ctx.drawImage(staticCache, 0, 0)` rather than re-computing gradients, vignettes, and photo scales on all 3,000+ frames.
3. **FFmpeg Pipe Backpressure Drain Management**:
   - When streaming raw frames to FFmpeg through Electron IPC, listen for `export:drain`. If FFmpeg's OS stdin buffer is saturated, pause the frontend frame generator until `drain` fires to prevent unbounded memory growth.
4. **Lifecycle & Resource Cleanup**:
   - All `requestAnimationFrame` loops must be cancelled when components unmount or when `isPlaying` flips to false.
   - In `CanvasStage.tsx`, monitor `document.hidden` via `visibilitychange` to pause rendering when the app is minimized or hidden behind another window.
   - Revoke temporary Object URLs created for dropped media via `URL.revokeObjectURL(...)` when new files are loaded.

---

## 🚀 What Needs to Be Done (Next Milestones & Future Opportunities)

While the core 10 roadmap features and UI system are complete, the following technical milestones represent high-value future enhancements:

1. **WebGPU Local Whisper WASM Model Runner**:
   - Embed lightweight Whisper-tiny ONNX directly via `@xenova/transformers` with WebGPU acceleration for 100% offline, zero-setup auto-transcription without requiring an external SRT/VTT file import.
2. **Multi-Track Drag & Drop Reordering**:
   - Implement visual drag handles in `MediaDropzone.tsx` tracklist so users can reorder voicemails in the sequence before exporting.
3. **Mounted SD Card Auto-Detection**:
   - In `electron/main.ts`, add optional detection for newly mounted external volumes containing audio folders (e.g., standard audio guestbook directory structures) with a one-click "Import SD Card" notification.
4. **Preset Customizer & Disk Persistence**:
   - Allow users to save and name their own custom theme presets (fonts, colors, visualizer style, frame template) to a local JSON configuration file.
5. **Cross-Platform Release CI/CD Matrix**:
   - Add GitHub Actions workflow generating release artifacts (`.dmg` for macOS Apple Silicon & Intel, `.exe` NSIS installer for Windows 10/11, `.AppImage` / `.deb` for Linux).
6. **Ultra-Long Timeline Stress Testing**:
   - Profile performance on 2+ hour full wedding recordings with 200+ tracks to verify uninterrupted memory stability during massive batch exports.

---

## 🧪 Verification & Release Workflow

Every AI agent completing a task MUST run:

```bash
# 1. Run full Vitest suite (all 60 unit & integration tests must pass)
npm test

# 2. Verify TypeScript types and build production bundles
npm run build

# 3. Check git status for unintended artifacts
git status
```

If tests fail, diagnose and fix the root cause before completing your turn. Do not ignore failing tests or disable tests without explicit user instructions.
