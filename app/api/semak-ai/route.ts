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

    // 🌟 MATIKAN PENAPIS KESELAMATAN (Tanpa import tambahan supaya tak error)
    const safetySettings = [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
    ];

    // Guna model gemini-2.0-flash (Sangat Stabil)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
      Anda adalah Pemeriksa Kertas Ujian Sejarah yang SANGAT TEGAS dan PANTAS.
      
      [MAKLUMAT SOALAN]
      Soalan: "${soalan}"
      Markah Penuh: ${markahPenuh}
      Jawapan Murid: "${jawapanMurid}"
      Skema Rasmi Cikgu: "${skemaJawapan || 'Tiada skema disediakan.'}"

      [ARAHAN KETAT]
      1. ANDA DILARANG MENGGUNAKAN PENGETAHUAN AM ANDA. Rujuk Skema Rasmi Cikgu SAHAJA.
      2. Jika Jawapan Murid menggunakan ayat yang berbeza tetapi MEMBAWA MAKSUD YANG SAMA atau mengandungi FAKTA yang selari dengan Skema, ia MESTI DITERIMA dan diberikan markah.
      3. Berikan markah yang wajar (Maksimum: ${markahPenuh}).
      4. Jika Jawapan Murid langsung tiada kaitan dengan isi Skema, barulah berikan markah 0.
      5. Berikan 1 AYAT PENDEK sahaja untuk komen.

      Hasilkan output format JSON SAHAJA seperti contoh ini:
      {"markahDicadangkan": 2, "komen": "Tepat sekali."}
    `;
    
    // Panggil AI dengan arahan keselamatan
    const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" },
        safetySettings: safetySettings as any
    });
    
    const responseText = result.response.text();

    // Perisai Pembersihan JSON
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
    // 🚨 INI SANGAT PENTING: Merekodkan Ralat Sebenar di Terminal VS Code!
    console.error("======================================");
    console.error("🚨 RALAT KRONIK AI SEBENAR:", error.message || error);
    console.error("======================================");
    
    let senaraiModelBolehGuna = "Gagal dikesan";
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
      const dataModel = await res.json();
      if (dataModel.models) {
        const modelGenerateContent = dataModel.models.filter((m: any) => 
            m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")
        );
        senaraiModelBolehGuna = modelGenerateContent.map((m: any) => m.name.replace('models/', '')).join(' | ');
      }
    } catch (err) {}

    return NextResponse.json({ 
        markahDicadangkan: 0, 
        komen: `SISTEM AI GAGAL.\n\nSenarai Model Aktif:\n👉 [ ${senaraiModelBolehGuna} ]`,
        rujukan: "Gagal"
    });
  }
}