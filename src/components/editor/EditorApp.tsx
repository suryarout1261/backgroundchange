import React, { useState, useEffect, useRef, useCallback } from 'react';
import type {
  EditorState,
  Adjustments,
  BackgroundConfig,
  CropState,
  PhotoPreset,
  SubjectShadow,
  SubjectTransform,
  ExportFormat,
  ExportQuality,
} from '../../lib/types';
import { DEFAULT_ADJUSTMENTS, DEFAULT_SUBJECT_SHADOW, DEFAULT_SUBJECT_TRANSFORM } from '../../lib/image-processing';
import { removeImageBackground, blobToImage } from '../../lib/background-removal';
import { HistoryManager, type HistorySnapshot } from '../../lib/history';
import { createExportBlob, triggerDownload } from '../../lib/export-utils';
import { UploadZone } from './UploadZone';
import { ImagePreview } from './ImagePreview';
import { BackgroundPanel } from './BackgroundPanel';
import { CropPanel } from './CropPanel';
import { AdjustPanel } from './AdjustPanel';
import { SubjectPanel } from './SubjectPanel';
import { PhotoPresetSelector } from './PhotoPresetSelector';
import { ExportPanel } from './ExportPanel';

import {
  Undo2,
  Redo2,
  RotateCcw,
  Palette,
  Crop as CropIcon,
  Sliders,
  UserCheck,
  FileBadge,
  Download,
  Upload,
  ArrowLeft,
  ImagePlus,
} from 'lucide-react';

