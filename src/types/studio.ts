export type VisualizerStyle =
  | 'bars'
  | 'wave'
  | 'ring'
  | 'mirror'
  | 'particles'
  | 'line_wave'
  | 'line_mirror'
  | 'line_horizon';

export type FrameTemplate = 'haute-couture' | 'polaroid' | 'photostrip' | 'vinyl';

export type PhotoFilter = 'none' | 'vintage-warm' | 'black-and-white' | 'sepia';

export interface FrameConfig {
  template: FrameTemplate;
  tiltAngle: number; // e.g. -2 to +2 degrees
  showChinText: boolean;
  chinText?: string;
  photoFilter: PhotoFilter;
  borderWidth?: number; // scale multiplier e.g. 1.0
}

export const DEFAULT_FRAME_CONFIG: FrameConfig = {
  template: 'haute-couture',
  tiltAngle: -1.2,
  showChinText: true,
  chinText: '',
  photoFilter: 'none',
  borderWidth: 1.0,
};

export interface FrameTemplateOption {
  id: FrameTemplate;
  name: string;
  subtitle: string;
  description: string;
}

export const FRAME_TEMPLATE_OPTIONS: FrameTemplateOption[] = [
  {
    id: 'haute-couture',
    name: 'Haute Couture',
    subtitle: 'Cinematic Full Bleed',
    description: 'Borderless high-fashion layout with dark ambient radial vignette and timeless gold typography.',
  },
  {
    id: 'polaroid',
    name: 'Vintage Polaroid',
    subtitle: 'Classic Instant Print',
    description: 'Tactile off-white paper snapshot with organic physical tilt, soft 3D shadow, and handwritten ink chin notes.',
  },
  {
    id: 'photostrip',
    name: 'Photo Booth Strip',
    subtitle: 'Retro 3-Shot Strip',
    description: 'Nostalgic vertical photo booth strip layout displaying 3 sequential wedding moments alongside the sound wave.',
  },
  {
    id: 'vinyl',
    name: 'Vinyl Record Sleeve',
    subtitle: '12" Album Jacket',
    description: 'Spun glossy vinyl record peeking out from the album jacket cover with rotating grooves and center record label.',
  },
];

export type MotionShaderPreset = 'none' | 'candlelight-bokeh' | 'vintage-film-dust' | 'stardust-drift';

export interface MotionBackgroundConfig {
  preset: MotionShaderPreset;
  speed: number; // 0.2 to 2.0, default 1.0
  intensity: number; // 0.1 to 1.0, default 0.8
  videoUrl?: string | null;
  videoDuration?: number;
}

export const DEFAULT_MOTION_CONFIG: MotionBackgroundConfig = {
  preset: 'none',
  speed: 1.0,
  intensity: 0.8,
  videoUrl: null,
  videoDuration: 0,
};

export interface MotionShaderOption {
  id: MotionShaderPreset;
  name: string;
  subtitle: string;
  description: string;
}

export const MOTION_SHADER_OPTIONS: MotionShaderOption[] = [
  {
    id: 'none',
    name: 'Static / Off',
    subtitle: 'Zero motion',
    description: 'Crisp static background photo or solid luxury backdrop.',
  },
  {
    id: 'candlelight-bokeh',
    name: 'Candlelight Bokeh',
    subtitle: 'Warm Romantic Orbs',
    description: 'Soft out-of-focus amber light spheres drifting upwards with gentle organic luminescence.',
  },
  {
    id: 'vintage-film-dust',
    name: '8mm Film Dust & Grain',
    subtitle: 'Nostalgic Super-8',
    description: 'Procedural analog celluloid film dust specks, micro-scratches, and vintage grain.',
  },
  {
    id: 'stardust-drift',
    name: 'Stardust Sparkle',
    subtitle: 'Floating Golden Dust',
    description: 'Ethereal micro-particles shimmering in 3D parallax space in sync with the audio playback.',
  },
];

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

export interface GradientStop {
  offset: number;
  color: string;
}

export interface GradientPreset {
  id: string;
  name: string;
  stops: GradientStop[];
  previewCss: string;
}

export const GRADIENT_PRESETS: GradientPreset[] = [
  {
    id: 'rose-gold',
    name: 'Rose Gold Shimmer',
    stops: [
      { offset: 0, color: '#fbcfe8' },
      { offset: 0.5, color: '#e8a598' },
      { offset: 1, color: '#f43f5e' },
    ],
    previewCss: 'linear-gradient(135deg, #fbcfe8, #e8a598, #f43f5e)',
  },
  {
    id: 'champagne-silk',
    name: 'Champagne Silk',
    stops: [
      { offset: 0, color: '#fef08a' },
      { offset: 0.5, color: '#d7ba7e' },
      { offset: 1, color: '#b45309' },
    ],
    previewCss: 'linear-gradient(135deg, #fef08a, #d7ba7e, #b45309)',
  },
  {
    id: 'tuscan-sunset',
    name: 'Tuscan Sunset',
    stops: [
      { offset: 0, color: '#fed7aa' },
      { offset: 0.5, color: '#fb923c' },
      { offset: 1, color: '#e11d48' },
    ],
    previewCss: 'linear-gradient(135deg, #fed7aa, #fb923c, #e11d48)',
  },
  {
    id: 'velvet-emerald',
    name: 'Velvet Emerald',
    stops: [
      { offset: 0, color: '#a7f3d0' },
      { offset: 0.5, color: '#10b981' },
      { offset: 1, color: '#064e3b' },
    ],
    previewCss: 'linear-gradient(135deg, #a7f3d0, #10b981, #064e3b)',
  },
  {
    id: 'minimalist-platinum',
    name: 'Minimalist Platinum',
    stops: [
      { offset: 0, color: '#ffffff' },
      { offset: 0.5, color: '#cbd5e1' },
      { offset: 1, color: '#64748b' },
    ],
    previewCss: 'linear-gradient(135deg, #ffffff, #cbd5e1, #64748b)',
  },
];

export type QrPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface QrWatermarkConfig {
  enabled: boolean;
  url: string;
  position: QrPosition;
  opacity: number; // 0.1 to 1.0
  label: string; // e.g. 'Scan to Listen'
  size: number; // base size (e.g. 100 to 200, default 130)
}

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
  speechClarifier?: boolean;
  clarifierSensitivity?: number;
  noiseGateThresholdDb?: number;
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

export interface BatchExportJob {
  fileId: string;
  fileName: string;
  inputPath: string;
  outputPath: string;
  status: 'idle' | 'rendering' | 'done' | 'error';
  progress: number;
  error?: string;
  duration?: number;
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
  gradientPreset?: string | null;
  strokeWidth?: number;
  lineCap?: 'round' | 'butt' | 'square';
  particleDensity?: number;
  frame: FrameConfig;
  motion: MotionBackgroundConfig;
  qrWatermark: QrWatermarkConfig;
  typography: TypographyConfig;
  audioSettings: AudioSettings;
  audioPath: string | null;
  audioName: string | null;
  audioDuration: number;
  imagePath: string | null;
  backgroundMode?: 'photo' | 'solid' | 'transparent';
  exportFormat?: 'mp4' | 'prores' | 'webm';
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
