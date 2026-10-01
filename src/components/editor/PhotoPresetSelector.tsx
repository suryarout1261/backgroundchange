import React from 'react';
import type { PhotoPreset } from '../../lib/types';
import { PHOTO_PRESETS } from '../../lib/presets';
import { AlertCircle, Check, Briefcase, FileBadge, Award, GraduationCap, SlidersHorizontal } from 'lucide-react';

interface PhotoPresetSelectorProps {
  activePreset: PhotoPreset | null;
  onSelectPreset: (preset: PhotoPreset) => void;
}

export const PhotoPresetSelector: React.FC<PhotoPresetSelectorProps> = ({
  activePreset,
  onSelectPreset,
}) => {
  const getIcon = (category: PhotoPreset['category']) => {
    switch (category) {
      case 'Job Application':
        return <Briefcase className="w-4 h-4 text-blue-500" />;
      case 'ID Photo':
        return <FileBadge className="w-4 h-4 text-emerald-500" />;
      case 'Passport':
      case 'Visa':
        return <Award className="w-4 h-4 text-amber-500" />;
      case 'College Application':
        return <GraduationCap className="w-4 h-4 text-indigo-500" />;
      case 'Custom':
      default:
        return <SlidersHorizontal className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Important Official Specifications Disclaimer */}
      <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
        <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
        <div>
          <strong className="font-semibold block mb-0.5">Application Requirement Notice</strong>
          Requirements vary by organization and country. Check your application's official photo specifications before submitting.
        </div>
      </div>

      {/* Preset Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PHOTO_PRESETS.map((preset) => {
          const isSelected = activePreset?.id === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelectPreset(preset)}
              className={`p-3.5 rounded-xl border text-left transition-all relative ${
                isSelected
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 ring-2 ring-blue-500/20 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                    {getIcon(preset.category)}
                  </div>
                  <span className="font-bold text-xs text-slate-900 dark:text-white">
                    {preset.category}
                  </span>
                </div>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
              </div>

              <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                {preset.name}
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono mb-2">
                <span>{preset.width} × {preset.height} px</span>
                <span>•</span>
                <span>Ratio: {preset.aspectRatio}</span>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                {preset.notes}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
