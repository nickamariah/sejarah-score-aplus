import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Pastikan API Key dibaca dari .env.local
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { soalan, jawapanMurid, markahPenuh } = data;

    // Pilih model Gemini (gemini-1.5-flash adalah paling pantas dan sesuai untuk tugasan ini)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // PROMPT KHAS UNTUK SISTEM I-RAGS (Boleh diubah suai ikut rubrik sebenar)
    const prompt = `
      Anda adalah seorang Guru Sejarah yang pakar menanda kertas ujian.
      Tugasan anda adalah untuk menyemak jawapan murid berdasarkan soalan berikut.
      
      Soalan: "${soalan}"
      Markah Penuh: ${markahPenuh}
      Jawapan Murid: "${jawapanMurid}"
      
      Sila nilaikan jawapan murid ini. Berikan markah dari 0 hingga ${markahPenuh} sahaja.
      Format balasan anda MESTILAH dalam format JSON yang ketat seperti di bawah, tanpa sebarang teks tambahan:
      {
        "markahDicadangkan": (masukkan angka sahaja),
        "komen": "(masukkan ulasan pendek kenapa markah ini diberikan)"
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // AI kadang-kadang letak markdown ```json ... ```, kita perlu buang untuk parse
    const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    const aiData = JSON.parse(cleanJson);

    return NextResponse.json(aiData);

  } catch (error) {
    console.error("Ralat AI:", error);
    return NextResponse.json({ ralat: "Gagal menyemak dengan AI" }, { status: 500 });
  }
}