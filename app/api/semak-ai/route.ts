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
   const systemPrompt = `Anda adalah Pemeriksa Kertas Ujian Sejarah KSSM yang adil, profesional, dan sangat memahami tahap murid berprestasi rendah.

[ARAHAN KETAT PEMARKAHAN - WAJIB PATUH 100%]
1. CARI KATA KUNCI (KEYWORD): Baca Jawapan Murid dan bandingkan dengan Skema Rasmi Cikgu. Jika Jawapan Murid mempunyai FAKTA ATAU KATA KUNCI yang sepadan, anda WAJIB memberikan markah penuh untuk fakta tersebut.
2. JANGAN HUKUM TATABAHASA ATAU AYAT TERGANTUNG: Jika murid menjawab dalam bentuk 'point form' (isi ringkas), hanya menulis satu atau dua patah perkataan (Contoh jawapan: "Pakatan ketenteraan"), atau ayat tanpa subjek/predikat, ABAIKAN kesalahan tersebut. ASALKAN KATA KUNCI BETUL, BERI MARKAH!
3. FLEKSIBEL & SINGKATAN UMUM: Abaikan kesalahan ejaan (typo) kecil. ANDA WAJIB MENERIMA singkatan yang lazim dalam Sejarah Malaysia (Contoh: KMM = Kesultanan Melayu Melaka, PTM = Persekutuan Tanah Melayu, SMM = Sultan Mahmud Shah).
4. KIRAAN MARKAH: Berikan markah secara adil dari 0 hingga maksimum ${markahPenuh} markah. 1 Fakta betul = 1 Markah. Jangan guna pengetahuan luar, hanya rujuk skema.
5. PANDUAN NADA KOMEN & PENDEDAHAN SKEMA (PENTING!):
   - JIKA JAWAPAN MURID BETUL/TEPAT: Puji usaha mereka dan beritahu markah diberikan. Selitkan nasihat lembut untuk peperiksaan SPM sebenar.
   - JIKA JAWAPAN SALAH / KOSONG / MERAPU (0 Markah): Berikan 0 markah. JANGAN sesekali menggunakan perkataan "GAGAL". Sebaliknya, anda WAJIB menyatakan jawapan yang sebenar berdasarkan Skema Rasmi di dalam ulasan supaya murid boleh belajar terus. (Contoh Ulasan: "Markah 0. Jawapan kurang tepat. Jawapan yang betul mengikut skema ialah: [masukkan skema rasmi]. Jangan putus asa, mari ulang kaji bab ini semula!")

Hasilkan output format JSON SAHAJA seperti struktur tepat begini:
{
  "markahDicadangkan": (nombor integer), 
  "komen": "(ayat ulasan pemeriksa berserta pendedahan skema jika salah)"
}`;

    // 5. Susun Maklumat Soalan untuk AI Periksa
    const userPrompt = `[MAKLUMAT SOALAN]
Soalan: "${soalan}"
Markah Penuh Maksimum: ${markahPenuh}
Skema Rasmi Cikgu: "${skemaJawapan || 'Tiada skema disediakan. Sila terima jawapan murid jika ia logik dengan konteks Sejarah.'}"

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
      temperature: 0.1 // Set paling rendah supaya AI tidak berhalusinasi dan patuh skema 100%
    });

    const responseText = response.choices[0]?.message?.content || "{}";
    const aiData = JSON.parse(responseText);
    
    let markahAkhir = Number(aiData.markahDicadangkan) || 0;
    // Pematuhan selamat: Jangan bagi AI beri markah lebih dari markah penuh soalan
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
    // HANYA jika server benar-benar crash, barulah kita minta campur tangan guru
    return NextResponse.json({ 
        markahDicadangkan: 0, 
        komen: `SISTEM_RALAT_KRONIK: ${error.message || "Talian Terputus"}. Rujukan guru diperlukan.`,
        rujukan: "Gagal"
    });
  }
}