import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("API Key tidak dijumpai!");
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const data = await req.json();
    const { soalan, jawapanMurid, markahPenuh, skemaJawapan } = data;

    // 1. KEMAS KINI NAMA MODEL KE "gemini-pro" (Paling stabil & pasti wujud)
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
      Anda adalah pemeriksa kertas Sejarah.
      Soalan: "${soalan}"
      Markah Penuh: ${markahPenuh}
      Skema Jawapan Rasmi: "${skemaJawapan || 'Gunakan pengetahuan sejarah yang tepat.'}"
      Jawapan Murid: "${jawapanMurid}"
      
      Berikan markah berdasarkan skema (0 hingga ${markahPenuh}).
      Hasilkan output dalam format JSON SAHAJA seperti di bawah:
      {
        "markahDicadangkan": (masukkan nombor),
        "komen": "(Ulasan kenapa markah dipotong atau diberi)"
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // 2. SISTEM PENCUCI JSON YANG KEBAL (Tapis markdown & ambil JSON sahaja)
    let cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    const startIndex = cleanJson.indexOf('{');
    const endIndex = cleanJson.lastIndexOf('}');
    
    if (startIndex !== -1 && endIndex !== -1) {
        cleanJson = cleanJson.substring(startIndex, endIndex + 1);
    }

    const aiData = JSON.parse(cleanJson);
    return NextResponse.json(aiData);

  } catch (error: any) {
    console.error("RALAT KRONIK AI:", error);
    return NextResponse.json({ 
        markahDicadangkan: 0, 
        komen: `SISTEM AI GAGAL! Punca: ${error.message || error}` 
    });
  }
}