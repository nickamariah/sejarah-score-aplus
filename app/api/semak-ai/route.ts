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

    // Kita cuba model standard
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
    
    let cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    const startIndex = cleanJson.indexOf('{');
    const endIndex = cleanJson.lastIndexOf('}');
    if (startIndex !== -1 && endIndex !== -1) cleanJson = cleanJson.substring(startIndex, endIndex + 1);

    const aiData = JSON.parse(cleanJson);
    return NextResponse.json(aiData);

  } catch (error: any) {
    console.error("RALAT KRONIK AI:", error);
    
    // 🕵️‍♂️ TAKTIK DETEKTIF: Tarik senarai model dari Google secara paksa!
    let senaraiModelBolehGuna = "Gagal dikesan";
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
      const dataModel = await res.json();
      if (dataModel.models) {
        // Tapis model yang hanya menyokong tugasan menanda (generateContent)
        const modelGenerateContent = dataModel.models.filter((m: any) => 
            m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")
        );
        senaraiModelBolehGuna = modelGenerateContent.map((m: any) => m.name.replace('models/', '')).join(' | ');
      }
    } catch (err) {
      console.error("Gagal tarik senarai model", err);
    }

    // Paparkan senarai model terus ke Dashboard Guru
    return NextResponse.json({ 
        markahDicadangkan: 0, 
        komen: `SISTEM AI GAGAL (Model 404).\n\nNamun, ini adalah senarai Model Google yang SAH & DIBENARKAN untuk API Key cikgu:\n\n👉 [ ${senaraiModelBolehGuna} ]\n\nSila copy-paste salah satu nama di atas kepada AI supaya kita boleh guna model tersebut!` 
    });
  }
}