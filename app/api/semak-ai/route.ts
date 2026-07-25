import { NextResponse } from "next/server";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// 🌟 KEMAS KINI PENTING: Paksa pelayan Vercel tunggu sehingga 60 saat (Elak Timeout)
export const maxDuration = 60; 

export async function POST(req: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("API Key tidak dijumpai!");
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const data = await req.json();
    const { soalan, jawapanMurid, markahPenuh, skemaJawapan } = data;

    const safetySettings = [
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE }
    ];

    // 🌟 KEMAS KINI: Guna nama model standard & Paksa output JSON tulen
    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash", 
        safetySettings: safetySettings,
        generationConfig: {
            responseMimeType: "application/json", // Ini jamin AI tak bagi teks mengarut selain JSON
        }
    });

    const prompt = `Anda adalah Pemeriksa Kertas Ujian Sejarah yang SANGAT TEGAS dan PANTAS.
      
[MAKLUMAT SOALAN]
Soalan: "${soalan}"
Markah Penuh: ${markahPenuh}
Jawapan Murid: "${jawapanMurid}"
Skema Rasmi Cikgu: "${skemaJawapan || 'Tiada skema disediakan.'}"

[ARAHAN KETAT]
1. ANDA DILARANG MENGGUNAKAN PENGETAHUAN AM ANDA. Rujuk Skema Rasmi Cikgu SAHAJA.
2. Jika Jawapan Murid membawa maksud yang sama atau fakta selari dengan Skema, ia MESTI DITERIMA.
3. Berikan markah wajar (Maksimum: ${markahPenuh}). Jika tiada kaitan langsung, beri markah 0.
4. Berikan 1 AYAT PENDEK sahaja untuk komen.

Hasilkan output format JSON SAHAJA seperti struktur tepat begini:
{"markahDicadangkan": (nombor integer), "komen": "(ayat ringkas)"}`;

    // =========================================================================
    // 🌟 SISTEM AUTO-RETRY
    // =========================================================================
    let maxCubaan = 3; 
    let masaTunggu = 2000; 
    let responseText = "";

    while (maxCubaan > 0) {
      try {
        const result = await model.generateContent(prompt);
        responseText = result.response.text();
        break; // BERJAYA!
      } catch (error: any) {
        if (error.message?.includes('503') || error.message?.includes('429')) {
          maxCubaan--;
          if (maxCubaan === 0) throw error; 
          
          console.log(`Server Google Sibuk. Menunggu ${masaTunggu/1000}s sebelum cuba lagi... (Baki: ${maxCubaan})`);
          await new Promise(resolve => setTimeout(resolve, masaTunggu));
          masaTunggu += 2000; 
        } else {
          throw error; 
        }
      }
    }
    // =========================================================================

    // Oleh kerana kita dah letak responseMimeType: "application/json" di atas, 
    // responseText kini dijamin 100% adalah JSON bersih. Boleh terus parse!
    const aiData = JSON.parse(responseText.trim());
    
    return NextResponse.json({
        markahDicadangkan: Number(aiData.markahDicadangkan) || 0,
        komen: aiData.komen || "Tiada ulasan.",
        rujukan: "Skema Bank Soalan"
    });

  } catch (error: any) {
    console.error("🚨 RALAT KRONIK AI SEMAKAN:", error.message || error);
    return NextResponse.json({ 
        markahDicadangkan: 0, 
        komen: `SISTEM AI GAGAL: ${error.message || "Talian Terputus"}. Sila semak secara manual.`,
        rujukan: "Gagal"
    });
  }
}