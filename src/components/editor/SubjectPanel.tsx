import React from 'react';
import type { SubjectShadow, SubjectTransform } from '../../lib/types';
import { DEFAULT_SUBJECT_SHADOW, DEFAULT_SUBJECT_TRANSFORM } from '../../lib/image-processing';
import {
  RotateCcw,
  AlignCenter,
  Move,
  Maximize,
  Sparkles,
  Layers,
} from 'lucide-react';

interface SubjectPanelProps {
  transform: SubjectTransform;
  shadow: SubjectShadow;
  onTransformChange: (t: SubjectTransform, fieldName?: string) => void;
  onShadowChange: (s: SubjectShadow, fieldName?: string) => void;
  onCommit?: () => void;
}

export const SubjectPanel: React.FC<SubjectPanelProps> = ({
  transform,
  shadow,
  onTransformChange,
  onShadowChange,
  onCommit,
}) => {
  const handleAutoCenter = () => {
    onTransformChange({
      ...transform,
      x: 0,
      y: 0,
    }, 'subject_center');
    onCommit?.();
  };

  const handleResetPosition = () => {
    onTransformChange({ ...DEFAULT_SUBJECT_TRANSFORM }, 'subject_reset_pos');
    onCommit?.();
  };

  const handleResetScale = () => {
    onTransformChange({ ...transform, scale: 1 }, 'subject_reset_scale');
    onCommit?.();
  };

  return (
    <div className="space-y-6">
      {/* Position & Center Controls */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Subject Placement & Centering
          </label>
          <button
            type="button"
            onClick={handleResetPosition}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Position</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5 mb-4">
          <button
            type="button"
            onClick={handleAutoCenter}
            className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-xs font-semibold hover:bg-blue-100 transition-colors cursor-pointer"
          >
            <AlignCenter className="w-4 h-4" />
            <span>Auto Center Subject</span>
          </button>

          <button
            type="button"
            onClick={() => onTransformChange({ ...transform, x: 0 })}
            className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium hover:border-slate-300 transition-colors cursor-pointer"
          >
            <span>Center Horizontally</span>
          </button>
        </div>

        {/* Nudge X and Y Sliders with Manual Numeric Input */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Move X (px)
              </span>
              <input
                type="number"
                min={-300}
                max={300}
                value={transform.x}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val)) onTransformChange({ ...transform, x: val }, 'subject_move_x');
                }}
                onBlur={onCommit}
                onKeyDown={(e) => e.key === 'Enter' && onCommit?.()}
                className="w-16 px-1.5 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-xs text-right text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <input
              type="range"
              min={-200}
              max={200}
              value={transform.x}
              onChange={(e) => onTransformChange({ ...transform, x: parseInt(e.target.value) }, 'subject_move_x')}
              onPointerUp={onCommit}
              onMouseUp={onCommit}
              onTouchEnd={onCommit}
              onKeyUp={onCommit}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Move Y (px)
              </span>
              <input
                type="number"
                min={-300}
                max={300}
                value={transform.y}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val)) onTransformChange({ ...transform, y: val }, 'subject_move_y');
                }}
                onBlur={onCommit}
                onKeyDown={(e) => e.key === 'Enter' && onCommit?.()}
                className="w-16 px-1.5 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-xs text-right text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <input
              type="range"
              min={-200}
              max={200}
              value={transform.y}
              onChange={(e) => onTransformChange({ ...transform, y: parseInt(e.target.value) }, 'subject_move_y')}
              onPointerUp={onCommit}
              onMouseUp={onCommit}
              onTouchEnd={onCommit}
              onKeyUp={onCommit}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Scale & Subject Rotation */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-3">
          Scale & Orientation
        </label>

        <div className="space-y-3.5">
          {/* Scale Slider with Manual Input */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Subject Scale (%)
              </span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={30}
                  max={250}
                  value={Math.round(transform.scale * 100)}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val)) {
                      onTransformChange({
                        ...transform,
                        scale: Math.max(0.3, Math.min(2.5, val / 100)),
                      }, 'subject_scale');
                    }
                  }}
                  onBlur={onCommit}
                  onKeyDown={(e) => e.key === 'Enter' && onCommit?.()}
                  className="w-16 px-1.5 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-xs text-right text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
                />
                <span className="text-xs text-slate-400 font-mono">%</span>
                {transform.scale !== 1 && (
                  <button
                    type="button"
                    onClick={handleResetScale}
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer ml-1"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
            <input
              type="range"
              min={0.3}
              max={2.5}
              step={0.02}
              value={transform.scale}
              onChange={(e) =>
                onTransformChange({ ...transform, scale: parseFloat(e.target.value) }, 'subject_scale')
              }
              onPointerUp={onCommit}
              onMouseUp={onCommit}
              onTouchEnd={onCommit}
              onKeyUp={onCommit}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
              <span>30%</span>
              <span>100%</span>
              <span>250%</span>
            </div>
          </div>

          {/* Subject Rotation Slider with Manual Input */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Subject Rotation (°)
              </span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={-90}
                  max={90}
                  value={transform.rotation}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val)) {
                      onTransformChange({
                        ...transform,
                        rotation: Math.max(-90, Math.min(90, val)),
                      }, 'subject_rotation');
                    }
                  }}
                  onBlur={onCommit}
                  onKeyDown={(e) => e.key === 'Enter' && onCommit?.()}
                  className="w-16 px-1.5 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-xs text-right text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
                />
                <span className="text-xs text-slate-400 font-mono">°</span>
                {transform.rotation !== 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      onTransformChange({ ...transform, rotation: 0 }, 'subject_rotation');
                      onCommit?.();
                    }}
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer ml-1"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
            <input
              type="range"
              min={-90}
              max={90}
              value={transform.rotation}
              onChange={(e) =>
                onTransformChange({ ...transform, rotation: parseInt(e.target.value) }, 'subject_rotation')
              }
              onPointerUp={onCommit}
              onMouseUp={onCommit}
              onTouchEnd={onCommit}
              onKeyUp={onCommit}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Subject Shadow Section with Manual Inputs */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Subject Shadow
          </label>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={shadow.enabled}
              onChange={(e) => onShadowChange({ ...shadow, enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {shadow.enabled && (
          <div className="space-y-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                  Shadow Opacity (%)
                </span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={shadow.opacity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val)) {
                      onShadowChange({ ...shadow, opacity: Math.max(0, Math.min(100, val)) }, 'shadow_opacity');
                    }
                  }}
                  onBlur={onCommit}
                  onKeyDown={(e) => e.key === 'Enter' && onCommit?.()}
                  className="w-14 px-1.5 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-xs text-right text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={shadow.opacity}
                onChange={(e) =>
                  onShadowChange({ ...shadow, opacity: parseInt(e.target.value) }, 'shadow_opacity')
                }
                onPointerUp={onCommit}
                onMouseUp={onCommit}
                onTouchEnd={onCommit}
                onKeyUp={onCommit}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                  Shadow Blur (px)
                </span>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={shadow.blur}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val)) {
                      onShadowChange({ ...shadow, blur: Math.max(0, Math.min(50, val)) }, 'shadow_blur');
                    }
                  }}
                  onBlur={onCommit}
                  onKeyDown={(e) => e.key === 'Enter' && onCommit?.()}
                  className="w-14 px-1.5 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-xs text-right text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <input
                type="range"
                min={0}
                max={50}
                value={shadow.blur}
                onChange={(e) =>
                  onShadowChange({ ...shadow, blur: parseInt(e.target.value) }, 'shadow_blur')
                }
                onPointerUp={onCommit}
                onMouseUp={onCommit}
                onTouchEnd={onCommit}
                onKeyUp={onCommit}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-slate-600 dark:text-slate-400">
                    Offset X (px)
                  </span>
                  <input
                    type="number"
                    min={-40}
                    max={40}
                    value={shadow.offsetX}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val)) {
                        onShadowChange({ ...shadow, offsetX: Math.max(-40, Math.min(40, val)) }, 'shadow_offset_x');
                      }
                    }}
                    onBlur={onCommit}
                    onKeyDown={(e) => e.key === 'Enter' && onCommit?.()}
                    className="w-12 px-1 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[11px] text-right text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <input
                  type="range"
                  min={-40}
                  max={40}
                  value={shadow.offsetX}
                  onChange={(e) =>
                    onShadowChange({ ...shadow, offsetX: parseInt(e.target.value) }, 'shadow_offset_x')
                  }
                  onPointerUp={onCommit}
                  onMouseUp={onCommit}
                  onTouchEnd={onCommit}
                  onKeyUp={onCommit}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-slate-600 dark:text-slate-400">
                    Offset Y (px)
                  </span>
                  <input
                    type="number"
                    min={-40}
                    max={40}
                    value={shadow.offsetY}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val)) {
                        onShadowChange({ ...shadow, offsetY: Math.max(-40, Math.min(40, val)) }, 'shadow_offset_y');
                      }
                    }}
                    onBlur={onCommit}
                    onKeyDown={(e) => e.key === 'Enter' && onCommit?.()}
                    className="w-12 px-1 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[11px] text-right text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <input
                  type="range"
                  min={-40}
                  max={40}
                  value={shadow.offsetY}
                  onChange={(e) =>
                    onShadowChange({ ...shadow, offsetY: parseInt(e.target.value) }, 'shadow_offset_y')
                  }
                  onPointerUp={onCommit}
                  onMouseUp={onCommit}
                  onTouchEnd={onCommit}
                  onKeyUp={onCommit}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
