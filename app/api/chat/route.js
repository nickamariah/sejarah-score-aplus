import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 🌟 TAMBAHAN PENTING: Paksa pelayan (Vercel) tak timeout awal
export const maxDuration = 60; 

export async function POST(req) {
  try {
    // 🌟 1. TANGKAP SEMUA DATA DINAMIK DARI FRONTEND TERMASUK TEKS NOTA
    const { 
      studentId, 
      chapterId, 
      text, 
      previousMessages, 
      currentPhase, 
      aras,
      soalanUjian,      // <-- Data dari Bank Soalan (Firebase)
      skemaJawapan,     // <-- Data dari Bank Soalan (Firebase)
      tajukBab,         // <-- Nama Bab Sebenar
      tajukSubtopik,    // <-- Nama Subtopik Sebenar
      kodSubtopik,      // <-- Contoh: 1.1, 1.2
      teksRujukanAI     // <-- 🌟 TEKS BUKU TEKS YANG CIKGU PASTE DI ADMIN
    } = await req.json();

    // ==========================================
    // 2. LOGIK FASA INKUIRI (TAKSONOMI BLOOM)
    // ==========================================
    let arahanFasa = "";
    if (currentPhase === 1) {
      arahanFasa = `FASA 1 (MENGINGAT/MENGETAHUI): Uji hafalan atau pengetahuan asas murid berdasarkan [SKEMA JAWAPAN]. Tanya 1 soalan yang sangat mudah (Contoh: "Apakah...", "Siapakah...").`;
    } 
    else if (currentPhase === 2) {
      arahanFasa = `FASA 2 (MEMAHAMI): Minta murid terangkan semula apa yang mereka faham tentang fakta di Fasa 1 menggunakan ayat mereka sendiri.`;
    } 
    else if (currentPhase === 3) {
      arahanFasa = `FASA 3 (MENGAPLIKASI): Minta murid kaitkan fakta tersebut dengan situasi sejarah yang sedang dibincangkan.`;
    } 
    else if (currentPhase === 4) {
      arahanFasa = `FASA 4 (MENGANALISIS): Minta murid huraikan sebab dan akibat atau buat perbandingan.`;
    } 
    else if (currentPhase === 5) {
      arahanFasa = `FASA 5 (MENILAI): Minta murid buat penilaian, wajar atau tidak wajar sesuatu tindakan/peristiwa itu berlaku. Berikan sebab.`;
    }
    else if (currentPhase === 6) {
      arahanFasa = `FASA 6 (MENCIPTA/REFLEKSI): Tanya 1 soalan KBAT. Minta cadangan penyelesaian jika situasi ini berlaku pada masa sekarang.`;
    }

    // ==========================================
    // 3. LOGIK ADAPTIF (PERSONA BERBEZA MENGIKUT ARAS)
    // ==========================================
    let personaTutor = "";
    const tahapMurid = aras ? aras.toLowerCase() : "rendah"; 

    if (tahapMurid === "sederhana") {
      personaTutor = `
      [GAYA PENGAJARAN: FASILITATOR (SCAFFOLDING SEDERHANA)]
      - Anda berhadapan dengan murid Aras Sederhana. 
      - JANGAN BERIKAN JAWAPAN TERUS (No direct answers).
      - Berikan klu (hints) secara berperingkat dan pancing murid dengan soalan berbalik.
      - Jika salah, tegur dengan baik dan suruh rujuk semula fakta.`;
    } else {
      personaTutor = `
      [GAYA PENGAJARAN: PEMBIMBING PENUH (SCAFFOLDING TINGGI)]
      - Anda berhadapan dengan murid Aras Rendah.
      - Gunakan bahasa yang SANGAT RINGKAS, santai dan mudah difahami.
      - Berikan analogi mudah jika perlu. Pecahkan soalan kepada bahagian yang kecil.
      - Jika murid kelihatan buntu, TERUS BERIKAN JAWAPAN YANG BETUL beserta penerangan seringkas mungkin.`;
    }

    // ==========================================
    // 🌟 4. SYSTEM PROMPT (ANTI-HALUSINASI & BACA BUKU TEKS)
    // ==========================================
    const systemPrompt = {
      role: "system",
      content: `Anda ialah "I-RAGS", tutor maya Sejarah Malaysia KSSM.
      
      TOPIK PEMBELAJARAN SEKARANG: ${tajukBab || "Silibus KSSM"}
      SUBTOPIK KHUSUS: ${kodSubtopik || ""} - ${tajukSubtopik || "Topik Am"}

      STATUS MURID SEKARANG: ${arahanFasa}
      
      ${personaTutor}

      PERATURAN KETAT (WAJIB PATUH 100%):
      1. FOKUS KEPADA SUBTOPIK: Anda HANYA DIBENARKAN berbincang berkaitan subtopik "${tajukSubtopik}" sahaja. JANGAN sentuh subtopik lain.
      2. JAWAPAN MESTI BERSANDARKAN BUKU TEKS: Nilai dan bimbing murid menggunakan [NOTA RUJUKAN BUKU TEKS] yang dibekalkan di bawah sebagai fakta mutlak. Jangan reka fakta sendiri.
      3. PANDUAN MENYOAL: Berpandukan [BANK SOALAN] dan [SKEMA JAWAPAN], bimbing murid menjawab soalan secara berperingkat.
      4. PENILAIAN JAWAPAN: Jika murid telah berjaya menguasai fasa ini berdasarkan fakta Buku Teks/Skema, tetapkan "isPhaseComplete" kepada true. Jika belum, biarkan false.
      5. FORMAT BALASAN: Gunakan bahasa Melayu santai, mesra, dan PENDEK (maksimum 3 ayat). Tanya 1 soalan pada satu masa.

      [NOTA RUJUKAN BUKU TEKS (FAKTA MUTLAK AI)]:
      ${teksRujukanAI || "Tiada nota khusus. Gunakan pengetahuan am Sejarah KSSM anda berdasarkan silibus."}

      [BANK SOALAN UJIAN (MATLAMAT AKHIR PEMBELAJARAN)]:
      ${soalanUjian || "Tiada rekod soalan untuk subtopik ini."}
      
      [SKEMA JAWAPAN UJIAN]:
      ${skemaJawapan || "Tiada rekod skema."}

      PENTING: Anda MESTI membalas dalam format JSON yang sah (valid JSON) seperti ini:
      {
        "reply": "Mesej balasan anda kepada murid...",
        "isPhaseComplete": true atau false
      }
      `
    };

    const messages = [
      systemPrompt,
      ...(previousMessages || []), 
      { role: "user", content: text } 
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", 
      messages: messages,
      temperature: 0.1, // Suhu sangat rendah supaya AI "skema" dan lurus ikut Buku Teks sahaja
      response_format: { type: "json_object" } 
    });

    // Parse output JSON dari AI
    const aiOutput = JSON.parse(response.choices[0].message.content);

    return new Response(JSON.stringify(aiOutput), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Ralat pada API Chat I-RAGs:", error);
    // Kembalikan JSON yang betul supaya sistem frontend tak "crash"
    return new Response(JSON.stringify({ 
        reply: "Maaf, sistem pemikiran saya sedang memproses terlalu banyak data (Server Sibuk). Boleh awak ulang semula jawapan tadi?", 
        isPhaseComplete: false 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}