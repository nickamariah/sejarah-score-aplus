import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { soalan, jawapanMurid, markahPenuh, skemaJawapan } = data;

    // KEMAS KINI SUPER PENTING: Kita "kunci" model supaya wajib balas format JSON sahaja
    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: { responseMimeType: "application/json" } 
    });

    // PROMPT KEMAS KINI
    const prompt = `
      Anda adalah pemeriksa kertas Sejarah.
      
      Soalan: "${soalan}"
      Markah Penuh: ${markahPenuh}
      Skema Jawapan Rasmi: "${skemaJawapan || 'Gunakan pengetahuan sejarah yang tepat.'}"
      Jawapan Murid: "${jawapanMurid}"
      
      Berikan markah berdasarkan skema (0 hingga ${markahPenuh}).
      Hasilkan output JSON menggunakan skema struktur di bawah:
      {
        "markahDicadangkan": (masukkan nombor sahaja),
        "komen": "(Ulasan anda kenapa markah dipotong atau diberi)"
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Memandangkan kita dah paksa JSON, kita boleh terus 'parse' dengan selamat
    const aiData = JSON.parse(responseText);

    return NextResponse.json(aiData);

  } catch (error) {
    console.error("Ralat AI:", error);
    // Jika masih ralat, kita hantar mesej amaran ini supaya cikgu tahu apa yang berlaku
    return NextResponse.json({ 
        markahDicadangkan: 0, 
        komen: "Ralat! AI gagal menanda soalan ini. Sila semak terminal kod (VS Code) cikgu untuk butiran ralat." 
    });
  }
}