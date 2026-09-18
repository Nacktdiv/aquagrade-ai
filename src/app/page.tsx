// src/app/page.tsx
'use client';

import { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { supabase } from '@/lib/supabaseClient';
import { Camera, AlertCircle, CheckCircle, XCircle, Loader2, Scale, Box, Sparkles } from 'lucide-react';
import { FishDetection } from '@/types/database.types';

export default function AnalysisPage() {
  const webcamRef = useRef<Webcam>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<FishDetection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState<boolean>(false);

  const captureAndAnalyze = useCallback(async () => {
    if (!webcamRef.current) return;
    
    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    const imageSrc = webcamRef.current.getScreenshot();
    
    if (!imageSrc) {
      setError("Gagal mengambil gambar dari kamera.");
      setIsAnalyzing(false);
      return;
    }

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: imageSrc })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal menganalisis gambar.");
      }

      const detectionResult: FishDetection = data;
      setResult(detectionResult);

      const { error: dbError } = await supabase
        .from('fish_detections')
        .insert([
          { 
            status: detectionResult.status,
            fish_type: detectionResult.fish_type,
            estimated_weight: detectionResult.estimated_weight,
            estimated_volume: detectionResult.estimated_volume,
            confidence_score: detectionResult.confidence_score
          }
        ]);

      if (dbError) {
        console.error("Supabase insert error:", dbError);
        setError("Berhasil dideteksi, tetapi gagal menyimpan ke database.");
      }

    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat menganalisis.");
    } finally {
      setIsAnalyzing(false);
    }
  }, [webcamRef]);

  return (
    <div className="max-w-3xl mx-auto flex flex-col items-center">
      {/* Header Halaman */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="inline-flex items-center space-x-2 bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
          <Sparkles size={14} />
          <span>Real-time AI Sorting</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-bold font-serif text-gray-900">Pemindaian Kualitas Ikan</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1 max-w-lg">
          Arahkan kamera ke seluruh tubuh atau bagian spesifik ikan untuk deteksi kesegaran & estimasi dimensi.
        </p>
      </div>

      {/* Frame Kamera */}
      <div className="w-full bg-black rounded-2xl overflow-hidden shadow-2xl mb-6 relative aspect-[4/3] sm:aspect-video border-2 border-gray-800 flex items-center justify-center">
        {!cameraReady && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10 bg-gray-950 p-4 text-center">
             <Camera size={40} className="mb-3 text-orange-500 animate-pulse" />
             <p className="text-sm font-medium">Memuat kamera perangkat...</p>
             <p className="text-xs text-gray-500 mt-1">Pastikan izin kamera sudah diberikan di browser.</p>
          </div>
        )}
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          screenshotQuality={0.85}
          videoConstraints={{ facingMode: "environment" }}
          onUserMedia={() => setCameraReady(true)}
          className="w-full h-full object-cover"
        />
        
        {/* Overlay Loading */}
        {isAnalyzing && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center z-20 p-4">
            <Loader2 size={48} className="animate-spin text-orange-500 mb-3" />
            <p className="text-white font-semibold text-base sm:text-lg tracking-wide">MENGANALISIS IKAN...</p>
            <p className="text-xs text-gray-400 mt-1">Klasifikasi Roboflow & Kalkulasi Algoritma</p>
          </div>
        )}
      </div>

      {/* Tombol Aksi */}
      <button
        onClick={captureAndAnalyze}
        disabled={isAnalyzing || !cameraReady}
        className={`w-full sm:w-auto min-w-[240px] px-8 py-3.5 rounded-full font-bold text-base shadow-xl transition-all transform active:scale-95 ${
          isAnalyzing || !cameraReady 
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none' 
            : 'bg-orange-500 hover:bg-orange-600 text-white hover:shadow-orange-500/25'
        }`}
      >
        {isAnalyzing ? 'Menganalisis...' : 'Analyze Object'}
      </button>

      {/* Log Error */}
      {error && (
        <div className="w-full mt-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex items-start shadow-sm">
          <AlertCircle className="text-red-500 mr-3 mt-0.5 flex-shrink-0" size={20} />
          <div>
            <h3 className="text-red-800 font-bold text-sm">Log Error</h3>
            <p className="text-red-700 text-xs sm:text-sm mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Tampilan Hasil Analisis */}
      {result && !error && (
        <div className="w-full mt-6 bg-white border border-gray-200 shadow-xl rounded-2xl overflow-hidden transition-all animate-in fade-in slide-in-from-bottom-4">
          <div className={`p-4 sm:p-5 text-white flex items-center justify-between ${result.status === 'segar' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
            <div className="flex items-center space-x-2.5">
              {result.status === 'segar' ? <CheckCircle size={28} /> : <XCircle size={28} />}
              <div>
                <span className="text-xs uppercase tracking-wider text-white/80 font-semibold block">Hasil Deteksi</span>
                <h3 className="font-bold text-lg sm:text-xl capitalize">
                  {result.fish_type} — <span className="underline decoration-2 underline-offset-4">{result.status}</span>
                </h3>
              </div>
            </div>
            <div className="bg-black/25 px-3 py-1.5 rounded-xl text-right">
              <span className="text-[10px] text-white/70 block uppercase font-mono">Confidence</span>
              <span className="font-mono font-bold text-sm sm:text-base">
                {(result.confidence_score * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          <div className="p-4 sm:p-6 grid grid-cols-2 gap-3 sm:gap-4 bg-gray-50/50">
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center space-x-3">
              <div className="p-2.5 bg-orange-100 text-orange-600 rounded-lg">
                <Scale size={24} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Estimasi Berat</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {result.estimated_weight} <span className="text-xs font-normal text-gray-500">gram</span>
                </p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center space-x-3">
              <div className="p-2.5 bg-blue-100 text-blue-600 rounded-lg">
                <Box size={24} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Estimasi Volume</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {result.estimated_volume} <span className="text-xs font-normal text-gray-500">cm&sup3;</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}