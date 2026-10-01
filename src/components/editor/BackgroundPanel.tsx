import React, { useState, useEffect, useRef } from 'react';
import type { BackgroundConfig } from '../../lib/types';
import { PRESET_COLORS, hexToRgb, rgbToHex, normalizeHex, isValidHex } from '../../lib/color-utils';
import { RotateCcw, Ban, Pipette, ImagePlus, Upload, Trash2, Sliders, Check } from 'lucide-react';

interface BackgroundPanelProps {
  background: BackgroundConfig;
  onChange: (bg: BackgroundConfig, fieldName?: string) => void;
  onCommit?: () => void;
}

// 4 high-quality curated sample backgrounds users can test instantly
const SAMPLE_BACKGROUNDS = [
  {
    name: 'Modern Office',
    url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
    thumb: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=160&q=70',
  },
  {
    name: 'Studio Grey',
    url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80',
    thumb: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=160&q=70',
  },
  {
    name: 'Cozy Library',
    url: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1200&q=80',
    thumb: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=160&q=70',
  },
  {
    name: 'Soft Gradient',
    url: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=1200&q=80',
    thumb: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=160&q=70',
  },
];

export const BackgroundPanel: React.FC<BackgroundPanelProps> = ({ background, onChange, onCommit }) => {
  const [activeTab, setActiveTab] = useState<'color' | 'image'>(background.type === 'image' ? 'image' : 'color');
  const [hexInput, setHexInput] = useState(background.color || '#FFFFFF');
  const rgb = hexToRgb(background.color || '#FFFFFF');
  const [r, setR] = useState(rgb.r);
  const [g, setG] = useState(rgb.g);
  const [b, setB] = useState(rgb.b);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when prop changes externally
  useEffect(() => {
    if (background.type === 'image') {
      setActiveTab('image');
    }
    if (background.color) {
      setHexInput(background.color);
      const newRgb = hexToRgb(background.color);
      setR(newRgb.r);
      setG(newRgb.g);
      setB(newRgb.b);
    }
  }, [background.color, background.type]);

  const handlePresetSelect = (hex: string) => {
    onChange({ type: 'color', color: hex }, 'bg_preset');
    onCommit?.();
  };

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    setHexInput(val);
    if (isValidHex(val)) {
      const normalized = normalizeHex(val);
      onChange({ type: 'color', color: normalized }, 'bg_hex');
      const newRgb = hexToRgb(normalized);
      setR(newRgb.r);
      setG(newRgb.g);
      setB(newRgb.b);
    }
  };

  const handleRgbChange = (newR: number, newG: number, newB: number) => {
    const clamp = (v: number) => Math.max(0, Math.min(255, isNaN(v) ? 0 : v));
    const validR = clamp(newR);
    const validG = clamp(newG);
    const validB = clamp(newB);
    setR(validR);
    setG(validG);
    setB(validB);
    const hex = rgbToHex(validR, validG, validB);
    setHexInput(hex);
    onChange({ type: 'color', color: hex }, 'bg_rgb');
  };

  const handleColorPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value.toUpperCase();
    onChange({ type: 'color', color: hex }, 'bg_picker');
  };

  const handleReset = () => {
    onChange({ type: 'color', color: '#FFFFFF' }, 'bg_reset');
    onCommit?.();
  };

  const handleTransparent = () => {
    onChange({ type: 'transparent', color: background.color || '#FFFFFF' }, 'bg_transparent');
    onCommit?.();
  };

  // User Background Image Upload Handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (JPG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        onChange(
          {
            type: 'image',
            color: background.color || '#FFFFFF',
            imageUrl: result,
            imageFit: background.imageFit || 'cover',
            imageBlur: background.imageBlur || 0,
          },
          'bg_custom_image'
        );
        onCommit?.();
      }
    };
    reader.readAsDataURL(file);
    // Reset file input so re-selecting same file triggers change
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSelectSample = (url: string) => {
    onChange(
      {
        type: 'image',
        color: background.color || '#FFFFFF',
        imageUrl: url,
        imageFit: background.imageFit || 'cover',
        imageBlur: background.imageBlur || 0,
      },
      'bg_sample_image'
    );
    onCommit?.();
  };

  const handleFitChange = (fit: 'cover' | 'contain' | 'fill') => {
    if (background.type === 'image') {
      onChange({ ...background, imageFit: fit }, 'bg_fit');
      onCommit?.();
    }
  };

  const handleBlurChange = (blurVal: number) => {
    if (background.type === 'image') {
      onChange({ ...background, imageBlur: blurVal }, 'bg_blur');
    }
  };

  const handleRemoveImage = () => {
    onChange({ type: 'color', color: background.color || '#FFFFFF' }, 'bg_remove_image');
    setActiveTab('color');
    onCommit?.();
  };

  return (
    <div className="space-y-6">
      {/* Primary Selector: Solid Color vs. Image Background */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
        <button
          type="button"
          onClick={() => {
            setActiveTab('color');
            if (background.type === 'image') {
              onChange({ type: 'color', color: background.color || '#FFFFFF' }, 'bg_tab_color');
              onCommit?.();
            }
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'color'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <div className="w-3.5 h-3.5 rounded-full bg-blue-600" />
          <span>Solid Color</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('image');
            if (background.type !== 'image') {
              // If already has an image url preserved, re-apply it; otherwise select default office
              const defaultImg = background.imageUrl || SAMPLE_BACKGROUNDS[0].url;
              onChange(
                {
                  type: 'image',
                  color: background.color || '#FFFFFF',
                  imageUrl: defaultImg,
                  imageFit: background.imageFit || 'cover',
                  imageBlur: background.imageBlur || 0,
                },
                'bg_tab_image'
              );
              onCommit?.();
            }
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'image'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ImagePlus className="w-3.5 h-3.5" />
          <span>Upload Image Background</span>
        </button>
      </div>

      {/* TAB 1: Solid Color Controls */}
      {activeTab === 'color' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Preset Swatches Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Color Presets
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTransparent}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                    background.type === 'transparent'
                      ? 'bg-blue-50 dark:bg-blue-950/80 border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Transparent</span>
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                  title="Reset background to white"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {/* 8 Default Color Presets Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
              {PRESET_COLORS.map((preset) => {
                const isSelected = background.type === 'color' && background.color === preset.hex;
                return (
                  <button
                    key={preset.hex}
                    type="button"
                    onClick={() => handlePresetSelect(preset.hex)}
                    className={`group flex flex-col items-center gap-1.5 p-2 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-sm bg-blue-50/30 dark:bg-blue-950/30'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-lg border border-black/10 dark:border-white/10 shadow-inner transition-transform group-hover:scale-105"
                      style={{ backgroundColor: preset.hex }}
                    />
                    <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate w-full">
                      {preset.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Color Section */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-3">
              Custom Color
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Native Color Picker & Preview */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 shadow-inner flex-shrink-0 cursor-pointer">
                  <input
                    type="color"
                    value={background.color || '#FFFFFF'}
                    onChange={handleColorPickerChange}
                    onBlur={onCommit}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                    id="native-color-picker"
                    title="Open system color picker"
                  />
                  <div
                    className="w-full h-full"
                    style={{ backgroundColor: background.color || '#FFFFFF' }}
                  />
                </div>
                <div>
                  <label htmlFor="native-color-picker" className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 cursor-pointer">
                    <Pipette className="w-3.5 h-3.5 text-blue-500" />
                    Color Picker
                  </label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Click swatch to open palette
                  </p>
                </div>
              </div>

              {/* HEX Input */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">HEX</span>
                <div className="flex items-center gap-1">
                  <span className="text-slate-400 font-mono text-sm">#</span>
                  <input
                    type="text"
                    value={hexInput.replace(/^#/, '')}
                    onChange={handleHexChange}
                    onBlur={onCommit}
                    onKeyDown={(e) => e.key === 'Enter' && onCommit?.()}
                    maxLength={6}
                    placeholder="FFFFFF"
                    className="w-24 px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-xs text-slate-900 dark:text-white uppercase focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* RGB Component Inputs */}
            <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase block mb-2">
                RGB Values
              </span>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    R (Red)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={255}
                    value={r}
                    onChange={(e) => handleRgbChange(parseInt(e.target.value) || 0, g, b)}
                    onBlur={onCommit}
                    onKeyDown={(e) => e.key === 'Enter' && onCommit?.()}
                    className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-xs text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    G (Green)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={255}
                    value={g}
                    onChange={(e) => handleRgbChange(r, parseInt(e.target.value) || 0, b)}
                    onBlur={onCommit}
                    onKeyDown={(e) => e.key === 'Enter' && onCommit?.()}
                    className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-xs text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    B (Blue)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={255}
                    value={b}
                    onChange={(e) => handleRgbChange(r, g, parseInt(e.target.value) || 0)}
                    onBlur={onCommit}
                    onKeyDown={(e) => e.key === 'Enter' && onCommit?.()}
                    className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-xs text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Upload Custom Image Background Controls */}
      {activeTab === 'image' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* File Upload Zone */}
          <div className="p-4 sm:p-5 rounded-2xl border-2 border-dashed border-blue-400/60 dark:border-blue-500/40 bg-blue-50/30 dark:bg-blue-950/20 text-center">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
              id="user-bg-upload-input"
            />
            <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-2.5">
              <Upload className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              Upload Your Own Background Image
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 max-w-sm mx-auto">
              Select any photo, office scene, nature landscape, or graphic from your device (JPG, PNG, WebP).
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Browse Device Photos</span>
            </button>
          </div>

          {/* Quick Backdrop Scenery Presets */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Or Choose Instant Scene Preset
              </label>
              {background.type === 'image' && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="flex items-center gap-1 text-[11px] font-semibold text-red-600 dark:text-red-400 hover:underline cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Remove Image</span>
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {SAMPLE_BACKGROUNDS.map((sample) => {
                const isSelected = background.type === 'image' && background.imageUrl === sample.url;
                return (
                  <button
                    key={sample.name}
                    type="button"
                    onClick={() => handleSelectSample(sample.url)}
                    className={`group relative rounded-xl overflow-hidden border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-500 ring-2 ring-blue-500/30 shadow-md'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                      <img
                        src={sample.thumb}
                        alt={sample.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                    <div className="p-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs">
                      <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {sample.name}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Background Image Adjustments (Fit & Blur) */}
          {background.type === 'image' && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                <Sliders className="w-3.5 h-3.5 text-blue-500" />
                <span>Background Image Options</span>
              </div>

              {/* Fit Mode */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">
                  Scaling / Fit Mode
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['cover', 'contain', 'fill'] as const).map((fit) => (
                    <button
                      key={fit}
                      type="button"
                      onClick={() => handleFitChange(fit)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold capitalize border transition-all cursor-pointer ${
                        (background.imageFit || 'cover') === fit
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      {fit}
                    </button>
                  ))}
                </div>
              </div>

              {/* Depth Blur Slider */}
              <div>
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  <span>Depth of Field (Blur)</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">
                    {background.imageBlur || 0}px
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="1"
                  value={background.imageBlur || 0}
                  onChange={(e) => handleBlurChange(parseInt(e.target.value) || 0)}
                  onMouseUp={onCommit}
                  onTouchEnd={onCommit}
                  className="w-full accent-blue-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>Sharp (0px)</span>
                  <span>Soft Focus</span>
                  <span>Bokeh Portrait (30px)</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

