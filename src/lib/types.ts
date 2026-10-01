export type AspectRatio = 'free' | '1:1' | '3:4' | '4:3' | '4:5' | '2:3' | '16:9' | 'custom';

export type ExportFormat = 'png' | 'jpeg' | 'webp';
export type ExportQuality = 'standard' | 'high' | 'maximum';

export interface PhotoPreset {
  id: string;
  name: string;
  category: 'Job Application' | 'ID Photo' | 'Passport' | 'Visa' | 'College Application' | 'Custom';
  width: number;
  height: number;
  aspectRatio: AspectRatio;
  defaultBg: string;
  guideType: 'passport' | 'id' | 'general' | 'none';
  notes: string;
}

export interface Adjustments {
  // Basic
  brightness: number;  // -100 to 100
  exposure: number;    // -100 to 100
  contrast: number;    // -100 to 100
  saturation: number;  // -100 to 100
  vibrance: number;    // -100 to 100
  temperature: number; // -100 to 100
  tint: number;        // -100 to 100
  sharpness: number;   // 0 to 100

  // Advanced
  highlights: number;  // -100 to 100
  shadows: number;     // -100 to 100
  whites: number;      // -100 to 100
  blacks: number;      // -100 to 100
  hue: number;         // -180 to 180
  blur: number;        // 0 to 50
  clarity: number;     // -100 to 100
}

export interface SubjectTransform {
  x: number;          // offset x in px
  y: number;          // offset y in px
  scale: number;      // 0.2 to 3.0 (default 1.0)
  rotation: number;   // -180 to 180 in degrees
}

export interface SubjectShadow {
  enabled: boolean;
  color: string;
  opacity: number;    // 0 to 100
  blur: number;       // 0 to 50
  offsetX: number;    // -50 to 50
  offsetY: number;    // -50 to 50
}

export interface CropState {
  active: boolean;
  aspectRatio: AspectRatio;
  x: number;          // normalized 0-1 or pixel coords
  y: number;
  width: number;
  height: number;
  rotation: number;   // fine rotation (-45 to 45 or 0-360)
  flipH: boolean;
  flipV: boolean;
}

export interface BackgroundConfig {
  type: 'color' | 'transparent' | 'image';
  color: string;      // HEX
  imageUrl?: string;  // Data URL or object URL of custom user background
  imageFit?: 'cover' | 'contain' | 'fill'; // How custom background scales to canvas
  imageBlur?: number; // 0 to 50 optional blur for aesthetic depth
}

export interface EditorState {
  originalImage: HTMLImageElement | null;
  originalWidth: number;
  originalHeight: number;
  originalFileName: string;
  originalFileSize: number;

  // Processed foreground mask & image
  foregroundImage: HTMLImageElement | null;
  isBackgroundRemoved: boolean;
  isProcessing: boolean;
  processingProgress: number;
  processingStage: string;

  // Layers & styling
  background: BackgroundConfig;
  adjustments: Adjustments;
  subjectTransform: SubjectTransform;
  subjectShadow: SubjectShadow;
  crop: CropState;

  // Presets & guides
  activePreset: PhotoPreset | null;
  showFaceGuide: boolean;

  // Export settings
  exportFormat: ExportFormat;
  exportQuality: ExportQuality;
  exportWidth: number;
  exportHeight: number;
  lockAspectRatio: boolean;

  // UI state
  activeTab: 'background' | 'crop' | 'adjust' | 'subject' | 'preset' | 'export';
  beforeAfterMode: 'split' | 'toggle' | 'off';
  showBefore: boolean;
  splitPosition: number; // 0 to 100
}
