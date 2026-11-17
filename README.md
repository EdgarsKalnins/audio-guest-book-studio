# Wedding Audio Studio 💍🎙️

An elegant desktop application designed for wedding couples, photographers, and audio guestbook rental services. It effortlessly transforms wedding guest voice recordings into stunning 1080p MP4 videos with centered real-time audio visualizers, background photos, and luxury wedding typography.

---

## ✨ Features

- **Drag-and-Drop Workflow**: Drop any guest audio file (`.wav`, `.mp3`, `.m4a`, `.aac`, `.ogg`) and wedding photo (`.jpg`, `.png`, `.webp`) directly into the app.
- **5 Centered Wedding Visualizers**:
  1. *Voice Memo Bars*: Symmetrical rounded bars pulsing smoothly from the center.
  2. *Sine Ribbon*: Fluid romantic dual-layer sound waves with ambient glow.
  3. *Circular Halo*: Radiating circular pulse ring reacting to voice harmonics.
  4. *Symmetrical Wave*: Mirrored frequency bars reflecting above and below the center line.
  5. *Stardust Spark*: Ambient floating particles dancing to audio frequencies.
- **Wedding Color Palette**: Champagne Gold, Ivory White, Rose Gold, Warm Cream, Pure Platinum, or custom hex color picker.
- **Aspect Ratio Presets**:
  - `9:16 Story / Reel` (1080x1920) for Instagram Stories, Reels, TikTok, and smartphones.
  - `1:1 Square` (1080x1080) for Instagram posts.
  - `16:9 Landscape` (1920x1080) for widescreen wedding films and TV playback.
  - *Auto-Detection*: Automatically detects and matches the aspect ratio of dropped photos.
- **Wedding Typography**:
  - Customizable Couple Names, Wedding Date, and Header Title.
  - Classic serif fonts: *Cormorant Garamond* and *Playfair Display*.
  - Optional audio timestamp counter (`0:42 / 2:15`) with subtle progress bar.
- **Voice Clean-Up & Trimmer**:
  - *Voice Boost (Auto-Gain)*: Automatically boosts and normalizes quiet guest whispers and messages.
  - *Waveform Trimmer*: Cut out telephone pickup clicks, dead silence, or hang-up sounds.
- **Multi-File Batch Export Queue**:
  - Drop a folder or multiple guest audio files (e.g. 50 voicemail files).
  - Batch compile all recordings sequentially using the same template into an output folder.
- **Zero-Setup Bundled FFmpeg**:
  - Compiles crisp 1080p @ 30 FPS MP4 video using bundled hardware-accelerated FFmpeg. No terminal or command-line setup required.
- **Instant Demo Mode**: Includes pre-loaded wedding voicemail and background image for immediate testing on first launch.

---

## 🚀 Quick Start

### 1. Launch in Development Mode
```bash
npm run dev
```
This automatically boots Vite, compiles the Electron main process and preload scripts, and opens the desktop studio window with hot module replacement.

### 2. Build Packaged Executable
```bash
# Build web & electron assets
npm run build

# Package into macOS .dmg / .app
npm run build:app
```

---

## 🛠️ Tech Stack
- **Desktop Framework**: Electron v33+ (Secure Context Isolation)
- **Frontend UI**: React 19, TypeScript, Tailwind CSS, Lucide Icons
- **Audio Processing**: Web Audio API (`AudioContext`, `AnalyserNode`, Cooley-Tukey Radix-2 FFT)
- **Video Encoding**: Frame-by-frame HTML5 Canvas rendering piped to `@ffmpeg-installer/ffmpeg` H.264/AAC muxer.
