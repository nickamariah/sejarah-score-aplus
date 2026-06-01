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

    // MATIKAN PENAPIS KESELAMATAN
    const safetySettings = [
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE }
    ];

    // GUNA MODEL gemini-2.0-flash (Paling stabil dalam senarai awak)
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash", 
        safetySettings: safetySettings,
        generationConfig: { responseMimeType: "application/json" }
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
    
    // CARA PALING RINGKAS MEMANGGIL AI
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    let cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    const startIndex = cleanJson.indexOf('{');
    const endIndex = cleanJson.lastIndexOf('}');
    if (startIndex !== -1 && endIndex !== -1) {
      cleanJson = cleanJson.substring(startIndex, endIndex + 1);
    }
    
    const aiData = JSON.parse(cleanJson);
    
    return NextResponse.json({
        markahDicadangkan: aiData.markahDicadangkan,
        komen: aiData.komen,
        rujukan: "Skema Bank Soalan Sahaja"
    });

  } catch (error: any) {
    // 👇👇👇 INI BAHAGIAN PALING PENTING SEKARANG 👇👇👇
    console.error("\n======================================");
    console.error("🚨 RALAT KRONIK AI SEBENAR MUNCUL DI SINI:");
    console.error(error);
    console.error("======================================\n");
    
    return NextResponse.json({ 
        markahDicadangkan: 0, 
        komen: `SISTEM AI GAGAL. Sila lihat terminal VS Code untuk ralat sebenar.`,
        rujukan: "Gagal"
    });
  }
}