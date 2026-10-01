import React, { useState } from 'react';
import type { Adjustments } from '../../lib/types';
import { DEFAULT_ADJUSTMENTS } from '../../lib/image-processing';
import { RotateCcw, ChevronDown, ChevronUp, Sliders } from 'lucide-react';

interface AdjustPanelProps {
  adjustments: Adjustments;
  onChange: (adjustments: Adjustments, fieldName?: string) => void;
  onCommit?: () => void;
}

interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (val: number) => void;
  onCommit?: () => void;
  defaultValue?: number;
}

const SliderControl: React.FC<SliderControlProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
  onCommit,
  defaultValue = 0,
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '' || raw === '-') return;
    const parsed = parseFloat(raw);
    if (!isNaN(parsed)) {
      const clamped = Math.max(min, Math.min(max, parsed));
      onChange(clamped);
    }
  };

  const handleInputBlur = () => {
    onCommit?.();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onCommit?.();
    }
  };

  return (
    <div className="py-2">
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          {label}
        </label>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center">
            <input
              type="number"
              min={min}
              max={max}
              step={step}
              value={value}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              onKeyDown={handleInputKeyDown}
              className="w-16 px-1.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-xs text-right text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
            />
            {unit && (
              <span className="text-[11px] text-slate-400 ml-1 font-mono">{unit}</span>
            )}
          </div>
          {value !== defaultValue && (
            <button
              type="button"
              onClick={() => {
                onChange(defaultValue);
                onCommit?.();
              }}
              className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer ml-1"
              title={`Reset ${label}`}
            >
              Reset
            </button>
          )}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        onPointerUp={onCommit}
        onMouseUp={onCommit}
        onTouchEnd={onCommit}
        onKeyUp={onCommit}
        className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
      />
    </div>
  );
};

export const AdjustPanel: React.FC<AdjustPanelProps> = ({ adjustments, onChange, onCommit }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleUpdate = (field: keyof Adjustments, value: number) => {
    onChange({
      ...adjustments,
      [field]: value,
    }, `adj_${field}`);
  };

  const handleResetAll = () => {
    onChange({ ...DEFAULT_ADJUSTMENTS }, 'reset_all_adj');
    onCommit?.();
  };

  return (
    <div className="space-y-4">
      {/* Header with Reset All */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-blue-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Color & Lighting
          </span>
        </div>
        <button
          type="button"
          onClick={handleResetAll}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset All</span>
        </button>
      </div>

      {/* Basic Adjustments */}
      <div className="space-y-1">
        <SliderControl
          label="Brightness"
          value={adjustments.brightness}
          min={-100}
          max={100}
          onChange={(v) => handleUpdate('brightness', v)}
          onCommit={onCommit}
        />
        <SliderControl
          label="Exposure"
          value={adjustments.exposure}
          min={-100}
          max={100}
          onChange={(v) => handleUpdate('exposure', v)}
          onCommit={onCommit}
        />
        <SliderControl
          label="Contrast"
          value={adjustments.contrast}
          min={-100}
          max={100}
          onChange={(v) => handleUpdate('contrast', v)}
          onCommit={onCommit}
        />
        <SliderControl
          label="Saturation"
          value={adjustments.saturation}
          min={-100}
          max={100}
          onChange={(v) => handleUpdate('saturation', v)}
          onCommit={onCommit}
        />
        <SliderControl
          label="Vibrance"
          value={adjustments.vibrance}
          min={-100}
          max={100}
          onChange={(v) => handleUpdate('vibrance', v)}
          onCommit={onCommit}
        />
        <SliderControl
          label="Temperature (Warm / Cool)"
          value={adjustments.temperature}
          min={-100}
          max={100}
          onChange={(v) => handleUpdate('temperature', v)}
          onCommit={onCommit}
        />
        <SliderControl
          label="Tint (Magenta / Green)"
          value={adjustments.tint}
          min={-100}
          max={100}
          onChange={(v) => handleUpdate('tint', v)}
          onCommit={onCommit}
        />
        <SliderControl
          label="Sharpness"
          value={adjustments.sharpness}
          min={0}
          max={100}
          onChange={(v) => handleUpdate('sharpness', v)}
          onCommit={onCommit}
        />
      </div>

      {/* Advanced Adjustments Toggle */}
      <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 transition-colors cursor-pointer"
        >
          <span>Advanced Adjustments (Highlights, Shadows, Hue)</span>
          {showAdvanced ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        {showAdvanced && (
          <div className="mt-2 space-y-1 bg-slate-50/70 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <SliderControl
              label="Highlights"
              value={adjustments.highlights}
              min={-100}
              max={100}
              onChange={(v) => handleUpdate('highlights', v)}
              onCommit={onCommit}
            />
            <SliderControl
              label="Shadows"
              value={adjustments.shadows}
              min={-100}
              max={100}
              onChange={(v) => handleUpdate('shadows', v)}
              onCommit={onCommit}
            />
            <SliderControl
              label="Hue Rotation"
              value={adjustments.hue}
              min={-180}
              max={180}
              unit="°"
              onChange={(v) => handleUpdate('hue', v)}
              onCommit={onCommit}
            />
          </div>
        )}
      </div>
    </div>
  );
};
