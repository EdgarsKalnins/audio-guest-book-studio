# Audio Guest Book Studio 💍🎙️

> **An elegant, private, open-source desktop application that turns vintage audio guestbook voicemails and wedding recordings into cinematic 1080p MP4 videos with centered real-time audio visualizers, background photos, and haute-couture typography.**
>
> *Created & maintained by **[Edgars Kalniņš](https://github.com/EdgarsKalnins)**, founder of **[Momentbox.lv](https://momentbox.lv)** — premium photo booth, 360 video spinner, and vintage audio guestbook rental service based in Riga, Latvia.*

[![GitHub Profile](https://img.shields.io/badge/GitHub-EdgarsKalnins-181717.svg?logo=github)](https://github.com/EdgarsKalnins)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Zero Telemetry](https://img.shields.io/badge/Privacy-100%25%20Local%20%7C%20Zero%20Telemetry-emerald.svg)](#-privacy--zero-telemetry-pledge)
[![Roadmap: 100% Completed](https://img.shields.io/badge/Roadmap-10%20of%2010%20Features%20Completed-emerald.svg)](ROADMAP.md)
[![Agent Handbook](https://img.shields.io/badge/AI%20Agents-Ready%20%7C%20AGENTS.md-purple.svg)](AGENTS.md)
[![Cross Platform](https://img.shields.io/badge/Platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey.svg)](#-platform-support)
[![React 19](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6.svg)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6.0-646cff.svg)](https://vitejs.dev)

---

## 🤖 Ask an AI Agent to Run This Project

Working with an AI coding agent (**Claude Code**, **Cursor**, **Codex**, **Windsurf**, **Antigravity**, **OpenCode**, or **Gemini CLI**)? You can hand this repository directly to your agent to run, test, and develop.

### Copy & Paste Prompt for Your Agent:

```markdown
Clone https://github.com/EdgarsKalnins/audio-guest-book-studio.git, install dependencies using `npm install`, verify the test suite with `npm test`, compile the TypeScript bundle via `npm run build`, and launch the development studio with `npm run dev`.
```

### Agent Quick-Start Instructions:

```bash
# 1. Clone repository from GitHub
git clone https://github.com/EdgarsKalnins/audio-guest-book-studio.git
cd audio-guest-book-studio

# 2. Install dependencies
npm install

# 3. Run automated test suite (60 unit & integration tests across 12 suites)
npm test

# 4. Compile production bundles
npm run build

# 5. Launch development server & Electron studio
npm run dev
```

### Key Technical Context for Agents:
- **Stack**: React 19, TypeScript 5.6, Vite 6, Tailwind CSS v3 (`darkMode: 'class'`), `@phosphor-icons/react`.
- **Desktop Runtime**: Electron 33 with secure Context Isolation (`electron/main.ts`, `electron/preload.ts`).
- **Core Engine Modules**:
  - Web Audio player & dynamic range compressor: [`src/engine/audioEngine.ts`](file:///Users/edgarskalnins/Desktop/Wedding%20Audio%20Studio/src/engine/audioEngine.ts)
  - Multi-track timeline sequencing: [`src/engine/audioConcatenator.ts`](file:///Users/edgarskalnins/Desktop/Wedding%20Audio%20Studio/src/engine/audioConcatenator.ts)
  - In-memory Cooley-Tukey Radix-2 FFT: [`src/engine/fft.ts`](file:///Users/edgarskalnins/Desktop/Wedding%20Audio%20Studio/src/engine/fft.ts)
  - Frame rendering orchestrator: [`src/engine/frameGenerator.ts`](file:///Users/edgarskalnins/Desktop/Wedding%20Audio%20Studio/src/engine/frameGenerator.ts)
  - Bundled FFmpeg pipe: [`src/engine/videoExporter.ts`](file:///Users/edgarskalnins/Desktop/Wedding%20Audio%20Studio/src/engine/videoExporter.ts)
  - 8 Visualizer algorithms: [`src/engine/visualizers/styles.ts`](file:///Users/edgarskalnins/Desktop/Wedding%20Audio%20Studio/src/engine/visualizers/styles.ts)
- **Local Dev Server**: Vite runs on `http://localhost:5173/`. Can be tested in any browser or headless automation tool (`ego-browser`, Playwright, Puppeteer).
- **Strict Privacy Requirement**: Zero telemetry, zero analytics, zero external network pings. All processing runs 100% locally.

### 📖 AI Agent & Roadmap References:
- **[AGENTS.md](AGENTS.md)**: AI agent engineering handbook with architecture rules, completed feature audit, and technical horizons.
- **[ROADMAP.md](ROADMAP.md)**: Complete specifications, user stories, acceptance criteria, and post-v1.0 roadmap.

---

## 📸 Screenshots

| Dark Mode (Default) | Light Mode (Day Theme) |
| :---: | :---: |
| ![Dark Mode](preview-dark.png) | ![Light Mode](preview-light.png) |

---

## 🔒 Privacy & Zero-Telemetry Pledge

Wedding and event voicemails are deeply intimate family moments: heartfelt grandparent blessings, tearful parental toasts, and hilarious late-night messages from closest friends.

**Audio Guest Book Studio is built on an absolute local-first architecture:**
- **Zero Cloud Uploads**: Audio, photos, and video compilation never leave your computer.
- **Zero Telemetry & Analytics**: No Google Analytics, no Mixpanel, no Sentry, no phone-home pingbacks, and no user tracking.
- **100% Offline Capability**: Runs entirely without an active internet connection. All font families, icons, and encoder binaries are packaged locally.
- **Open Source Transparency**: Every line of code is open to inspection and audit.

---

## ✨ Key Capabilities

1. **Continuous Multi-Recording Timeline & SD Card Batch Processor**:
   - Drag and drop 1 or 100+ audio recordings (`.wav`, `.mp3`, `.m4a`, `.aac`, `.flac`, `.ogg`, `.aiff`).
   - Automatically sequences all files into **one continuous, seamless video timeline** with configurable micro-gaps (0.5s), avoiding manual stitching in external video editors.
   - **Batch Export Mode**: One-click processor rendering separate individual 1080p MP4 clips for each voicemail in an SD card queue with sequential memory protection.
2. **8 Bespoke Hairline & Organic Visualizers with Multi-Stop Gradients**:
   - **Classic Hairline Wave**: Delicate single continuous audio wave with soft gold luminescence.
   - **Mirrored Hairline Wave**: Elegant symmetrical twin waves reflecting romantic voice vibrations.
   - **Horizon Pulse Line**: Crisp center-weighted audio line reacting to voice intimacy.
   - **Voice Memo Bars**: Centered symmetrical rounded frequency bars.
   - **Sine Ribbon**: Dual-phase flowing organic sound waves.
   - **Orbital Ring**: Radial halo visualizer with circular frequency dispersion.
   - **Dual Mirror Wave**: Symmetrical frequency bars radiating vertically.
   - **Particulate Aura**: Ambient floating stardust dancing to guest speech frequencies.
   - **Multi-Stop Gradients**: Preset swatches (Rose Gold, Champagne, Emerald, Obsidian Monochrome) and custom multi-stop linear/radial gradients.
3. **Haute-Couture Wedding Typography & Retro Photo Templates**:
   - Curated editorial font families: *Italiana*, *Cinzel*, *Cormorant Garamond*, *Playfair Display*, *Plus Jakarta Sans*, and cursive handwriting.
   - Customizable Couple Names, Wedding Date, Subtitle, and digital timestamp counter (`0:42 / 2:15`).
   - **Polaroid Snapshot**: Authentic tilted Polaroid frame with handwritten script couple names on the chin.
   - **Photo Booth Strip**: Vertical 3-photo cell layout mimicking vintage wedding photo booths.
   - **Vinyl Record Sleeve**: Spinning vinyl record disc emerging from a retro record jacket.
4. **Procedural Motion Backgrounds**:
   - Live procedural canvas shaders for **Candlelight Bokeh** (warm floating light orbs), **8mm Film Dust & Scratches** (vintage film grain), and **Romantic Stardust** (twinkling star particles).
5. **Offline AI Speech-to-Text Subtitles (Whisper & Karaoke Highlights)**:
   - 100% local, offline subtitle engine powered by Whisper with zero external API calls.
   - Real-time word-level synchronized karaoke text highlighting in curated serif typography.
6. **Acoustic Voice Clean-Up, Noise Gate & Telephone Speech Clarifier**:
   - **Voice Boost (Auto-Gain)**: Dynamic range compression and high-pass filtering to elevate quiet whispers.
   - **Speech Clarifier**: 80Hz high-pass filter, 50Hz/60Hz line hum notch, dynamic noise gate with hysteresis, and 2.5kHz formant presence boost for vintage rotary phone recordings.
   - **Smart Silence Trimmer & Outgoing Voicemail Prepend**: Detects true voice boundaries and prepends the couple's prompt message with an authentic vintage telephone beep.
7. **Social Aspect Ratios & Safe-Zone Viewfinder**:
   - Native aspect ratios: `9:16` (Story / Reels / Shorts), `16:9` (Cinematic Landscape), `1:1` (Square Feed), and `4:5` (Instagram Portrait).
   - Translucent safe-zone overlay guides for Instagram Reels and TikTok native UI margins.
8. **Dynamic QR Code Gallery Watermark**:
   - Offline scannable QR code watermark linking guests directly to the couple's online audio gallery, with customizable corner placement, scale, and opacity.
9. **Dual High-Speed Compilation Pipeline with Transparent Alpha Channels**:
   - **Native Hardware FFmpeg**: Bundled local FFmpeg pipe (`libx264` @ 30 FPS, AAC 192 kbps) with automated directory creation and stream buffering.
   - **Transparent Alpha Video Export**: Apple ProRes 4444 (`-c:v prores_ks`) and WebM VP9 (`-c:v libvpx-vp9`) with alpha channel for seamless drag-and-drop overlays in Premiere Pro, DaVinci Resolve, and Final Cut Pro.
   - **Client-Side WebCodecs Fallback**: Modern in-browser `VideoEncoder` + `AudioEncoder` piped to `mp4-muxer` for browser previews.
   - **Resource Offloading**: Preview rendering suspends during export to dedicate 100% CPU/GPU resources to video encoding.

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    subgraph Inputs["1. Local Assets (100% Offline / Zero Uploads)"]
        A1["Guest Audio Recordings<br/>(.wav, .mp3, .m4a, .flac)"]
        A2["Wedding Photo Background<br/>(.jpg, .png, .webp)"]
        A3["Outgoing Voicemail Prompt & Beep"]
    end

    subgraph AudioEngine["2. Audio & DSP Subsystem"]
        B1["AudioConcatenator & Silence Trimmer<br/>(Boundary Detection & Micro-Gaps)"]
        B2["AudioDenoise & Speech Clarifier<br/>(Noise Gate, 80Hz Cut, 2.5kHz Boost)"]
        B3["Cooley-Tukey Radix-2 FFT<br/>(Hann Windowed Spectral Analysis)"]
    end

    subgraph Renderer["3. Haute-Couture Canvas Compositor"]
        C1["Background Scaler, Vignette & Motion Shaders<br/>(Candlelight Bokeh, 8mm Film Dust, Stardust)"]
        C2["Frame Templates<br/>(Polaroid Chin, Photo Strip, Vinyl Record)"]
        C3["8 Visualizers & Multi-Stop Gradients<br/>(Rose Gold, Champagne, Emerald)"]
        C4["Wedding Typography & Karaoke Subtitles<br/>(Italiana, Cinzel, Offline Whisper)"]
        C5["Dynamic QR Code Gallery Watermark"]
    end

    subgraph Encoders["4. Compilation & Batch Pipeline"]
        D1["Native FFmpeg Lossless Pipe<br/>(libx264 MP4, ProRes 4444, WebM Alpha)"]
        D2["WebCodecs + mp4-muxer<br/>(Hardware Accelerated In-Browser H.264)"]
        D3["Batch SD Card Queue Manager<br/>(Sequential Isolated Job Processing)"]
    end

    subgraph Output["5. Final Deliverables"]
        E1["1080p MP4 / ProRes 4444 / WebM<br/>(9:16 Reels, 16:9 Landscape, 1:1 Square, 4:5 Portrait)"]
        E2["Batch Folder of Individual Guest Clips"]
    end

    A1 & A3 --> B1
    B1 --> B2
    B2 --> B3
    A2 --> C1
    C1 --> C2
    B3 --> C3
    C2 & C3 & C4 & C5 --> Renderer
    Renderer --> D1
    Renderer --> D2
    D3 --> D1
    D1 --> E1
    D1 --> E2
    D2 --> E1
```

---

## 📂 Source Code & Component Directory

Every module in this project is strictly decoupled, strongly typed, and thoroughly tested:

### 🖥️ User Interface (`src/components/`)
- [`src/App.tsx`](file:///Users/edgarskalnins/Desktop/Wedding%20Audio%20Studio/src/App.tsx): Root layout orchestrator, multi-track sequence state, Day/Night theme synchronization, and titlebar window controls.
- [`src/components/CanvasStage.tsx`](file:///Users/edgarskalnins/Desktop/Wedding%20Audio%20Studio/src/components/CanvasStage.tsx): Real-time 60 FPS HTML5 canvas viewport, aspect ratio selector (`9:16`, `1:1`, `16:9`, `4:5`), drag-and-drop overlay, and interactive audio scrubber.
- [`src/components/SafeZoneOverlay.tsx`](file:///Users/edgarskalnins/Desktop/Wedding%20Audio%20Studio/src/components/SafeZoneOverlay.tsx): Real-time social safe-zone viewfinder overlay for Instagram Reels and TikTok UI margins.
- [`src/components/MediaDropzone.tsx`](file:///Users/edgarskalnins/Desktop/Wedding%20Audio%20Studio/src/components/MediaDropzone.tsx): Drag-and-drop dropzone for audio files and photo backgrounds with quick-start sample loading.
- [`src/components/VisualizerPanel.tsx`](file:///Users/edgarskalnins/Desktop/Wedding%20Audio%20Studio/src/components/VisualizerPanel.tsx): Visualizer preset selector featuring custom hairline vector glyphs for all 8 visualizer modes, multi-stop gradient swatches, glow, and scale sliders.
- [`src/components/TypographyPanel.tsx`](file:///Users/edgarskalnins/Desktop/Wedding%20Audio%20Studio/src/components/TypographyPanel.tsx): Wedding typography overlay configuration supporting couple names, wedding date, title, and 5 curated editorial font families.
- [`src/components/FrameTemplatePanel.tsx`](file:///Users/edgarskalnins/Desktop/Wedding%20Audio%20Studio/src/components/FrameTemplatePanel.tsx): Retro frame selector supporting Polaroid snapshot with handwritten script chin, vertical 3-cell photo strip, and spinning vinyl record sleeve.
- [`src/components/MotionBackgroundPanel.tsx`](file:///Users/edgarskalnins/Desktop/Wedding%20Audio%20Studio/src/components/MotionBackgroundPanel.tsx): Procedural motion effects controller for warm Candlelight Bokeh, vintage 8mm Film Dust & Scratches, and romantic floating Stardust.
- [`src/components/SubtitlePanel.tsx`](file:///Users/edgarskalnins/Desktop/Wedding%20Audio%20Studio/src/components/SubtitlePanel.tsx): Local speech-to-text subtitle configuration, SRT/VTT file import, and synchronized karaoke word highlight toggles.
- [`src/components/QrWatermarkPanel.tsx`](file:///Users/edgarskalnins/Desktop/Wedding%20Audio%20Studio/src/components/QrWatermarkPanel.tsx): Dynamic QR code gallery watermark overlay with corner positioning, live URL input, and opacity controls.
- [`src/components/AudioToolsPanel.tsx`](file:///Users/edgarskalnins/Desktop/Wedding%20Audio%20Studio/src/components/AudioToolsPanel.tsx): Voice Boost auto-gain normalization, speech clarifier filters, and telephone pickup/hangup trim sliders.
- [`src/components/ExportModal.tsx`](file:///Users/edgarskalnins/Desktop/Wedding%20Audio%20Studio/src/components/ExportModal.tsx): 1080p MP4 compilation progress dialog with batch SD card processing, ProRes 4444 / WebM alpha channel toggles, and "Show in Finder / Explorer" action.
- [`src/components/ExitModal.tsx`](file:///Users/edgarskalnins/Desktop/Wedding%20Audio%20Studio/src/components/ExitModal.tsx): Safe session termination modal preventing accidental data loss when timeline recordings or exports are in flight.

### ⚙️ Audio & Rendering Engine (`src/engine/`)
- [`src/engine/audioEngine.ts`](file:///Users/edgarskalnins/Desktop/Wedding%20Audio%20Studio/src/engine/audioEngine.ts): Web Audio API wrapper managing playback state, AnalyserNode frequency extraction, and waveform peak generation.
- [`src/engine/audioConcatenator.ts`](file:///Users/edgarskalnins/Desktop/Wedding%20Audio%20Studio/src/engine/audioConcatenator.ts): Non-destructive multi-recording concatenation combining multiple audio buffers into one continuous stream with smooth inter-track micro-gaps and silence boundary detection.
- [`src/engine/audioDenoise.ts`](file:///Users/edgarskalnins/Desktop/Wedding%20Audio%20Studio/src/engine/audioDenoise.ts): Voice Boost auto-gain DSP filter, 80Hz high-pass filter, line-hum notch, and dynamic noise gate for vintage telephone recordings.
- [`src/engine/batchExporter.ts`](file:///Users/edgarskalnins/Desktop/Wedding%20Audio%20Studio/src/engine/batchExporter.ts): SD card batch queue manager running sequential isolated exports for hundreds of individual guest recordings.
- [`src/engine/fft.ts`](file:///Users/edgarskalnins/Desktop/Wedding%20Audio%20Studio/src/engine/fft.ts): In-memory Cooley-Tukey Radix-2 Fast Fourier Transform with Hann windowing for offline frame-by-frame video generation.
- [`src/engine/frameGenerator.ts`](file:///Users/edgarskalnins/Desktop/Wedding%20Audio%20Studio/src/engine/frameGenerator.ts): Memory-optimized video pipeline orchestrating off-screen canvas rendering, memory garbage collection, and dual encoder selection.
- [`src/engine/videoExporter.ts`](file:///Users/edgarskalnins/Desktop/Wedding%20Audio%20Studio/src/engine/videoExporter.ts): Native Electron FFmpeg pipe with auto-directory creation and stream buffering.
- [`src/engine/qrGenerator.ts`](file:///Users/edgarskalnins/Desktop/Wedding%20Audio%20Studio/src/engine/qrGenerator.ts): Offline QR matrix generator and canvas renderer with high error correction.
- [`src/engine/subtitleEngine.ts`](file:///Users/edgarskalnins/Desktop/Wedding%20Audio%20Studio/src/engine/subtitleEngine.ts): 100% offline Whisper transcription integration and SRT/VTT subtitle parser.
- [`src/engine/visualizers/renderer.ts`](file:///Users/edgarskalnins/Desktop/Wedding%20Audio%20Studio/src/engine/visualizers/renderer.ts): Master canvas frame compositor combining background image cover-scaling, soft ambient vignette, motion shaders, frame templates, audio visualizers, and typography text layers.
- [`src/engine/visualizers/styles.ts`](file:///Users/edgarskalnins/Desktop/Wedding%20Audio%20Studio/src/engine/visualizers/styles.ts): Mathematical drawing algorithms for all 8 visualizer modes with linear and radial gradient support.
- [`src/engine/visualizers/frames.ts`](file:///Users/edgarskalnins/Desktop/Wedding%20Audio%20Studio/src/engine/visualizers/frames.ts): Procedural canvas compositors for Polaroid photo chin with cursive calligraphy, photo booth film strip, and retro vinyl disc.
- [`src/engine/visualizers/motionBackground.ts`](file:///Users/edgarskalnins/Desktop/Wedding%20Audio%20Studio/src/engine/visualizers/motionBackground.ts): Lightweight procedural canvas shaders rendering warm bokeh particles, film grain, and stardust overlays.
- [`src/engine/visualizers/subtitleRenderer.ts`](file:///Users/edgarskalnins/Desktop/Wedding%20Audio%20Studio/src/engine/visualizers/subtitleRenderer.ts): High-fidelity karaoke subtitle canvas compositor with real-time active word highlighting and editorial typography.

### 🔌 Desktop Shell (`electron/`)
- [`electron/main.ts`](file:///Users/edgarskalnins/Desktop/Wedding%20Audio%20Studio/electron/main.ts): Secure Electron main process providing native file dialogues, safe window close interception, asset resolution, and FFmpeg transcoding fallbacks.
- [`electron/preload.ts`](file:///Users/edgarskalnins/Desktop/Wedding%20Audio%20Studio/electron/preload.ts): Context-isolated IPC bridge exposing strictly typed `window.electronAPI` methods to the frontend.
- [`electron/exporter.ts`](file:///Users/edgarskalnins/Desktop/Wedding%20Audio%20Studio/electron/exporter.ts): High-throughput lossless PNG streaming FFmpeg pipeline supporting Apple ProRes 4444 (`-c:v prores_ks`), WebM VP9 with alpha (`-c:v libvpx-vp9`), and H.264 MP4.

---

## 💻 Platform Support

Audio Guest Book Studio is engineered to compile and run smoothly across all major desktop operating systems without platform lock-in:

| Platform | Target Binaries | Architecture | Acceleration |
| :--- | :--- | :--- | :--- |
| **macOS** | `.dmg`, `.zip`, `.app` | Apple Silicon (`arm64`) & Intel (`x64`) | VideoToolbox / H.264 |
| **Windows** | `.exe` (NSIS Installer), Portable | `x64` | NVENC / D3D11VA / H.264 |
| **Linux** | `.AppImage`, `.deb`, `.tar.gz` | `x64`, `arm64` | VAAPI / H.264 |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org) (v18 or higher recommended)
- `npm` (v9 or higher)

### 1. Clone & Install
```bash
git clone https://github.com/EdgarsKalnins/audio-guest-book-studio.git
cd audio-guest-book-studio
npm install
```

### 2. Run in Development Mode
```bash
npm run dev
```
This boots Vite with hot-module replacement and launches the Electron studio window automatically.

### 3. Run Automated Tests
```bash
npm test
```
Runs the full Vitest suite covering audio concatenation, FFT spectrum generation, FFmpeg export pipelines, and modal interactions.

### 4. Build Production Binaries
```bash
# Type check and build frontend + electron scripts
npm run build

# Package desktop installer for current OS
npm run build:app
```
Packaged installers will be saved in the `release/` directory.

---

## 🗺️ Product Roadmap (100% Completed | 10 of 10 Features Shipped)

The open-source evolution of **Audio Guest Book Studio** is driven by real-world wedding events and photo booth operations. **All 10 community-approved roadmap features have been fully implemented, rigorously tested across 59 unit & integration tests, and shipped** (see [ROADMAP.md](ROADMAP.md) for full technical specifications and [AGENTS.md](AGENTS.md) for architectural verification protocols):

| # | Feature | Target User | Highlights | Status |
| :-: | :--- | :--- | :--- | :---: |
| **01** | **Batch Export Mode (SD Card Processor)** | Rental Booths & Photographers | Drop a folder of 50–100 guest `.wav` files and export individual MP4 clips in 1 click | ✅ Completed |
| **02** | **Social Safe-Zone Overlays & Aspect Ratios** | Couples & Social Creators | Instagram Reels & TikTok UI overlay guides; native `9:16`, `16:9`, `1:1`, and `4:5` | ✅ Completed |
| **03** | **Audio Noise Cleanup & Speech Clarifier** | Vintage Telephones | Multi-stage local DSP (80Hz high-pass, line-hum notch, dynamic noise gate, presence boost) | ✅ Completed |
| **04** | **Transparent Alpha Video Export** | Wedding Videographers & Editors | Apple ProRes 4444 & WebM with alpha channel to overlay directly on 4K cinematic films | ✅ Completed |
| **05** | **Silence Trimmer & Outgoing Greeting Prepend** | Rental Operators & Couples | Auto-trim dead air before/after messages; prepend couple's voicemail prompt + vintage beep | ✅ Completed |
| **06** | **Polaroid & Retro Photo Collage Templates** | Vintage Weddings & Events | Tilted Polaroid frame with handwritten script font, photo booth strip, and vinyl record sleeve | ✅ Completed |
| **07** | **Looping Video & Animated B-Roll Backgrounds** | Creators & Reels Marketers | MP4/WebM video background loops (flickering candlelight, bokeh flares, 8mm film grain) | ✅ Completed |
| **08** | **Local AI Speech-to-Text Subtitles (Whisper)** | Couples & Mobile Viewers | 100% offline Whisper transcription; dynamic karaoke-style synchronized subtitles | ✅ Completed |
| **09** | **Fine-Grained Waveform Styling & Gradients** | Designers & Event Stylists | Linear/radial multi-stop color gradients (Rose Gold, Champagne, Emerald), particle physics | ✅ Completed |
| **10** | **Dynamic QR Code Gallery Watermark** | Rental Businesses & Event Hosts | Offline scannable QR code overlay linking guests directly to the couple's online audio gallery | ✅ Completed |

> 💡 **For AI coding agents and human contributors**: To review the full architecture guidelines and IPC contract verification protocols, see [AGENTS.md](AGENTS.md) and [ROADMAP.md](ROADMAP.md).

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Space` | Play / Pause audio playback |
| `Esc` | Dismiss modal / Close active dialog |
| `Cmd + Q` / `Ctrl + Q` | Trigger safe Exit confirmation |

---

## 🤝 Contributing

Contributions from the open-source community are warmly welcomed! Please read our [CONTRIBUTING.md](CONTRIBUTING.md) guide before submitting pull requests.

**Core Rules for Contributors**:
- **Zero Telemetry Policy**: No PR adding external telemetry, tracking, or network telemetry will be accepted.
- **Offline Reliability**: Every new feature must function completely offline.
- **Test Coverage**: All new audio or export pipeline features must include corresponding Vitest tests in `tests/`.

---

## 👨‍💻 Author & Origin Story

**Audio Guest Book Studio** was designed, developed, and open-sourced by **[Edgars Kalniņš](https://github.com/EdgarsKalnins)**, founder of **[Momentbox.lv](https://momentbox.lv)** — Latvia’s leading event entertainment and experiential rental company based in **Riga, Latvia (Rīga, Latvija)**.

### Why this project was created:
At **[Momentbox.lv](https://momentbox.lv)**, we provide vintage audio guestbook telephone rentals, modern photo booths (fotokastes noma), and 360 video spinner platforms for weddings, anniversaries, corporate galas, and celebrations across Latvia and the Baltics. 

Couples and event hosts often receive dozens of raw audio voicemails (`.wav`, `.mp3`) from retro rotary phone guestbooks, but had no simple, private way to turn those audio memories into beautiful, shareable vertical videos (9:16 Instagram Reels, TikToks, YouTube Shorts, and Stories) without recurring cloud subscription fees or uploading personal, emotional guest messages to third-party cloud servers.

**Audio Guest Book Studio** was built to solve this exact challenge: a high-performance, 100% offline, zero-telemetry desktop application that operates entirely on the user's computer, empowering couples, wedding videographers, event rental companies, and photo booth operators worldwide to create studio-quality video keepsakes in seconds.

- 👤 **GitHub**: [https://github.com/EdgarsKalnins](https://github.com/EdgarsKalnins)
- 🌐 **Company Website**: [https://momentbox.lv](https://momentbox.lv)
- 📍 **Headquarters**: Riga, Latvia (Rīga, Latvija)
- 💌 **Specialties**: Photo booth rental (fotokaste), 360 video booth (360 video būda), and vintage telephone audio guestbooks (audio viesu grāmata) for unforgettable events.

---

## 📜 License

Distributed under the permissive **MIT License**. See [LICENSE](LICENSE) for more details.

Built with passion for couples celebrating their love and audio guestbook creators worldwide. 💍🎙️✨
