import React from 'react';
import type { AspectRatio, CropState } from '../../lib/types';
import { calculateInitialCrop } from '../../lib/crop-utils';
import {
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Maximize2,
  Square,
  Crop as CropIcon,
} from 'lucide-react';

interface CropPanelProps {
  crop: CropState;
  imgWidth: number;
  imgHeight: number;
  onChange: (crop: CropState, fieldName?: string) => void;
  onCommit?: () => void;
}

const RATIO_OPTIONS: { id: AspectRatio; label: string; iconDesc: string }[] = [
  { id: 'free', label: 'Free', iconDesc: 'Freeform' },
  { id: '1:1', label: '1:1', iconDesc: 'Square / Passport' },
  { id: '3:4', label: '3:4', iconDesc: 'ID Card / Portrait' },
  { id: '4:3', label: '4:3', iconDesc: 'Standard' },
  { id: '4:5', label: '4:5', iconDesc: 'Portrait / Print' },
  { id: '2:3', label: '2:3', iconDesc: 'Classic 35mm' },
  { id: '16:9', label: '16:9', iconDesc: 'Widescreen' },
];

export const CropPanel: React.FC<CropPanelProps> = ({
  crop,
  imgWidth,
  imgHeight,
  onChange,
  onCommit,
}) => {
  const handleRatioSelect = (ratio: AspectRatio) => {
    const newBox = calculateInitialCrop(imgWidth, imgHeight, ratio);
    onChange({
      ...crop,
      aspectRatio: ratio,
      x: newBox.x,
      y: newBox.y,
      width: newBox.width,
      height: newBox.height,
    }, 'crop_ratio');
    onCommit?.();
  };

  const handleRotateLeft = () => {
    const nextRot = (crop.rotation - 90 + 360) % 360;
    onChange({ ...crop, rotation: nextRot > 180 ? nextRot - 360 : nextRot }, 'crop_rotate');
    onCommit?.();
  };

  const handleRotateRight = () => {
    const nextRot = (crop.rotation + 90) % 360;
    onChange({ ...crop, rotation: nextRot > 180 ? nextRot - 360 : nextRot }, 'crop_rotate');
    onCommit?.();
  };

  const handleFineRotate = (val: number) => {
    onChange({ ...crop, rotation: val }, 'crop_fine_rotate');
  };

  const handleFlipH = () => {
    onChange({ ...crop, flipH: !crop.flipH }, 'crop_fliph');
    onCommit?.();
  };

  const handleFlipV = () => {
    onChange({ ...crop, flipV: !crop.flipV }, 'crop_flipv');
    onCommit?.();
  };

  const handleResetCrop = () => {
    onChange({
      active: false,
      aspectRatio: 'free',
      x: 0,
      y: 0,
      width: imgWidth,
      height: imgHeight,
      rotation: 0,
      flipH: false,
      flipV: false,
    }, 'crop_reset');
    onCommit?.();
  };

  return (
    <div className="space-y-6">
      {/* Aspect Ratio Selection */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Aspect Ratio
          </label>
          <button
            type="button"
            onClick={handleResetCrop}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Crop</span>
          </button>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {RATIO_OPTIONS.map((item) => {
            const isSelected = crop.aspectRatio === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleRatioSelect(item.id)}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/20 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <span className="font-bold text-sm tracking-tight">{item.label}</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-full">
                  {item.iconDesc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Rotation & Flip Controls */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-3">
          Rotate & Flip
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
          <button
            type="button"
            onClick={handleRotateLeft}
            className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors"
          >
            <RotateCcw className="w-4 h-4 text-blue-500" />
            <span>Rotate -90°</span>
          </button>

          <button
            type="button"
            onClick={handleRotateRight}
            className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors"
          >
            <RotateCw className="w-4 h-4 text-blue-500" />
            <span>Rotate +90°</span>
          </button>

          <button
            type="button"
            onClick={handleFlipH}
            className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all ${
              crop.flipH
                ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
            }`}
          >
            <FlipHorizontal className="w-4 h-4" />
            <span>Flip Horiz.</span>
          </button>

          <button
            type="button"
            onClick={handleFlipV}
            className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all ${
              crop.flipV
                ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
            }`}
          >
            <FlipVertical className="w-4 h-4" />
            <span>Flip Vert.</span>
          </button>
        </div>

        {/* Fine Rotation Slider */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Fine Straighten / Rotation
            </span>
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                <input
                  type="number"
                  min={-45}
                  max={45}
                  value={crop.rotation}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === '' || raw === '-') return;
                    const parsed = parseInt(raw);
                    if (!isNaN(parsed)) {
                      handleFineRotate(Math.max(-45, Math.min(45, parsed)));
                    }
                  }}
                  onBlur={onCommit}
                  onKeyDown={(e) => e.key === 'Enter' && onCommit?.()}
                  className="w-14 px-1.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-xs text-right text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
                />
                <span className="text-xs text-slate-400 ml-1 font-mono">°</span>
              </div>
              {crop.rotation !== 0 && (
                <button
                  type="button"
                  onClick={() => {
                    handleFineRotate(0);
                    onCommit?.();
                  }}
                  className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
          <input
            type="range"
            min={-45}
            max={45}
            value={crop.rotation}
            onChange={(e) => handleFineRotate(parseInt(e.target.value))}
            onPointerUp={onCommit}
            onMouseUp={onCommit}
            onTouchEnd={onCommit}
            onKeyUp={onCommit}
            className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
            <span>-45°</span>
            <span>0°</span>
            <span>+45°</span>
          </div>
        </div>
      </div>
    </div>
  );
};
