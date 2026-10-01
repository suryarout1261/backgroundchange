import React, { useRef, useState } from 'react';
import { Upload, Image as ImageIcon, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';

interface UploadZoneProps {
  onImageSelected: (file: File | string, fileName: string, fileSize: number) => void;
  isProcessing: boolean;
  processingStage: string;
  processingProgress: number;
}

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
const SUPPORTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const UploadZone: React.FC<UploadZoneProps> = ({
  onImageSelected,
  isProcessing,
  processingStage,
  processingProgress,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndProcess = (file: File) => {
    setErrorMessage(null);

    if (!SUPPORTED_TYPES.includes(file.type) && !file.name.match(/\.(jpe?g|png|webp)$/i)) {
      setErrorMessage('Unsupported format. Please upload a JPG, PNG, or WebP image.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage('File size exceeds 25 MB. Please select a smaller photo.');
      return;
    }

    onImageSelected(file, file.name, file.size);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    if (isProcessing) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcess(e.target.files[0]);
    }
  };

  const handleSampleClick = async (sampleUrl: string, sampleName: string) => {
    try {
      setErrorMessage(null);
      const res = await fetch(sampleUrl);
      const blob = await res.blob();
      const file = new File([blob], sampleName, { type: 'image/jpeg' });
      onImageSelected(file, sampleName, file.size);
    } catch {
      setErrorMessage('Unable to load sample photo. Please try uploading a file.');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
          <span>Free Online Image & Photo Background Changer • 100% Private</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Background Changer
        </h1>
        <p className="mt-3 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
          Instantly <span className="font-semibold text-slate-800 dark:text-slate-200">remove background from image</span>, <span className="font-semibold text-slate-800 dark:text-slate-200">change photo background</span> to white, blue, or custom colors, edit your portrait, and download for free.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 mt-3 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Free Background Remover</span>
          <span>•</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> No Sign Up</span>
          <span>•</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Passport & Job Photo Presets</span>
          <span>•</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> 100% In-Browser</span>
        </div>
      </div>

      {/* Upload Box / Processing State */}
      {isProcessing ? (
        <div className="bg-white dark:bg-slate-900 border-2 border-blue-500/40 rounded-2xl p-10 sm:p-14 text-center shadow-xl shadow-blue-500/5 max-w-xl mx-auto">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-blue-200 dark:border-blue-900 animate-pulse"></div>
            <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-bounce" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Removing background...
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 font-medium">
            {processingStage || 'Analyzing portrait subject and isolating foreground...'}
          </p>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${Math.max(10, processingProgress)}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-4">
            Images never leave your browser. Processing runs securely on your device.
          </p>
        </div>
      ) : (
        <div>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                fileInputRef.current?.click();
              }
            }}
            className={`cursor-pointer group relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all duration-200 bg-white dark:bg-slate-900 ${
              isDragOver
                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 scale-[1.01]'
                : 'border-slate-300 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500/70 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-none'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              id="file-upload-input"
              aria-label="Upload photo"
            />

            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Upload className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
              Drop your image here
            </h3>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-4">
              or <span className="text-blue-600 dark:text-blue-400 underline underline-offset-4">click to browse</span> from your device
            </p>

            <button
              type="button"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition-all hover:shadow-lg hover:shadow-blue-500/30 active:scale-95"
            >
              <ImageIcon className="w-4 h-4" />
              Upload Image
            </button>

            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-600 dark:text-slate-300">Supported formats:</span>
              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px]">JPG</span>
              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px]">JPEG</span>
              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px]">PNG</span>
              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px]">WebP</span>
              <span>•</span>
              <span>Max file size: 25 MB</span>
            </div>
          </div>

          {errorMessage && (
            <div className="mt-4 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Instant Demo Samples */}
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 text-center">
            <p className="text-xs uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              Or test instantly with a sample portrait:
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => handleSampleClick('/samples/sample1.jpg', 'corporate-portrait.jpg')}
                className="group flex items-center gap-3 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 shadow-sm hover:shadow transition-all text-left"
              >
                <img
                  src="/samples/sample1.jpg"
                  alt="Job application photo background preview - professional business headshot"
                  className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
                  width="40"
                  height="40"
                  loading="lazy"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    Job Application Photo
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Professional Studio Sample
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSampleClick('/samples/sample2.jpg', 'id-passport-portrait.jpg')}
                className="group flex items-center gap-3 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 shadow-sm hover:shadow transition-all text-left"
              >
                <img
                  src="/samples/sample2.jpg"
                  alt="Passport photo background preview - official ID photo standard"
                  className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
                  width="40"
                  height="40"
                  loading="lazy"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    Passport & ID Photo
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Frontal ID Photo Sample
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
