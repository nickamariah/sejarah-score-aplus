import { NextResponse } from "next/server";
import OpenAI from "openai";

// 🌟 Paksa pelayan Vercel tunggu sehingga 60 saat (Elak Timeout)
export const maxDuration = 60; 

export async function POST(req: Request) {
  try {
    // 1. Semak kewujudan API Key
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("API Key OpenAI tidak dijumpai dalam fail .env!");
    }

    // 2. Inisialisasi OpenAI
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    // 3. Ambil data yang dihantar dari frontend peperiksaan
    const data = await req.json();
    const { soalan, jawapanMurid, markahPenuh, skemaJawapan } = data;

    // 4. Bina Prompt Sistem & Peraturan Pemarkahan Khas Peperiksaan
   const systemPrompt = `Anda adalah Pemeriksa Kertas Ujian Sejarah KSSM yang adil, profesional, dan menyokong murid.

[ARAHAN KETAT PEMARKAHAN]
1. PERBANDINGAN MAKNA: Baca Jawapan Murid dan bandingkan dengan Skema Rasmi Cikgu. Jika Jawapan Murid mempunyai FAKTA ATAU MAKSUD YANG SAMA dengan skema, anda WAJIB menerimanya walaupun struktur ayat berbeza.
2. FLEKSIBEL & SINGKATAN UMUM: ABAIKAN kesalahan ejaan kecil. ANDA WAJIB MENERIMA singkatan (short form) yang lazim dalam Sejarah Malaysia (Contoh: KMM = Kesultanan Melayu Melaka, PTM = Persekutuan Tanah Melayu, SMM = Sultan Mahmud Shah).
3. KIRAAN MARKAH: Berikan markah secara adil dari 0 hingga maksimum ${markahPenuh} markah.
4. JANGAN GUNA PENGETAHUAN AM LUAR: Rujuk pada Skema Rasmi Cikgu SAHAJA, kecuali untuk menterjemah singkatan (akronim) murid.
5. Jika jawapan murid dibiarkan kosong, atau tiada kaitan langsung dengan skema, berikan 0 markah.
6. KOMEN: Berikan 1 AYAT PENDEK sahaja (Maksimum 10-15 perkataan) dalam Bahasa Melayu.

Hasilkan output format JSON SAHAJA seperti struktur tepat begini:
{
  "markahDicadangkan": (nombor integer), 
  "komen": "(ayat ringkas)"
}`;

    // 5. Susun Maklumat Soalan untuk AI Periksa
    const userPrompt = `[MAKLUMAT SOALAN]
Soalan: "${soalan}"
Markah Penuh Maksimum: ${markahPenuh}
Skema Rasmi Cikgu: "${skemaJawapan || 'Tiada skema disediakan.'}"

[JAWAPAN MURID]
Jawapan Murid: "${jawapanMurid}"`;

    // 6. Panggil OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Model OpenAI yang pantas
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" }, 
      temperature: 0.1 
    });

    const responseText = response.choices[0]?.message?.content || "{}";
    const aiData = JSON.parse(responseText);
    
    let markahAkhir = Number(aiData.markahDicadangkan) || 0;
    if (markahAkhir > markahPenuh) {
        markahAkhir = markahPenuh;
    }
    
    // 7. Pulangkan markah ke sistem peperiksaan
    return NextResponse.json({
        markahDicadangkan: markahAkhir,
        komen: aiData.komen || "Semakan selesai.",
        rujukan: "Disemak oleh AI (gpt-4o-mini)"
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