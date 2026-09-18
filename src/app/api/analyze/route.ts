// src/app/api/analyze/route.ts
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY belum terpasang di .env.local' }, 
        { status: 500 }
      );
    }

    const { imageBase64 } = await request.json();

    if (!imageBase64) {
      return NextResponse.json({ error: 'Gambar tidak ditemukan' }, { status: 400 });
    }

    const base64Data = imageBase64.includes(',') 
      ? imageBase64.split(',')[1] 
      : imageBase64;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemma-4-31b-it' });

    const prompt = `
      Analyze this fish image.
      Determine status ("segar" or "busuk"), estimate weight in grams (integer), estimate volume in cm3 (integer), and confidence score (float 0.5 - 0.99).

      Return ONLY a single JSON object. No explanations, no backticks, no codeblocks.

      Example:
      {"status": "segar", "estimated_weight": 450, "estimated_volume": 300, "confidence_score": 0.92}
    `;

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: 'image/jpeg',
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text();

    // EKSTRAKSI NON-GREEDY: Menangkap objek JSON PERTAMA ({...}) saja secara tepat
    const jsonMatch = responseText.match(/\{[\s\S]*?\}/);

    if (!jsonMatch) {
      console.error('Raw Output AI tanpa JSON:', responseText);
      return NextResponse.json(
        { error: 'AI tidak mengembalikan struktur JSON yang valid.' },
        { status: 500 }
      );
    }

    // Parse objek JSON pertama yang berhasil ditangkap
    const detectionData = JSON.parse(jsonMatch[0]);

    return NextResponse.json(detectionData);

  } catch (error: any) {
    console.error('Error Gemma API Route:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal memproses gambar dengan Gemma.' },
      { status: 500 }
    );
  }
}