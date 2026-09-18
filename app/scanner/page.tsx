'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Camera, 
  Upload, 
  Sparkles, 
  AlertCircle, 
  RefreshCw, 
  X, 
  CheckCircle2, 
  Video, 
  FileText, 
  ShieldCheck, 
  Image as ImageIcon 
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SEED_DEMO_ITEMS } from '@/lib/seedData';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const LOADING_STAGES = [
  'Preparing image for AI Vision analysis...',
  'Identifying item & material composition...',
  'Evaluating condition, repairability & reusability...',
  'Calculating EcoLoop circularity score & CO₂ savings...',
];

export default function ScannerPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Form & Image state
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [fileSizeStr, setFileSizeStr] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Camera state
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraLoading, setCameraLoading] = useState<boolean>(false);

  // Analysis & Error state
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [loadingStageIdx, setLoadingStageIdx] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Clean up camera stream on component unmount
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  // Multi-stage loading interval ticker
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAnalyzing) {
      setLoadingStageIdx(0);
      interval = setInterval(() => {
        setLoadingStageIdx((prev) => (prev < LOADING_STAGES.length - 1 ? prev + 1 : prev));
      }, 1200);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  // Helper to format bytes
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Canvas downscaler and normalization helper
  const compressAndNormalizeImage = (rawUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 1280;
        let width = img.width || 640;
        let height = img.height || 480;

        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          const normalized = canvas.toDataURL('image/jpeg', 0.85);
          resolve(normalized);
        } else {
          resolve(rawUrl);
        }
      };
      img.onerror = () => resolve(rawUrl);
      img.src = rawUrl;
    });
  };

  // File validation logic
  const validateAndProcessFile = (file: File) => {
    setErrorMsg('');

    if (!ALLOWED_TYPES.includes(file.type.toLowerCase()) && !file.name.match(/\.(jpg|jpeg|png|webp)$/i)) {
      setErrorMsg('Unsupported file format. Please upload a JPG, PNG, or WEBP image.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setErrorMsg(`File size exceeds 10 MB limit (${formatBytes(file.size)}). Please select a smaller image.`);
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => {
      setErrorMsg('Failed to read the selected image file. Please try another photo.');
    };
    reader.onload = async () => {
      const base64 = reader.result as string;
      const normalized = await compressAndNormalizeImage(base64);
      setImagePreview(normalized);
      setFileName(file.name);
      setFileSizeStr(formatBytes(Math.round((normalized.length * 3) / 4)));
      stopCameraStream();
      setIsCameraActive(false);
    };
    reader.readAsDataURL(file);
  };

  // Input change handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndProcessFile(file);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndProcessFile(file);
    }
  };

  // Camera handling
  const startCamera = async () => {
    setErrorMsg('');
    setCameraLoading(true);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser or device.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      streamRef.current = stream;
      setIsCameraActive(true);

      // Wait a tick for video element to render
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(console.error);
        }
      }, 100);
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      let msg = 'Camera access unavailable or permission denied. Falling back to file upload.';
      if (err.name === 'NotAllowedError') {
        msg = 'Camera permission was denied. Please allow camera access or upload an image file.';
      } else if (err.name === 'NotFoundError') {
        msg = 'No camera device found on this device. Please use file upload instead.';
      }
      setErrorMsg(msg);
      setIsCameraActive(false);
    } finally {
      setCameraLoading(false);
    }
  };

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    if (video.videoWidth === 0 || video.videoHeight === 0 || video.readyState < 2) {
      setErrorMsg('Camera stream is initializing. Please wait a moment and try again.');
      return;
    }

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, width, height);
      const rawDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setImagePreview(rawDataUrl);
      setFileName(`camera_capture_${Date.now()}.jpg`);
      setFileSizeStr(formatBytes(Math.round((rawDataUrl.length * 3) / 4)));
      stopCameraStream();
    }
  };

  // Reset selected image
  const handleReset = () => {
    setImagePreview(null);
    setFileName('');
    setFileSizeStr('');
    setErrorMsg('');
    stopCameraStream();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Submit scan to AI backend
  const handleAnalyze = async () => {
    if (!imagePreview || isAnalyzing) return;
    setIsAnalyzing(true);
    setErrorMsg('');

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imagePreview }),
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error || 'AI vision service is temporarily unavailable. Please try again.');
      }

      // Store scan data in sessionStorage for instant rendering on /scan/[id]
      const scanId = json.scanId || `scan-${Date.now()}`;
      const fullResult = {
        ...json.data,
        id: scanId,
        image_url: imagePreview,
        created_at: new Date().toISOString(),
        isDemoFallback: json.isDemoFallback,
      };

      sessionStorage.setItem(scanId, JSON.stringify(fullResult));
      router.push(`/scan/${scanId}`);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'AI vision service is temporarily unavailable. Please try again.');
      setIsAnalyzing(false);
    }
  };

  // Sample seed item picker for demo
  const handleQuickDemoSeed = (seedIndex: number) => {
    const seed = SEED_DEMO_ITEMS[seedIndex];
    setImagePreview(seed.image_url);
    setFileName(`${seed.item_name.toLowerCase().replace(/\s+/g, '_')}.jpg`);
    setFileSizeStr('Sample Demo Item');
    setErrorMsg('');
    stopCameraStream();
  };

  return (
    <div className="max-w-2xl mx-auto py-4 space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-100 text-brand-800 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-brand-600" />
          <span>Multimodal Vision AI</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">AI ITEM SCANNER</h1>
        <p className="text-slate-500 text-sm max-w-lg mx-auto">
          Take a photo or upload an image of an unwanted item. EcoLoop will determine its best next life.
        </p>
      </div>

      <Card className="p-6 space-y-6">
        {/* Validation Error Banner */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold">{errorMsg}</span>
            </div>
            <button type="button" onClick={() => setErrorMsg('')} className="text-rose-500 hover:text-rose-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 1. Live Camera Stream UI */}
        {isCameraActive ? (
          <div className="space-y-4">
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-lg flex items-center justify-center">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover" 
              />
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                <span>Live Camera Active</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={capturePhoto} className="flex-1 shadow-md shadow-brand-600/20">
                <Camera className="w-5 h-5" />
                <span>Capture Photo</span>
              </Button>
              <Button variant="outline" onClick={stopCameraStream}>
                <span>Cancel</span>
              </Button>
            </div>
          </div>
        ) : /* 2. Upload / Drag and Drop Zone */
        !imagePreview ? (
          <div className="space-y-4">
            <div 
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all space-y-4 group ${
                isDragging 
                  ? 'border-brand-500 bg-brand-50/50 scale-[1.01]' 
                  : 'border-slate-300 hover:border-brand-500 bg-slate-50/70 hover:bg-brand-50/30'
              }`}
            >
              <div className="w-16 h-16 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform shadow-xs">
                <Camera className="w-8 h-8" />
              </div>

              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {isDragging ? 'Drop Image Here' : 'Upload Image or Drag & Drop'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Supports JPG, JPEG, PNG, WEBP (Max 10 MB)
                </p>
              </div>

              <div className="flex justify-center gap-3 pt-2" onClick={(e) => e.stopPropagation()}>
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-4 h-4" />
                  <span>Choose File</span>
                </Button>

                <Button type="button" variant="secondary" size="sm" onClick={startCamera} disabled={cameraLoading}>
                  <Video className="w-4 h-4 text-brand-400" />
                  <span>{cameraLoading ? 'Opening Camera...' : 'Use Camera'}</span>
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* 3. Image Preview & Action Controls */
          <div className="space-y-4">
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 shadow-md">
              <img src={imagePreview} alt="Item Preview" className="w-full h-full object-contain" />

              {/* Multi-stage Loading Overlay */}
              {isAnalyzing && (
                <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-md flex flex-col items-center justify-center text-white p-6 text-center space-y-4">
                  <RefreshCw className="w-10 h-10 animate-spin text-brand-400" />
                  <div className="space-y-1">
                    <p className="font-bold text-base tracking-wide text-white">
                      {LOADING_STAGES[loadingStageIdx]}
                    </p>
                    <p className="text-xs text-slate-300">
                      Step {loadingStageIdx + 1} of 4 • EcoLoop Multimodal Vision
                    </p>
                  </div>

                  <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                    <div 
                      className="h-full bg-brand-400 transition-all duration-700" 
                      style={{ width: `${((loadingStageIdx + 1) / 4) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Metadata Pill */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div className="flex items-center gap-2 text-slate-700 font-medium truncate">
                <ImageIcon className="w-4 h-4 text-brand-600 shrink-0" />
                <span className="truncate">{fileName || 'Selected Image'}</span>
              </div>
              {fileSizeStr && (
                <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-bold text-[11px] shrink-0 ml-2">
                  {fileSizeStr}
                </span>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <Button 
                onClick={handleAnalyze} 
                className="flex-1 shadow-md shadow-brand-600/20" 
                disabled={isAnalyzing}
              >
                <Sparkles className="w-4 h-4" />
                <span>{isAnalyzing ? 'Analyzing Item...' : 'Analyze Item with AI'}</span>
              </Button>

              <Button 
                variant="outline" 
                onClick={handleReset} 
                disabled={isAnalyzing}
              >
                <span>Remove / Replace</span>
              </Button>
            </div>
          </div>
        )}

        <input 
          ref={fileInputRef} 
          type="file" 
          accept="image/jpeg,image/jpg,image/png,image/webp" 
          className="hidden" 
          onChange={handleFileChange} 
        />

        {/* Demo Seed Items Presets */}
        <div className="pt-4 border-t border-slate-100 space-y-4">
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-3 text-center">
              Or select a pre-loaded sample item to test:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {SEED_DEMO_ITEMS.slice(0, 5).map((seed, i) => (
                <button
                  key={i}
                  type="button"
                  disabled={isAnalyzing}
                  onClick={() => handleQuickDemoSeed(i)}
                  className="p-2 rounded-xl border border-slate-200 bg-white hover:border-brand-400 hover:bg-brand-50/50 text-left transition-all text-xs space-y-1 disabled:opacity-50"
                >
                  <div className="aspect-square rounded-lg bg-slate-100 overflow-hidden">
                    <img src={seed.image_url} alt={seed.item_name} className="w-full h-full object-cover" />
                  </div>
                  <span className="font-medium text-slate-800 line-clamp-1 block text-[11px]">{seed.item_name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* User Guidance Box */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <span>📸 For better AI results</span>
            </h4>
            <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-600 font-medium">
              <li className="flex items-center gap-1"><span>• Place 1 item in frame</span></li>
              <li className="flex items-center gap-1"><span>• Use good lighting</span></li>
              <li className="flex items-center gap-1"><span>• Keep item centered</span></li>
              <li className="flex items-center gap-1"><span>• Avoid heavy blur</span></li>
              <li className="flex items-center gap-1"><span>• Show complete item</span></li>
              <li className="flex items-center gap-1"><span>• Clean background</span></li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
