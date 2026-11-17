export type VisualizerStyle =
  | 'bars'
  | 'wave'
  | 'ring'
  | 'mirror'
  | 'particles'
  | 'line_wave'
  | 'line_mirror'
  | 'line_horizon';

export type AspectRatioPreset = '9:16' | '4:5' | '1:1' | '16:9';

export type SafeZoneMode = 'off' | 'reels' | 'tiktok' | 'combined';

export interface AspectRatioDetails {
  id: AspectRatioPreset;
  label: string;
  width: number;
  height: number;
  subtitle: string;
}

export const ASPECT_RATIOS: Record<AspectRatioPreset, AspectRatioDetails> = {
  '9:16': { id: '9:16', label: 'Story / Reel', width: 1080, height: 1920, subtitle: '9:16 Mobile Vertical' },
  '4:5': { id: '4:5', label: 'Portrait Feed', width: 1080, height: 1350, subtitle: '4:5 Social Feed' },
  '1:1': { id: '1:1', label: 'Square Post', width: 1080, height: 1080, subtitle: '1:1 Instagram Square' },
  '16:9': { id: '16:9', label: 'Landscape', width: 1920, height: 1080, subtitle: '16:9 Widescreen / TV' },
};

export interface VisualizerPreset {
  id: VisualizerStyle;
  name: string;
  description: string;
}

export const VISUALIZER_PRESETS: VisualizerPreset[] = [
  { id: 'line_wave', name: 'Classic Hairline Wave', description: 'Delicate single continuous audio wave with soft gold glow' },
  { id: 'line_mirror', name: 'Mirrored Center Line', description: 'Fine frequency hairlines extending above & below center axis' },
  { id: 'line_horizon', name: 'Clean Pulse Horizon', description: 'Minimalist straight line with central voice pulse vibrations' },
  { id: 'bars', name: 'Voice Memo Bars', description: 'Smooth rounded bars pulsing from the center' },
  { id: 'wave', name: 'Sine Ribbon', description: 'Flowing romantic waves with soft ambient glow' },
  { id: 'ring', name: 'Circular Halo', description: 'Center radiating ring reacting to voice frequencies' },
  { id: 'mirror', name: 'Symmetrical Wave', description: 'Mirrored frequency bars reflecting top & bottom' },
  { id: 'particles', name: 'Stardust Spark', description: 'Floating shimmering particles reacting to sound' },
];

export interface ColorOption {
  name: string;
  hex: string;
}

export const COLOR_OPTIONS: ColorOption[] = [
  { name: 'Champagne Gold', hex: '#d7ba7e' },
  { name: 'Ivory White', hex: '#ffffff' },
  { name: 'Rose Gold', hex: '#e8a598' },
  { name: 'Warm Cream', hex: '#fdf3de' },
  { name: 'Pure Platinum', hex: '#e2e8f0' },
];

export interface TypographyConfig {
  enabled: boolean;
  coupleNames: string;
  dateText: string;
  titleText: string;
  fontFamily: 'Cinzel' | 'Italiana' | 'Cormorant Garamond' | 'Playfair Display' | 'Plus Jakarta Sans';
  showTimer: boolean;
  fontSize: number; // 1 = normal, 1.2 = large, etc.
}

export interface AudioSettings {
  trimStart: number;
  trimEnd: number;
  voiceBoost: boolean;
}

export interface BatchItem {
  id: string;
  name: string;
  path: string;
  status: 'idle' | 'rendering' | 'done' | 'error';
  progress?: number;
  error?: string;
  outputPath?: string;
}

export interface TimelineTrack {
  id: string;
  name: string;
  path: string;
  duration: number;
  startTime: number;
  endTime: number;
}

export interface StudioConfig {
  aspectRatio: AspectRatioPreset;
  visualizerStyle: VisualizerStyle;
  visualizerColor: string;
  visualizerScale: number;
  visualizerOpacity: number;
  visualizerGlow: boolean;
  typography: TypographyConfig;
  audioSettings: AudioSettings;
  audioPath: string | null;
  audioName: string | null;
  audioDuration: number;
  imagePath: string | null;
  batchQueue: BatchItem[];
  timelineTracks: TimelineTrack[];
  gapBetweenTracks: number;
  theme?: 'dark' | 'light';
}

export interface ExportProgress {
  status: 'idle' | 'preparing' | 'rendering' | 'muxing' | 'completed' | 'error';
  currentFrame?: number;
  totalFrames?: number;
  percentage: number;
  currentItemName?: string;
  outputFilePath?: string;
  error?: string;
}