export const EditorApp: React.FC = () => {
  // Main Editor State
  const [editorState, setEditorState] = useState<EditorState>({
    originalImage: null,
    originalWidth: 0,
    originalHeight: 0,
    originalFileName: '',
    originalFileSize: 0,

    foregroundImage: null,
    isBackgroundRemoved: false,
    isProcessing: false,
    processingProgress: 0,
    processingStage: '',

    background: { type: 'color', color: '#FFFFFF' },
    adjustments: { ...DEFAULT_ADJUSTMENTS },
    subjectTransform: { ...DEFAULT_SUBJECT_TRANSFORM },
    subjectShadow: { ...DEFAULT_SUBJECT_SHADOW },
    crop: {
      active: false,
      aspectRatio: 'free',
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      rotation: 0,
      flipH: false,
      flipV: false,
    },

    activePreset: null,
    showFaceGuide: false,

    exportFormat: 'png',
    exportQuality: 'high',
    exportWidth: 0,
    exportHeight: 0,
    lockAspectRatio: true,

    activeTab: 'background',
    beforeAfterMode: 'off',
    showBefore: false,
    splitPosition: 50,
  });

  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // History stack manager (50 individual steps capacity)
  const historyRef = useRef<HistoryManager>(new HistoryManager(50));
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activeFieldRef = useRef<string | null>(null);

  // Helper to extract serializable snapshot from state
  const getSnapshotFromState = useCallback((state: EditorState): HistorySnapshot => ({
    background: { ...state.background },
    adjustments: { ...state.adjustments },
    subjectTransform: { ...state.subjectTransform },
    subjectShadow: { ...state.subjectShadow },
    crop: { ...state.crop },
    activePreset: state.activePreset ? { ...state.activePreset } : null,
    exportWidth: state.exportWidth,
    exportHeight: state.exportHeight,
  }), []);

  // Immediately commit a snapshot as a distinct history step
  const commitHistory = useCallback((snapshot: HistorySnapshot, description?: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    activeFieldRef.current = null;
    const recorded = historyRef.current.record({ ...snapshot, description });
    if (recorded) {
      setCanUndo(historyRef.current.canUndo());
      setCanRedo(historyRef.current.canRedo());
    }
  }, []);

  // Queue continuous changes (sliders, text inputs) and auto-commit per field
  const queueHistoryChange = useCallback((snapshot: HistorySnapshot, fieldId?: string) => {
    // If the user changed from one control to a different control,
    // commit the previous control's adjustment immediately as its own step!
    if (activeFieldRef.current && fieldId && activeFieldRef.current !== fieldId) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      historyRef.current.record(snapshot);
      setCanUndo(historyRef.current.canUndo());
      setCanRedo(historyRef.current.canRedo());
    }

    activeFieldRef.current = fieldId || null;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      activeFieldRef.current = null;
      const recorded = historyRef.current.record(snapshot);
      if (recorded) {
        setCanUndo(historyRef.current.canUndo());
        setCanRedo(historyRef.current.canRedo());
      }
    }, 300);
  }, []);

  // Apply a snapshot to editor state
  const applySnapshot = useCallback((snap: HistorySnapshot) => {
    setEditorState((state) => ({
      ...state,
      background: snap.background,
      adjustments: snap.adjustments,
      subjectTransform: snap.subjectTransform,
      subjectShadow: snap.subjectShadow,
      crop: snap.crop,
      activePreset: snap.activePreset,
      exportWidth: snap.exportWidth,
      exportHeight: snap.exportHeight,
    }));
  }, []);

  // Handle Image Selection and In-Browser Background Removal
  const handleImageSelected = async (fileOrBlob: File | Blob | string, fileName: string, fileSize: number) => {
    setEditorState((prev) => ({
      ...prev,
      isProcessing: true,
      processingProgress: 10,
      processingStage: 'Loading image...',
      originalFileName: fileName,
      originalFileSize: fileSize,
    }));

    try {
      let origImg: HTMLImageElement;
      if (typeof fileOrBlob === 'string') {
        origImg = await new Promise((res, rej) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => res(img);
          img.onerror = rej;
          img.src = fileOrBlob;
        });
      } else {
        origImg = await blobToImage(fileOrBlob);
      }

      setEditorState((prev) => ({
        ...prev,
        originalImage: origImg,
        originalWidth: origImg.width,
        originalHeight: origImg.height,
        exportWidth: origImg.width,
        exportHeight: origImg.height,
        crop: {
          ...prev.crop,
          width: origImg.width,
          height: origImg.height,
        },
        processingStage: 'Removing background...',
        processingProgress: 30,
      }));

      // In-browser client-side AI background removal
      const { image: isolatedForeground } = await removeImageBackground(fileOrBlob, (p) => {
        setEditorState((prev) => ({
          ...prev,
          processingStage: p.stage,
          processingProgress: p.progress,
        }));
      });

      // Clear history on new image upload and set baseline snapshot
      const initialSnapshot: HistorySnapshot = {
        background: { type: 'color', color: '#FFFFFF' },
        adjustments: { ...DEFAULT_ADJUSTMENTS },
        subjectTransform: { ...DEFAULT_SUBJECT_TRANSFORM },
        subjectShadow: { ...DEFAULT_SUBJECT_SHADOW },
        crop: {
          active: false,
          aspectRatio: 'free',
          x: 0,
          y: 0,
          width: origImg.width,
          height: origImg.height,
          rotation: 0,
          flipH: false,
          flipV: false,
        },
        activePreset: null,
        exportWidth: origImg.width,
        exportHeight: origImg.height,
        description: 'Original Image',
      };
      historyRef.current.init(initialSnapshot);
      setCanUndo(false);
      setCanRedo(false);

      setEditorState((prev) => ({
        ...prev,
        foregroundImage: isolatedForeground,
        isBackgroundRemoved: true,
        isProcessing: false,
        processingProgress: 100,
        activeTab: 'background',
      }));
    } catch (err) {
      console.error('Failed to process image:', err);
      alert('Could not process this image. Please verify it is a valid JPG, PNG, or WebP photo.');
      setEditorState((prev) => ({
        ...prev,
        isProcessing: false,
        processingProgress: 0,
      }));
    }
  };

  // State update helpers with individual step recording
  const updateBackground = (bg: BackgroundConfig, fieldName?: string) => {
    setEditorState((prev) => {
      const nextState = { ...prev, background: bg };
      const snap = getSnapshotFromState(nextState);
      if (
        fieldName === 'bg_preset' ||
        fieldName === 'bg_reset' ||
        fieldName === 'bg_transparent' ||
        fieldName === 'bg_custom_image' ||
        fieldName === 'bg_sample_image' ||
        fieldName === 'bg_remove_image' ||
        fieldName === 'bg_fit'
      ) {
        commitHistory(snap, 'Background Change');
      } else {
        queueHistoryChange(snap, fieldName || 'bg_color');
      }
      return nextState;
    });
  };

  const updateAdjustments = (adj: Adjustments, fieldName?: string) => {
    setEditorState((prev) => {
      const nextState = { ...prev, adjustments: adj };
      const snap = getSnapshotFromState(nextState);
      if (fieldName === 'reset_all_adj') {
        commitHistory(snap, 'Reset All Adjustments');
      } else {
        queueHistoryChange(snap, fieldName || 'adjust');
      }
      return nextState;
    });
  };

  const updateSubjectTransform = (trans: SubjectTransform, fieldName?: string) => {
    setEditorState((prev) => {
      const nextState = { ...prev, subjectTransform: trans };
      const snap = getSnapshotFromState(nextState);
      if (fieldName === 'subject_center' || fieldName === 'subject_reset_pos' || fieldName === 'subject_reset_scale') {
        commitHistory(snap, 'Subject Placement');
      } else {
        queueHistoryChange(snap, fieldName || 'subject_trans');
      }
      return nextState;
    });
  };

  const updateSubjectShadow = (sh: SubjectShadow, fieldName?: string) => {
    setEditorState((prev) => {
      const nextState = { ...prev, subjectShadow: sh };
      const snap = getSnapshotFromState(nextState);
      if (fieldName === 'shadow_enable') {
        commitHistory(snap, 'Shadow Toggle');
      } else {
        queueHistoryChange(snap, fieldName || 'subject_shadow');
      }
      return nextState;
    });
  };

  const updateCrop = (crop: CropState, fieldName?: string) => {
    setEditorState((prev) => {
      const nextState = {
        ...prev,
        crop,
        exportWidth: crop.width,
        exportHeight: crop.height,
      };
      const snap = getSnapshotFromState(nextState);
      if (
        fieldName === 'crop_ratio' ||
        fieldName === 'crop_rotate' ||
        fieldName === 'crop_fliph' ||
        fieldName === 'crop_flipv' ||
        fieldName === 'crop_reset'
      ) {
        commitHistory(snap, 'Crop Transformation');
      } else {
        queueHistoryChange(snap, fieldName || 'crop');
      }
      return nextState;
    });
  };

  const handleCommitCurrent = useCallback(() => {
    const snap = getSnapshotFromState(editorState);
    commitHistory(snap);
  }, [editorState, getSnapshotFromState, commitHistory]);

  const handleSelectPreset = (preset: PhotoPreset) => {
    const imgW = editorState.originalWidth;
    const imgH = editorState.originalHeight;

    let targetRatio = 1;
    if (preset.aspectRatio === '3:4') targetRatio = 0.75;
    else if (preset.aspectRatio === '4:3') targetRatio = 1.333;
    else if (preset.aspectRatio === '16:9') targetRatio = 1.777;

    let cropW = imgW;
    let cropH = imgH;
    if (imgW / imgH > targetRatio) {
      cropH = imgH;
      cropW = Math.round(cropH * targetRatio);
    } else {
      cropW = imgW;
      cropH = Math.round(cropW / targetRatio);
    }

    const cropX = Math.round((imgW - cropW) / 2);
    const cropY = Math.round((imgH - cropH) / 2);

    setEditorState((prev) => {
      const nextState = {
        ...prev,
        activePreset: preset,
        background: { type: 'color' as const, color: preset.defaultBg },
        showFaceGuide: preset.guideType !== 'none',
        exportWidth: preset.width,
        exportHeight: preset.height,
        crop: {
          ...prev.crop,
          aspectRatio: preset.aspectRatio,
          x: cropX,
          y: cropY,
          width: cropW,
          height: cropH,
        },
      };
      commitHistory(getSnapshotFromState(nextState), `Preset: ${preset.name}`);
      return nextState;
    });
  };

  // Step-by-step granular Undo and Redo
  const handleUndo = useCallback(() => {
    // If there is an active uncommitted debounce timer, cancel it
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
      activeFieldRef.current = null;

      // If current UI state has an uncommitted drag/input, restore last committed state
      const currentInHistory = historyRef.current.getCurrentSnapshot();
      if (currentInHistory) {
        const currentUI = getSnapshotFromState(editorState);
        if (JSON.stringify(currentUI) !== JSON.stringify(currentInHistory)) {
          applySnapshot(currentInHistory);
          setCanUndo(historyRef.current.canUndo());
          setCanRedo(historyRef.current.canRedo());
          return;
        }
      }
    }

    const prev = historyRef.current.undo();
    if (prev) {
      applySnapshot(prev);
    }
    setCanUndo(historyRef.current.canUndo());
    setCanRedo(historyRef.current.canRedo());
  }, [editorState, getSnapshotFromState, applySnapshot]);

  const handleRedo = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
      activeFieldRef.current = null;
    }

    const next = historyRef.current.redo();
    if (next) {
      applySnapshot(next);
    }
    setCanUndo(historyRef.current.canUndo());
    setCanRedo(historyRef.current.canRedo());
  }, [applySnapshot]);

  const handleResetAll = () => {
    if (window.confirm('Reset all changes and restore original background removal settings?')) {
      const resetSnapshot: HistorySnapshot = {
        background: { type: 'color', color: '#FFFFFF' },
        adjustments: { ...DEFAULT_ADJUSTMENTS },
        subjectTransform: { ...DEFAULT_SUBJECT_TRANSFORM },
        subjectShadow: { ...DEFAULT_SUBJECT_SHADOW },
        crop: {
          active: false,
          aspectRatio: 'free',
          x: 0,
          y: 0,
          width: editorState.originalWidth,
          height: editorState.originalHeight,
          rotation: 0,
          flipH: false,
          flipV: false,
        },
        activePreset: null,
        exportWidth: editorState.originalWidth,
        exportHeight: editorState.originalHeight,
        description: 'Reset All Settings',
      };
      commitHistory(resetSnapshot, 'Reset All Settings');
      applySnapshot(resetSnapshot);
    }
  };

  // Keyboard shortcut listeners (Ctrl+Z, Ctrl+Y, Ctrl+Shift+Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept undo/redo inside input elements while typing
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Export & Download
  const handleDownload = async () => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvas) return;

    setIsExporting(true);
    try {
      const { url } = await createExportBlob(
        canvas,
        editorState.exportWidth,
        editorState.exportHeight,
        editorState.exportFormat,
        editorState.exportQuality
      );

      const baseName = editorState.originalFileName.replace(/\.[^/.]+$/, '') || 'photo';
      const filename = `${baseName}-bg-changed.${editorState.exportFormat}`;
      triggerDownload(url, filename);
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to generate final download. Please try a different dimension or format.');
    } finally {
      setIsExporting(false);
    }
  };

  // Toggle Before / After mode
  const handleToggleBeforeAfter = () => {
    setEditorState((prev) => {
      let nextMode: 'off' | 'split' | 'toggle' = 'split';
      if (prev.beforeAfterMode === 'split') nextMode = 'toggle';
      else if (prev.beforeAfterMode === 'toggle') nextMode = 'off';
      return {
        ...prev,
        beforeAfterMode: nextMode,
        showBefore: nextMode === 'toggle',
      };
    });
  };

  // Toggle Face Guide overlay
  const handleToggleFaceGuide = () => {
    setEditorState((prev) => ({
      ...prev,
      showFaceGuide: !prev.showFaceGuide,
    }));
  };

  // Reset to Upload screen (Home)
  const handleStartOver = () => {
    historyRef.current.clear();
    setCanUndo(false);
    setCanRedo(false);
    setEditorState((prev) => ({
      ...prev,
      originalImage: null,
      foregroundImage: null,
      isBackgroundRemoved: false,
      isProcessing: false,
      activeTab: 'background',
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Navigation tab bar configuration
  const tabs = [
    { id: 'background', label: 'Background', icon: Palette },
    { id: 'crop', label: 'Crop', icon: CropIcon },
    { id: 'adjust', label: 'Adjust', icon: Sliders },
    { id: 'subject', label: 'Subject', icon: UserCheck },
    { id: 'preset', label: 'Photo Type', icon: FileBadge },
    { id: 'export', label: 'Export', icon: Download },
  ] as const;

  return (
    <div className="w-full min-h-[calc(100vh-140px)] flex flex-col justify-start">
      {!editorState.foregroundImage && !editorState.isProcessing ? (
        // Empty State / Initial Landing Upload Zone
        <div className="flex-1 flex flex-col justify-center">
          <UploadZone
            onImageSelected={handleImageSelected}
            isProcessing={editorState.isProcessing}
            processingStage={editorState.processingStage}
            processingProgress={editorState.processingProgress}
          />
        </div>
      ) : editorState.isProcessing ? (
        // Processing In-Progress View
        <div className="flex-1 flex items-center justify-center p-4">
          <UploadZone
            onImageSelected={handleImageSelected}
            isProcessing={editorState.isProcessing}
            processingStage={editorState.processingStage}
            processingProgress={editorState.processingProgress}
          />
        </div>
      ) : (
        // Active Multi-Panel Editor
        <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-2 sm:px-4 pb-8">
          {/* Editor Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 py-2 px-3 mb-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                type="button"
                id="btn-upload-next-image"
                onClick={handleStartOver}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-750 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer shadow-xs"
                title="Upload next image"
              >
                <ImagePlus className="w-3.5 h-3.5 text-blue-500" />
                <span>Upload Next Image</span>
              </button>

              <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

              <button
                type="button"
                onClick={handleUndo}
                disabled={!canUndo}
                className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleRedo}
                disabled={!canRedo}
                className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                title="Redo (Ctrl+Y)"
              >
                <Redo2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleResetAll}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
                title="Reset all edits to initial background removal"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Reset All</span>
              </button>
            </div>

            {/* Quick Export Button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setEditorState((prev) => ({ ...prev, activeTab: 'export' }))}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Export / Download</span>
              </button>
            </div>
          </div>

          {/* Desktop: Preview Left, Adjustments Right. Mobile: Preview Top, Adjustments Bottom */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start w-full">
            {/* Desktop Left Column / Mobile Top: Image Preview */}
            <div className="lg:col-span-7 xl:col-span-7 lg:sticky lg:top-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden flex flex-col justify-center min-h-[320px] sm:min-h-[400px] lg:h-[calc(100vh-160px)]">
              <ImagePreview
                editorState={editorState}
                onCropChange={updateCrop}
                onToggleBeforeAfter={handleToggleBeforeAfter}
                onToggleFaceGuide={handleToggleFaceGuide}
              />
            </div>

            {/* Desktop Right Column / Mobile Bottom: Tabs & Controls */}
            <div className="lg:col-span-5 xl:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden flex flex-col">
              {/* Control Tabs Navigation */}
              <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 p-2 overflow-x-auto scrollbar-none">
                <div className="flex items-center gap-1 min-w-max">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = editorState.activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() =>
                          setEditorState((prev) => ({ ...prev, activeTab: tab.id }))
                        }
                        className={`flex items-center gap-1.5 py-2 px-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Control Panel Content Area with vertical scrolling on desktop */}
              <div className="p-4 sm:p-5 overflow-y-auto max-h-[calc(100vh-250px)]">
                {editorState.activeTab === 'background' && (
                  <BackgroundPanel
                    background={editorState.background}
                    onChange={updateBackground}
                    onCommit={handleCommitCurrent}
                  />
                )}

                {editorState.activeTab === 'crop' && (
                  <CropPanel
                    crop={editorState.crop}
                    imgWidth={editorState.originalWidth}
                    imgHeight={editorState.originalHeight}
                    onChange={updateCrop}
                    onCommit={handleCommitCurrent}
                  />
                )}

                {editorState.activeTab === 'adjust' && (
                  <AdjustPanel
                    adjustments={editorState.adjustments}
                    onChange={updateAdjustments}
                    onCommit={handleCommitCurrent}
                  />
                )}

                {editorState.activeTab === 'subject' && (
                  <SubjectPanel
                    transform={editorState.subjectTransform}
                    shadow={editorState.subjectShadow}
                    onTransformChange={updateSubjectTransform}
                    onShadowChange={updateSubjectShadow}
                    onCommit={handleCommitCurrent}
                  />
                )}

                {editorState.activeTab === 'preset' && (
                  <PhotoPresetSelector
                    activePreset={editorState.activePreset}
                    onSelectPreset={handleSelectPreset}
                  />
                )}

                {editorState.activeTab === 'export' && (
                  <ExportPanel
                    currentWidth={editorState.crop.width || editorState.originalWidth}
                    currentHeight={editorState.crop.height || editorState.originalHeight}
                    exportFormat={editorState.exportFormat}
                    exportQuality={editorState.exportQuality}
                    exportWidth={editorState.exportWidth}
                    exportHeight={editorState.exportHeight}
                    lockAspectRatio={editorState.lockAspectRatio}
                    onFormatChange={(fmt) => setEditorState((prev) => ({ ...prev, exportFormat: fmt }))}
                    onQualityChange={(q) => setEditorState((prev) => ({ ...prev, exportQuality: q }))}
                    onDimensionsChange={(w, h) =>
                      setEditorState((prev) => ({ ...prev, exportWidth: w, exportHeight: h }))
                    }
                    onLockRatioChange={(lock) =>
                      setEditorState((prev) => ({ ...prev, lockAspectRatio: lock }))
                    }
                    onDownload={handleDownload}
                    onUploadNext={handleStartOver}
                    isExporting={isExporting}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
