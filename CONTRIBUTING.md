# Contributing to Wedding Audio Studio 💍🎙️

Thank you for your interest in contributing to Wedding Audio Studio! We welcome community contributions to make this open-source tool the most reliable, private, and beautiful audio guestbook video generator available.

---

## 🔒 Absolute Privacy & Zero-Telemetry Rule

Before submitting code, please note our cardinal project rule:

> **No Telemetry, No Analytics, No External Phone-Home Pings.**

Wedding voicemails are deeply personal and sentimental recordings. Any pull request that introduces:
- Analytics packages (e.g., Google Analytics, Mixpanel, Amplitude, PostHog, Segment)
- Error reporting telemetry (e.g., Sentry, Bugsnag) that phones home to external servers
- Third-party tracking scripts, cookies, or remote beacon pixels
- Mandatory cloud account creation or internet connection checks

**will be immediately closed without merge.** All processing must execute 100% locally on the user's computer.

---

## 🛠️ Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/<your-username>/wedding-audio-studio.git
   cd wedding-audio-studio
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Run the Test Suite**
   ```bash
   npm test
   ```

---

## 📐 Architecture Guidelines

- **Decoupled Engine & UI**: Audio synthesis and video encoding logic belong in `src/engine/`. React components in `src/components/` must remain presentation-focused.
- **Cross-Platform Compatibility**: Do not make assumptions about operating systems. Always test path separators, font availability, and file dialogues on macOS, Windows, and Linux.
- **Strict TypeScript**: Avoid `any`. All props, configurations, and pipeline data structures must be defined in `src/types/studio.ts`.
- **Memory Efficiency**: Off-screen video generation can process hundreds or thousands of frames. Ensure all canvas contexts, audio buffers, and temporary file handles are promptly released.

---

## 🧪 Testing Checklist

Before submitting a Pull Request, please ensure:
1. `npm test` passes 100% cleanly with zero failed test suites.
2. `npm run build` completes without TypeScript or Vite bundling errors.
3. If introducing a new visualizer style:
   - Add its style identifier to `src/types/studio.ts`.
   - Add its mathematical rendering logic in `src/engine/visualizers/styles.ts`.
   - Add its bespoke vector glyph in `src/components/VisualizerPanel.tsx`.
   - Add unit tests verifying its spectrum output in `tests/`.

---

## 📬 Pull Request Guidelines

1. Create a descriptive feature branch:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. Commit your changes with clear, concise messages:
   ```bash
   git commit -m "feat: add orbital particle visualizer variant"
   ```
3. Push to your fork and submit a PR against `main`.
4. Provide a clear description of the problem solved, screenshots of any UI changes (both in Dark Mode and Light Mode), and instructions for manual verification.

Thank you for helping preserve wedding memories with elegance and privacy! ❤️
