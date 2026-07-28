import { NextResponse } from "next/server";
import OpenAI from "openai";

// 🌟 KEMAS KINI PENTING: Paksa pelayan Vercel tunggu sehingga 60 saat (Elak Timeout)
export const maxDuration = 60; 

export async function POST(req: Request) {
  try {
    // Pastikan cikgu ada OPENAI_API_KEY dalam fail .env
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("API Key OpenAI tidak dijumpai!");
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const data = await req.json();
    const { soalan, jawapanMurid, markahPenuh, skemaJawapan } = data;

    // 🌟 KEMAS KINI PROMPT: Lebih spesifik supaya tidak kedekut markah
    const systemPrompt = `Anda adalah Pemeriksa Kertas Ujian Sejarah KSSM yang adil.

[ARAHAN KETAT PEMARKAHAN]
1. PERBANDINGAN TEPAT: Jika Jawapan Murid sama dengan Skema Rasmi (TOLONG ABAIKAN perbezaan huruf besar/huruf kecil, ejaan sikit-sikit, atau koma), ANDA WAJIB MEMBERIKAN MARKAH PENUH (${markahPenuh}).
2. Jika jawapan murid ditulis menggunakan ayat sendiri tetapi membawa MAKSUD ATAU FAKTA YANG SAMA dengan skema, ia MESTI DITERIMA dan diberi markah.
3. ANDA DILARANG MENGGUNAKAN PENGETAHUAN AM ANDA. Rujuk Skema Rasmi Cikgu SAHAJA.
4. Jika tiada kaitan langsung dengan skema, barulah beri markah 0.
5. Berikan 1 AYAT PENDEK sahaja untuk komen menyokong markah yang diberi.

Hasilkan output format JSON SAHAJA seperti struktur tepat begini:
{"markahDicadangkan": (nombor integer), "komen": "(ayat ringkas)"}`;

    const userPrompt = `[MAKLUMAT SOALAN]
Soalan: "${soalan}"
Markah Penuh Maksimum: ${markahPenuh}
Jawapan Murid: "${jawapanMurid}"
Skema Rasmi Cikgu: "${skemaJawapan || 'Tiada skema disediakan.'}"`;

    // =========================================================================
    // 🌟 PANGGILAN API OPENAI DENGAN FORMAT JSON
    // =========================================================================
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Model OpenAI yang murah, pantas, dan pintar
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" }, // Paksa OpenAI bagi JSON 100%
      temperature: 0.1 // Suhu rendah supaya AI tidak berhalusinasi masa periksa
    });

    const responseText = response.choices[0]?.message?.content || "{}";
    const aiData = JSON.parse(responseText);
    
    return NextResponse.json({
        markahDicadangkan: Number(aiData.markahDicadangkan) || 0,
        komen: aiData.komen || "Tiada ulasan.",
        rujukan: "Skema Bank Soalan"
    });

  } catch (error: any) {
    console.error("🚨 RALAT KRONIK AI SEMAKAN (OPENAI):", error.message || error);
    return NextResponse.json({ 
        markahDicadangkan: 0, 
        komen: `SISTEM AI GAGAL: ${error.message || "Talian Terputus"}. Sila semak secara manual.`,
        rujukan: "Gagal"
    });
  }
}