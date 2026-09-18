// src/app/page.tsx
'use client';

import { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { supabase } from '@/lib/supabaseClient';
import { Camera, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { FishDetection } from '@/types/database.types';

export default function AnalysisPage() {
  const webcamRef = useRef<Webcam>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<FishDetection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState<boolean>(false);

  // Fungsi MOCK untuk simulasi deteksi YOLOv8
  const mockAnalyzeFish = async (imageSrc: string): Promise<FishDetection> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.9) {
          reject(new Error("Objek ikan tidak terdeteksi dengan jelas."));
          return;
        }
        
        const isFresh = Math.random() > 0.4;
        resolve({
          status: isFresh ? 'segar' : 'busuk',
          estimated_weight: Math.floor(Math.random() * (1500 - 300 + 1) + 300),
          estimated_volume: Math.floor(Math.random() * (1000 - 200 + 1) + 200),
          confidence_score: parseFloat((Math.random() * (0.99 - 0.75) + 0.75).toFixed(2))
        });
      }, 2000);
    });
  };

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
      const detectionResult = await mockAnalyzeFish(imageSrc);
      setResult(detectionResult);

      const { error: dbError } = await supabase
        .from('fish_detections')
        .insert([
          { 
            status: detectionResult.status,
            estimated_weight: detectionResult.estimated_weight,
            estimated_volume: detectionResult.estimated_volume,
            confidence_score: detectionResult.confidence_score
          }
        ]);

      if (dbError) {
        console.error("Supabase insert error:", dbError);
        setError("Hasil berhasil dideteksi, tetapi gagal menyimpan ke database.");
      }

    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat menganalisis.");
    } finally {
      setIsAnalyzing(false);
    }
  }, [webcamRef]);

  return (
    <div className="max-w-4xl mx-auto flex flex-col items-center">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2 font-serif">Analisis Kualitas Ikan</h1>
        <p className="text-gray-600">Arahkan kamera ke ikan dan tekan Analyze untuk memulai.</p>
      </div>

      <div className="w-full bg-black rounded-lg overflow-hidden shadow-xl mb-6 relative aspect-video flex items-center justify-center">
        {!cameraReady && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10 bg-gray-900">
             <Camera size={48} className="mb-4 text-gray-500 animate-pulse" />
             <p>Memuat kamera...</p>
          </div>
        )}
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={{ facingMode: "environment" }}
          onUserMedia={() => setCameraReady(true)}
          className="w-full h-full object-cover"
        />
        
        {isAnalyzing && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
            <div className="flex flex-col items-center text-orange-500">
              <Loader2 size={48} className="animate-spin mb-2" />
              <p className="font-semibold tracking-wider">MENGANALISIS...</p>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={captureAndAnalyze}
        disabled={isAnalyzing || !cameraReady}
        className={`w-full md:w-auto px-8 py-4 rounded-full font-bold text-lg shadow-lg transition-all transform hover:scale-105 ${
          isAnalyzing || !cameraReady 
            ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
            : 'bg-orange-500 hover:bg-orange-600 text-white'
        }`}
      >
        {isAnalyzing ? 'Memproses...' : 'Analyze Object'}
      </button>

      {error && (
        <div className="w-full mt-8 bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start">
          <AlertCircle className="text-red-500 mr-3 mt-0.5" />
          <div>
            <h3 className="text-red-800 font-bold">Error Deteksi</h3>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {result && !error && (
        <div className="w-full mt-8 bg-white border border-gray-200 shadow-lg rounded-xl overflow-hidden">
          <div className={`p-4 text-white flex items-center justify-between ${result.status === 'segar' ? 'bg-green-600' : 'bg-red-600'}`}>
            <div className="flex items-center">
              <CheckCircle className="mr-2" />
              <h3 className="font-bold text-xl uppercase">Hasil: Ikan {result.status}</h3>
            </div>
            <span className="bg-black/20 px-3 py-1 rounded-full text-sm font-mono">
              Confidence: {result.confidence_score}
            </span>
          </div>
          <div className="p-6 grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg text-center border border-gray-100">
              <p className="text-sm text-gray-500 mb-1 uppercase tracking-wide">Estimasi Berat</p>
              <p className="text-2xl font-bold text-gray-900">{result.estimated_weight} <span className="text-base font-normal">gram</span></p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center border border-gray-100">
              <p className="text-sm text-gray-500 mb-1 uppercase tracking-wide">Estimasi Volume</p>
              <p className="text-2xl font-bold text-gray-900">{result.estimated_volume} <span className="text-base font-normal">cm&sup3;</span></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}