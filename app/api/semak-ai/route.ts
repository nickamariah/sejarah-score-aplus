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

    // Guna model yang ada dalam senarai aktif awak
    const model = genAI.getGenerativeModel({ 
        model: "gemini-flash-latest", 
        safetySettings: safetySettings 
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
3. Berikan markah wajar (Maksimum: ${markahPenuh}).
4. Jika tiada kaitan dengan Skema, markah 0.
5. Berikan 1 AYAT PENDEK sahaja untuk komen.

Hasilkan output format JSON SAHAJA seperti contoh ini:
{"markahDicadangkan": 2, "komen": "Tepat sekali."}`;

    // =========================================================================
    // 🌟 SISTEM AUTO-RETRY (CUBA SEMULA AUTOMATIK JIKA SERVER GOOGLE SIBUK)
    // =========================================================================
    let maxCubaan = 3; // Sistem akan cuba hantar 3 kali sebelum betul-betul mengalah
    let masaTunggu = 2000; // Mula dengan tunggu 2 saat
    let responseText = "";

    while (maxCubaan > 0) {
      try {
        const result = await model.generateContent(prompt);
        responseText = result.response.text();
        break; // BERJAYA! Terus keluar dari loop cubaan
      } catch (error: any) {
        // Jika ralat 503 (Sibuk) atau 429 (Limit), kita suruh sistem sabar dan cuba lagi
        if (error.message?.includes('503') || error.message?.includes('429')) {
          maxCubaan--;
          if (maxCubaan === 0) throw error; // Kalau dah 3 kali cuba pun gagal, baru keluar ralat sebenar
          
          console.log(`Server Google Sibuk. Menunggu ${masaTunggu/1000} saat sebelum cuba lagi... (Baki cubaan: ${maxCubaan})`);
          await new Promise(resolve => setTimeout(resolve, masaTunggu));
          masaTunggu += 2000; // Tambah masa tunggu jadi 4 saat pula
        } else {
          throw error; // Jika ralat lain, terus keluar ralat
        }
      }
    }
    // =========================================================================

    // Pembersihan JSON yang selamat
    let cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    const startIndex = cleanJson.indexOf('{');
    const endIndex = cleanJson.lastIndexOf('}');
    if (startIndex !== -1 && endIndex !== -1) {
      cleanJson = cleanJson.substring(startIndex, endIndex + 1);
    }
    
    const aiData = JSON.parse(cleanJson);
    
    return NextResponse.json({
        markahDicadangkan: aiData.markahDicadangkan || 0,
        komen: aiData.komen || "Tiada ulasan.",
        rujukan: "Skema Bank Soalan"
    });

  } catch (error: any) {
    console.error("🚨 RALAT KRONIK AI:", error.message || error);
    return NextResponse.json({ 
        markahDicadangkan: 0, 
        komen: `SISTEM AI GAGAL selepas beberapa kali cubaan (Server Google Terlalu Sibuk). Sila semak secara manual.`,
        rujukan: "Gagal"
    });
  }
}