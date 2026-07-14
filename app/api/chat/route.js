import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    // 🌟 TAMBAHAN BARU: Kita pastikan 'aras' diterima dari Frontend
    const { studentId, chapterId, text, previousMessages, currentPhase, aras } = await req.json();

    // ==========================================
    // 1. RAG DINAMIK: SUBTOPIK, BANK SOALAN & INKUIRI
    // ==========================================
    let notaRujukan = "";
    let soalanSebenar = "";
    
    // PEMBOLEH UBAH DINAMIK UNTUK SOALAN INKUIRI
    let soalanTanya = "";
    let soalanTeroka = "";
    let soalanAnalisis = "";
    let soalanRefleksi = "";

    if (chapterId === "tingkatan4_bab1_sub1.1" || chapterId === "tingkatan4_bab1") {
      notaRujukan = `
        Subtopik 1.1: Konsep Alam Melayu.
        Kerajaan Alam Melayu mempunyai 4 ciri-ciri asas pembentukan negara bangsa: Raja, Undang-undang, Wilayah Pengaruh, dan Rakyat.
      `;
      soalanSebenar = `- Soalan SPM: Jelaskan ciri-ciri negara bangsa kerajaan Alam Melayu. (4 Markah)`;
      
      soalanTanya = "Mengapakah kerajaan Alam Melayu boleh dianggap sebagai sebuah negara bangsa?";
      soalanTeroka = "Cuba cari dalam nota. Apakah bukti pertama yang anda temui?";
      soalanAnalisis = "Antara raja dan undang-undang, yang manakah lebih penting dalam pembentukan negara bangsa? Mengapa?";
      soalanRefleksi = "Jika sesebuah negara tiada undang-undang hari ini, adakah ia boleh kekal stabil seperti kerajaan dahulu?";
    } 
    else if (chapterId === "tingkatan4_bab1_sub1.2") {
      notaRujukan = `
        Subtopik 1.2: Ciri-ciri Negara Bangsa Kesultanan Melayu Melaka.
        Kerajaan Melaka mempunyai ciri seperti kerajaan, rakyat, kedaulatan, wilayah pengaruh, undang-undang, dan lambang kebesaran.
      `;
      soalanSebenar = `- Soalan SPM: Nyatakan ciri negara bangsa Kesultanan Melayu Melaka. (4 Markah)`;
      
      soalanTanya = "Apakah yang membuatkan Kesultanan Melayu Melaka diiktiraf sebagai model negara bangsa yang sangat unggul?";
      soalanTeroka = "Berdasarkan nota, cuba cari satu ciri Kesultanan Melayu Melaka yang tiada pada kerajaan sebelumnya.";
      soalanAnalisis = "Mengapakah 'lambang kebesaran' sangat penting kepada Sultan Melaka pada waktu itu berbanding sekarang?";
      soalanRefleksi = "Pada pendapat awak, adakah ciri-ciri Kesultanan Melayu Melaka ini masih diamalkan di Malaysia hari ini?";
    }

    // ==========================================
    // 1. LOGIK FASA INKUIRI (TAKSONOMI BLOOM)
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
    // 🌟 3. LOGIK ADAPTIF (PERSONA BERBEZA MENGIKUT ARAS)
    // ==========================================
    let personaTutor = "";
    const tahapMurid = aras ? aras.toLowerCase() : "rendah"; // Default ke rendah jika tiada data

    if (tahapMurid === "sederhana") {
      personaTutor = `
      [GAYA PENGAJARAN: FASILITATOR (SCAFFOLDING SEDERHANA)]
      - Anda berhadapan dengan murid Aras Sederhana. 
      - JANGAN BERIKAN JAWAPAN TERUS (No direct answers).
      - Berikan klu (hints) secara berperingkat dan pancing murid dengan soalan berbalik (probing questions).
      - Jika murid salah, tegur dengan baik dan suruh mereka rujuk semula [KONTEKS BUKU TEKS].`;
    } else {
      personaTutor = `
      [GAYA PENGAJARAN: PEMBIMBING PENUH (SCAFFOLDING TINGGI)]
      - Anda berhadapan dengan murid Aras Rendah.
      - Gunakan bahasa yang SANGAT RINGKAS, santai dan mudah difahami.
      - Berikan analogi mudah jika perlu. Pecahkan soalan kepada bahagian yang kecil.
      - Jika murid kelihatan buntu atau masih salah selepas diberi hint, TERUS BERIKAN JAWAPAN YANG BETUL beserta penerangan seringkas mungkin.`;
    }

    // ==========================================
    // 4. SYSTEM PROMPT (DENGAN OUTPUT JSON & ANTI-HALUSINASI)
    // ==========================================
    const systemPrompt = {
      role: "system",
      content: `Anda ialah "I-RAGS", tutor maya Sejarah.
      
      STATUS MURID SEKARANG: ${arahanFasa}
      
      ${personaTutor}

      PERATURAN KETAT (WAJIB PATUH 100%):
      1. SUMBER FAKTA: Nilai jawapan murid berdasarkan [KONTEKS BUKU TEKS] di bawah SAHAJA. JANGAN berhalusinasi atau tambah fakta luar.
      2. PANDUAN MENYOAL: Berpandukan [BANK SOALAN SEBENAR], bimbing murid supaya mereka dapat menjawab soalan aras peperiksaan tersebut.
      3. PENILAIAN JAWAPAN: Jika murid telah berjaya menjawab tugasan Fasa ini dengan betul, tetapkan "isPhaseComplete" kepada true dan puji usaha mereka. Jika belum capai objektif, "isPhaseComplete" mestilah false.
      4. FORMAT BALASAN: Gunakan bahasa Melayu santai, mesra, dan PENDEK (maksimum 3 ayat).

      [BANK SOALAN SEBENAR (JADIKAN PANDUAN BERTANYA)]:
      ${soalanSebenar}
      
      [KONTEKS BUKU TEKS]:
      ${notaRujukan}

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
      temperature: 0.1, // Suhu sangat rendah supaya AI skema dan ikut buku teks sahaja
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
    return new Response(JSON.stringify({ error: "Maaf, sistem I-RAGs sedang berehat sebentar." }), {
      status: 500,
    });
  }
}