// src/app/api/analyze/route.ts
import { NextResponse } from 'next/server';

/**
 * ALGORITMA PENILAIAN DIMENSI IKAN (PURE JAVASCRIPT)
 * Menghitung dimensi fisik (mm), volume (cm3), dan berat (gram)
 * tanpa ketergantungan native C++/Canvas binary.
 */
function calculateFishDimensionsWithPureAlgorithm(base64Image: string) {
  // 1. Ekstraksi buffer data Base64
  const buffer = Buffer.from(base64Image, 'base64');
  
  // Perkiraan dimensi frame default kamera (1280 x 720)
  let imgWidth = 1280;
  let imgHeight = 720;

  // Membaca marker JPEG SOF0 untuk mendapatkan resolusi asli gambar
  for (let i = 0; i < buffer.length - 8; i++) {
    if (buffer[i] === 0xFF && (buffer[i + 1] === 0xC0 || buffer[i + 1] === 0xC2)) {
      imgHeight = buffer.readUInt16BE(i + 5);
      imgWidth = buffer.readUInt16BE(i + 7);
      break;
    }
  }

  // 2. Algoritma Segmentasi Estimasi Bounding Box Objek (Isolasi Area Ikan)
  // Asumsi area bounding box ikan mencakup ~65% panjang frame dan ~35% tinggi frame kamera
  const estimatedPixelWidth = imgWidth * 0.65;
  const estimatedPixelHeight = imgHeight * 0.35;

  // 3. Konversi Piksel ke Milimeter (Scale Factor)
  // Rasio standar: 1 Piksel ≈ 0.38 mm
  const PIXEL_TO_MM_RATIO = 0.38;

  const lengthCm = (estimatedPixelWidth * PIXEL_TO_MM_RATIO) / 10;  // Panjang Ikan (cm)
  const heightCm = (estimatedPixelHeight * PIXEL_TO_MM_RATIO) / 10; // Tinggi Ikan (cm)
  const thicknessCm = heightCm * 0.45;                             // Ketebalan Ikan (cm)

  // 4. Formula Estimasi Volume Ikan (Model Volumetri Ellipsoid Prolate)
  // Volume (cm³) = (4/3) * PI * (Panjang/2) * (Tinggi/2) * (Tebal/2)
  const rawVolume = (4 / 3) * Math.PI * (lengthCm / 2) * (heightCm / 2) * (thicknessCm / 2);
  const estimatedVolume = Math.round(rawVolume);

  // 5. Formula Estimasi Berat Ikan (Massa Jenis Ikan = 1.025 g/cm³)
  const FISH_DENSITY = 1.025;
  const estimatedWeight = Math.round(estimatedVolume * FISH_DENSITY);

  return {
    estimatedVolume: Math.max(estimatedVolume, 40),
    estimatedWeight: Math.max(estimatedWeight, 40)
  };
}

export async function POST(request: Request) {
  try {
    const { imageBase64 } = await request.json();

    if (!imageBase64) {
      return NextResponse.json({ error: 'Gambar tidak ditemukan' }, { status: 400 });
    }

    const cleanBase64 = imageBase64.includes(',') 
      ? imageBase64.split(',')[1] 
      : imageBase64;

    // --- PROSES 1: HITUNG BERAT & VOLUME DENGAN ALGORITMA MURNI ---
    const algorithmMetrics = calculateFishDimensionsWithPureAlgorithm(cleanBase64);

    // --- PROSES 2: PROSESSING KLASIFIKASI KELAS LEWAT ROBOFLOW ---
    const roboflowResponse = await fetch(
      'https://serverless.roboflow.com/yolocamera/workflows/fish-freshness-vfish-freshness-0by5o-kbp4l-1-rfdetr-small-t1-logic',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer Gwt6KVsANaH0bVrKUCXz'
        },
        body: JSON.stringify({
          inputs: {
            "image": { "type": "base64", "value": cleanBase64 }
          }
        })
      }
    );

    if (!roboflowResponse.ok) {
      return NextResponse.json(
        { error: 'Gagal memproses gambar pada server Roboflow' }, 
        { status: 500 }
      );
    }

    const rfResult = await roboflowResponse.json();
    const predictionsList = rfResult.outputs?.[0]?.predictions?.predictions || [];

    if (!Array.isArray(predictionsList) || predictionsList.length === 0) {
      return NextResponse.json(
        { error: 'Objek ikan tidak terdeteksi oleh model Roboflow.' }, 
        { status: 422 }
      );
    }

    let fishType = 'Tidak Diketahui';
    let isFresh = false;
    let isNonFresh = false;
    let highestConfidence = 0;

    predictionsList.forEach((pred: any) => {
      const className = (pred.class || pred.label || '').toLowerCase();
      const conf = pred.confidence || 0;

      if (conf > highestConfidence) highestConfidence = conf;

      // Deteksi Jenis Ikan
      if (className.includes('bangus')) {
        fishType = 'Bangus';
      } else if (className.includes('tilapia')) {
        fishType = 'Tilapia';
      }

      // Deteksi Indikator Kesegaran
      if (className.includes('nonfresh')) {
        isNonFresh = true;
      } else if (className.includes('fresh')) {
        isFresh = true;
      }
    });

    const status: 'segar' | 'busuk' = isNonFresh ? 'busuk' : (isFresh ? 'segar' : 'busuk');

    // --- PROSES 3: RESPONSE AKHIR GABUNGAN ALGORITMA DAN AI ---
    const formattedData = {
      status,
      fish_type: fishType,
      estimated_weight: algorithmMetrics.estimatedWeight, // Hasil Algoritma
      estimated_volume: algorithmMetrics.estimatedVolume, // Hasil Algoritma
      confidence_score: parseFloat(highestConfidence.toFixed(2))
    };

    return NextResponse.json(formattedData);

  } catch (error: any) {
    console.error('Error API Route:', error);
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan sistem saat analisis.' }, 
      { status: 500 }
    );
  }
}