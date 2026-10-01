import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { EditorState } from '../../lib/types';
import { renderCompositedImage } from '../../lib/image-processing';
import { Eye, SplitSquareVertical, User, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface ImagePreviewProps {
  editorState: EditorState;
  onCropChange?: (crop: EditorState['crop']) => void;
  onToggleBeforeAfter?: () => void;
  onToggleFaceGuide?: () => void;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  editorState,
  onCropChange,
  onToggleBeforeAfter,
  onToggleFaceGuide,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const beforeCanvasRef = useRef<HTMLCanvasElement>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [splitPos, setSplitPos] = useState<number>(50); // 0 to 100
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);

  // Render the processed/composited canvas
  const renderCanvas = useCallback(() => {
    if (!canvasRef.current || !editorState.foregroundImage) return;

    renderCompositedImage({
      canvas: canvasRef.current,
      sourceImage: editorState.foregroundImage,
      originalFullImage: editorState.originalImage,
      background: editorState.background,
      adjustments: editorState.adjustments,
      subjectTransform: editorState.subjectTransform,
      subjectShadow: editorState.subjectShadow,
      crop: editorState.crop,
      showOriginalOnly: false,
    });
  }, [
    editorState.foregroundImage,
    editorState.originalImage,
    editorState.background,
    editorState.adjustments,
    editorState.subjectTransform,
    editorState.subjectShadow,
    editorState.crop,
  ]);

  // Render original for before/after comparison
  const renderBeforeCanvas = useCallback(() => {
    if (!beforeCanvasRef.current || !editorState.originalImage) return;
    const canvas = beforeCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = editorState.crop.width || editorState.originalImage.width;
    canvas.height = editorState.crop.height || editorState.originalImage.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw cropped portion of original
    ctx.drawImage(
      editorState.originalImage,
      editorState.crop.x,
      editorState.crop.y,
      editorState.crop.width,
      editorState.crop.height,
      0,
      0,
      canvas.width,
      canvas.height
    );
  }, [editorState.originalImage, editorState.crop]);

  useEffect(() => {
    renderCanvas();
    if (editorState.beforeAfterMode !== 'off') {
      renderBeforeCanvas();
    }
  }, [renderCanvas, renderBeforeCanvas, editorState.beforeAfterMode]);

  // Handle split slider drag
  const handleSplitMouseMove = (e: React.MouseEvent | MouseEvent) => {
    if (!isDraggingSplit || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    setSplitPos((x / rect.width) * 100);
  };

  const handleSplitTouchMove = (e: React.TouchEvent | TouchEvent) => {
    if (!isDraggingSplit || !containerRef.current) return;
    const touch = e.touches[0];
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(touch.clientX - rect.left, rect.width));
    setSplitPos((x / rect.width) * 100);
  };

  useEffect(() => {
    if (isDraggingSplit) {
      const up = () => setIsDraggingSplit(false);
      window.addEventListener('mousemove', handleSplitMouseMove);
      window.addEventListener('mouseup', up);
      window.addEventListener('touchmove', handleSplitTouchMove);
      window.addEventListener('touchend', up);
      return () => {
        window.removeEventListener('mousemove', handleSplitMouseMove);
        window.removeEventListener('mouseup', up);
        window.removeEventListener('touchmove', handleSplitTouchMove);
        window.removeEventListener('touchend', up);
      };
    }
  }, [isDraggingSplit]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-3 sm:p-5 select-none overflow-hidden">
      {/* Top Floating Quick Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-1.5 p-1 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-sm text-xs">
          <button
            type="button"
            onClick={onToggleBeforeAfter}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              editorState.beforeAfterMode !== 'off'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Toggle Before/After comparison"
          >
            <SplitSquareVertical className="w-3.5 h-3.5" />
            <span>Before / After</span>
          </button>

          <button
            type="button"
            onClick={onToggleFaceGuide}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              editorState.showFaceGuide
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Toggle ID/Passport Face Guide overlay"
          >
            <User className="w-3.5 h-3.5" />
            <span>Face Guide</span>
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="pointer-events-auto flex items-center gap-1 p-1 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-sm text-xs">
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.max(0.4, z - 0.15))}
            className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Zoom out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-[11px] px-1 text-slate-600 dark:text-slate-400">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.15))}
            className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Zoom in"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          {zoomLevel !== 1 && (
            <button
              type="button"
              onClick={() => setZoomLevel(1)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Main Preview Container with automatic viewport scaling */}
      <div
        ref={containerRef}
        className="relative max-w-full max-h-[44vh] lg:max-h-[calc(100vh-240px)] flex items-center justify-center rounded-2xl overflow-hidden shadow-md border border-slate-200 dark:border-slate-800 bg-checkered transition-transform duration-100"
        style={{
          transform: `scale(${zoomLevel})`,
          transformOrigin: 'center center',
        }}
      >
        {/* Processed Composite Canvas */}
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-[44vh] lg:max-h-[calc(100vh-240px)] object-contain block"
        />

        {/* Split Screen Before / After Comparison */}
        {editorState.beforeAfterMode === 'split' && (
          <div
            className="absolute inset-0 overflow-hidden pointer-events-none"
            style={{ width: `${splitPos}%` }}
          >
            <canvas
              ref={beforeCanvasRef}
              className="max-w-none max-h-[50vh] sm:max-h-[58vh] md:max-h-[64vh] object-contain block"
              style={{
                width: containerRef.current?.clientWidth,
                height: containerRef.current?.clientHeight,
              }}
            />
            {/* "Before" label tag */}
            <div className="absolute top-4 left-4 px-2 py-0.5 rounded bg-black/70 text-white text-[11px] font-bold tracking-wider uppercase pointer-events-none">
              Original
            </div>
          </div>
        )}

        {/* Split Divider Bar */}
        {editorState.beforeAfterMode === 'split' && (
          <div
            onMouseDown={() => setIsDraggingSplit(true)}
            onTouchStart={() => setIsDraggingSplit(true)}
            className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize flex items-center justify-center pointer-events-auto"
            style={{ left: `${splitPos}%` }}
          >
            <div className="w-6 h-6 -ml-2.5 rounded-full bg-white dark:bg-slate-900 border-2 border-blue-500 shadow-md flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            </div>
          </div>
        )}

        {/* Toggle Mode "Original" overlay */}
        {editorState.beforeAfterMode === 'toggle' && editorState.showBefore && (
          <div className="absolute inset-0 pointer-events-none">
            <canvas
              ref={beforeCanvasRef}
              className="w-full h-full object-contain block"
            />
            <div className="absolute top-4 left-4 px-2.5 py-1 rounded bg-black/80 text-white text-xs font-bold tracking-wider uppercase">
              Viewing Original
            </div>
          </div>
        )}

        {/* Passport / ID Face Guide Overlay (Non-destructive overlay only) */}
        {editorState.showFaceGuide && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center border-2 border-dashed border-amber-400/80 rounded-lg">
            {/* Top guide label */}
            <div className="absolute top-2 px-2 py-0.5 rounded bg-amber-500/90 text-white text-[10px] font-bold tracking-wider uppercase">
              Face & Crown Guide
            </div>

            {/* Oval Head Guide */}
            <div className="w-[50%] h-[65%] rounded-[50%] border-2 border-amber-400/90 shadow-[0_0_12px_rgba(245,158,11,0.3)] relative">
              {/* Eye level line */}
              <div className="absolute top-[42%] left-0 right-0 border-b border-dashed border-amber-300/80 flex justify-between px-2 text-[9px] text-amber-200">
                <span>Eye Line</span>
                <span>Eye Line</span>
              </div>
              {/* Chin level line */}
              <div className="absolute bottom-[10%] left-[10%] right-[10%] border-b border-dashed border-amber-300/80 text-center text-[9px] text-amber-200">
                Chin
              </div>
            </div>

            <div className="absolute bottom-2 text-center text-[10px] text-amber-300/90 font-medium bg-black/60 px-2 py-0.5 rounded">
              Position head inside oval • Align eyes with eye line
            </div>
          </div>
        )}
      </div>

      {/* Dimensions & Info bar below preview */}
      <div className="mt-3 flex items-center justify-center gap-3 text-xs text-slate-500 dark:text-slate-400">
        <span>
          Canvas: <strong className="text-slate-700 dark:text-slate-200">{editorState.crop.width || editorState.originalWidth} × {editorState.crop.height || editorState.originalHeight} px</strong>
        </span>
        {editorState.crop.rotation !== 0 && (
          <span>• Rotation: {editorState.crop.rotation}°</span>
        )}
        {editorState.background.type === 'color' ? (
          <span className="flex items-center gap-1.5">
            • Bg:
            <span
              className="w-3 h-3 rounded-full border border-slate-300 dark:border-slate-700 inline-block"
              style={{ backgroundColor: editorState.background.color }}
            />
            {editorState.background.color}
          </span>
        ) : (
          <span>• Bg: Transparent</span>
        )}
      </div>
    </div>
  );
};
