import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

export async function POST(req: Request) {
  try {
    const data = await req.json();
    // KITA TAMBAH skemaJawapan DI SINI
    const { soalan, jawapanMurid, markahPenuh, skemaJawapan } = data;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // PROMPT RAG: AI KINI DIKAWAL OLEH SKEMA JAWAPAN GURU
    const prompt = `
      Anda adalah seorang Guru Sejarah yang pakar dan tegas menanda kertas ujian.
      Tugasan anda adalah untuk menyemak jawapan murid berdasarkan soalan dan SKEMA JAWAPAN RASMI berikut.
      
      Soalan: "${soalan}"
      Markah Penuh: ${markahPenuh}
      Skema Jawapan Rasmi / Nota Buku Teks: "${skemaJawapan || 'Gunakan pengetahuan sejarah tingkatan 4 dan 5 KPM.'}"
      
      Jawapan Murid: "${jawapanMurid}"
      
      ARAHAN PERMARKAHAN (SANGAT PENTING):
      1. Berikan markah HANYA jika jawapan murid menepati atau membawa maksud yang sama dengan Skema Jawapan Rasmi.
      2. Jangan berikan markah penuh jika jawapan murid tergantung.
      3. Berikan markah dari 0 hingga ${markahPenuh} sahaja.
      
      Format balasan anda MESTILAH dalam format JSON yang ketat seperti di bawah, tanpa sebarang teks tambahan:
      {
        "markahDicadangkan": (masukkan angka sahaja),
        "komen": "(Tuliskan ulasan pendek kenapa markah ini diberikan. Beritahu murid apa fakta yang betul dan apa fakta yang tertinggal berdasarkan skema.)"
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    const aiData = JSON.parse(cleanJson);

    return NextResponse.json(aiData);

  } catch (error) {
    console.error("Ralat AI:", error);
    return NextResponse.json({ ralat: "Gagal menyemak dengan AI" }, { status: 500 });
  }
}