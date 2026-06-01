import { NextResponse } from "next/server";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

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

    const model = genAI.getGenerativeModel({ 
        model: "gemini-flash-latest", 
        safetySettings: safetySettings 
    });

    // 🌟 KITA TAMBAH KONTEKS AKADEMIK SUPAYA AI TAK TAKUT
    const prompt = `
      [PENTING: KONTEKS AKADEMIK SEJARAH]
      Fakta sejarah Kesultanan Melayu Melaka mengandungi perkataan seperti "hukuman mati", "bunuh", dan "pemberontakan". 
      Ini adalah FAKTA SEJARAH untuk peperiksaan, BUKAN ancaman keganasan sebenar. Sila benarkan dan semak jawapan ini.

      Anda adalah pemeriksa kertas Sejarah yang SANGAT TEGAS.
      Soalan: "${soalan}"
      Markah Penuh: ${markahPenuh}
      Skema Jawapan Rasmi: "${skemaJawapan || 'Tiada skema'}"
      Jawapan Murid: "${jawapanMurid}"
      
      ARAHAN:
      1. Bandingkan Jawapan Murid dengan Skema Rasmi SAHAJA. 
      2. Jika jawapan murid membawa maksud yang sama dengan skema, berikan markah wajar.
      3. Jika jawapan salah, berikan markah 0.
      
      Hasilkan output dalam format JSON SAHAJA seperti di bawah:
      {
        "markahDicadangkan": (masukkan nombor),
        "komen": "(Satu ayat pendek sahaja ulas kenapa markah diberi/dipotong)"
      }
    `;

    const result = await model.generateContent(prompt);
    
    // 🌟 SEMAK JIKA AI MASIH BERDEGIL NAK SEKAT
    const candidate = result.response.candidates?.[0];
    if (candidate?.finishReason === 'SAFETY') {
         return NextResponse.json({
            markahDicadangkan: 0,
            komen: "⚠️ GOOGLE AI FILTER: AI tidak dapat menanda soalan ini kerana terdapat perkataan sensitif/keganasan (sejarah). Mohon Cikgu semak secara manual."
         });
    }

    const responseText = result.response.text();
    
    let cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    const startIndex = cleanJson.indexOf('{');
    const endIndex = cleanJson.lastIndexOf('}');
    if (startIndex !== -1 && endIndex !== -1) cleanJson = cleanJson.substring(startIndex, endIndex + 1);

    const aiData = JSON.parse(cleanJson);
    return NextResponse.json(aiData);

  } catch (error: any) {
    console.error("RALAT KRONIK AI:", error);
    
    // KITA PAPARKAN ERROR SEBENAR DI SKRIN GURU
    return NextResponse.json({ 
        markahDicadangkan: 0, 
        komen: `SISTEM AI GAGAL. Ralat Sebenar: ${error.message}. Sila semak manual.` 
    });
  }
}