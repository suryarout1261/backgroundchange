import React, { useState } from 'react';
import type { ExportFormat, ExportQuality } from '../../lib/types';
import { formatBytes } from '../../lib/export-utils';
import { Download, Lock, Unlock, ArrowLeft, CheckCircle2, ImagePlus, RefreshCw } from 'lucide-react';

interface ExportPanelProps {
  currentWidth: number;
  currentHeight: number;
  exportFormat: ExportFormat;
  exportQuality: ExportQuality;
  exportWidth: number;
  exportHeight: number;
  lockAspectRatio: boolean;
  onFormatChange: (f: ExportFormat) => void;
  onQualityChange: (q: ExportQuality) => void;
  onDimensionsChange: (w: number, h: number) => void;
  onLockRatioChange: (lock: boolean) => void;
  onDownload: () => void;
  onUploadNext: () => void;
  isExporting: boolean;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({
  currentWidth,
  currentHeight,
  exportFormat,
  exportQuality,
  exportWidth,
  exportHeight,
  lockAspectRatio,
  onFormatChange,
  onQualityChange,
  onDimensionsChange,
  onLockRatioChange,
  onDownload,
  onUploadNext,
  isExporting,
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Estimated file size calculation
  const getEstimatedSize = () => {
    const pixels = exportWidth * exportHeight;
    let bytesPerPixel = 0.25; // baseline compressed
    if (exportFormat === 'png') bytesPerPixel = 0.8;
    else if (exportFormat === 'jpeg') {
      if (exportQuality === 'standard') bytesPerPixel = 0.15;
      else if (exportQuality === 'high') bytesPerPixel = 0.25;
      else bytesPerPixel = 0.45;
    } else if (exportFormat === 'webp') {
      if (exportQuality === 'standard') bytesPerPixel = 0.1;
      else if (exportQuality === 'high') bytesPerPixel = 0.18;
      else bytesPerPixel = 0.3;
    }
    return formatBytes(pixels * bytesPerPixel);
  };

  const handleWidthChange = (w: number) => {
    const validW = Math.max(50, Math.min(6000, isNaN(w) ? currentWidth : w));
    if (lockAspectRatio && currentWidth > 0) {
      const ratio = currentHeight / currentWidth;
      onDimensionsChange(validW, Math.round(validW * ratio));
    } else {
      onDimensionsChange(validW, exportHeight);
    }
  };

  const handleHeightChange = (h: number) => {
    const validH = Math.max(50, Math.min(6000, isNaN(h) ? currentHeight : h));
    if (lockAspectRatio && currentHeight > 0) {
      const ratio = currentWidth / currentHeight;
      onDimensionsChange(Math.round(validH * ratio), validH);
    } else {
      onDimensionsChange(exportWidth, validH);
    }
  };

  const setPresetDimensions = (w: number, h: number) => {
    onDimensionsChange(w, h);
  };

  const handleDownloadClick = () => {
    onDownload();
    setDownloadSuccess(true);
  };

  return (
    <div className="space-y-5">
      {/* Download Success Notice with Quick Upload Next Button */}
      {downloadSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 animate-in fade-in duration-300">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span className="font-bold text-sm">Download Initiated!</span>
          </div>
          <p className="text-xs text-emerald-700 dark:text-emerald-300 mb-3">
            Your edited photo has been prepared and downloaded in high resolution.
          </p>
          <button
            type="button"
            onClick={onUploadNext}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <ImagePlus className="w-4 h-4 stroke-[2.5]" />
            <span>Upload Next Image (Home)</span>
          </button>
        </div>
      )}

      {/* File Format Options */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2.5">
          Export Format
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['png', 'jpeg', 'webp'] as ExportFormat[]).map((fmt) => {
            const isSelected = exportFormat === fmt;
            return (
              <button
                key={fmt}
                type="button"
                onClick={() => onFormatChange(fmt)}
                className={`py-2 px-3 rounded-xl border text-center font-bold text-xs uppercase tracking-wider transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                {fmt}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quality Level (only applicable for JPEG and WebP) */}
      {exportFormat !== 'png' && (
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2.5">
            Compression Quality
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { id: 'standard', label: 'Standard', desc: '75%' },
                { id: 'high', label: 'High', desc: '90%' },
                { id: 'maximum', label: 'Maximum', desc: '100%' },
              ] as const
            ).map((q) => {
              const isSelected = exportQuality === q.id;
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => onQualityChange(q.id)}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <div className="font-bold text-xs">{q.label}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">{q.desc}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Dimension Presets & Custom Resolution */}
      <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2.5">
          Output Resolution
        </label>

        {/* Quick Presets */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button
            type="button"
            onClick={() => setPresetDimensions(currentWidth, currentHeight)}
            className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-blue-400 transition-colors truncate"
          >
            Original ({currentWidth}×{currentHeight})
          </button>
          <button
            type="button"
            onClick={() => setPresetDimensions(600, 600)}
            className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-blue-400 transition-colors"
          >
            600 × 600 px (Passport)
          </button>
          <button
            type="button"
            onClick={() => setPresetDimensions(800, 800)}
            className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-blue-400 transition-colors"
          >
            800 × 800 px (Square)
          </button>
          <button
            type="button"
            onClick={() => setPresetDimensions(1200, 1200)}
            className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-blue-400 transition-colors"
          >
            1200 × 1200 px (HD)
          </button>
        </div>

        {/* Custom Width x Height */}
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
          <div className="flex-1">
            <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 block mb-0.5">
              Width (px)
            </span>
            <input
              type="number"
              min={50}
              max={6000}
              value={exportWidth}
              onChange={(e) => handleWidthChange(parseInt(e.target.value))}
              className="w-full px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <button
            type="button"
            onClick={() => onLockRatioChange(!lockAspectRatio)}
            className={`mt-3.5 p-1.5 rounded-lg border transition-colors ${
              lockAspectRatio
                ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-400 text-blue-600 dark:text-blue-400'
                : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-400'
            }`}
            title={lockAspectRatio ? 'Aspect ratio locked' : 'Aspect ratio unlocked'}
          >
            {lockAspectRatio ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          </button>

          <div className="flex-1">
            <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 block mb-0.5">
              Height (px)
            </span>
            <input
              type="number"
              min={50}
              max={6000}
              value={exportHeight}
              onChange={(e) => handleHeightChange(parseInt(e.target.value))}
              className="w-full px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Output Summary & Live Estimates */}
      <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/60 flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
        <div>
          <span className="font-medium text-slate-500 dark:text-slate-400">Size: </span>
          <strong className="font-bold text-slate-900 dark:text-white font-mono">
            {exportWidth} × {exportHeight} px
          </strong>
        </div>
        <div>
          <span className="font-medium text-slate-500 dark:text-slate-400">Est.: </span>
          <strong className="font-bold text-blue-600 dark:text-blue-400 font-mono">
            ~{getEstimatedSize()}
          </strong>
        </div>
      </div>

      {/* Download Action CTA */}
      <button
        type="button"
        onClick={handleDownloadClick}
        disabled={isExporting}
        className="w-full py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
      >
        {isExporting ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Preparing your image...</span>
          </>
        ) : (
          <>
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>Download Image</span>
          </>
        )}
      </button>

      {/* Button for changing to next image / upload another */}
      <button
        type="button"
        onClick={onUploadNext}
        className="w-full py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
      >
        <ImagePlus className="w-3.5 h-3.5 text-blue-500" />
        <span>Change Image / Upload Next Image</span>
      </button>

      <p className="text-center text-[10px] text-slate-500 dark:text-slate-400">
        Instant direct download • 100% Client-side in your browser
      </p>
    </div>
  );
};
