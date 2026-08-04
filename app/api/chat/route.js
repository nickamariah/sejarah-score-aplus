import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const maxDuration = 60; 

export async function POST(req) {
  try {
    const { 
      studentId, 
      chapterId, 
      text, 
      previousMessages, 
      currentPhase, 
      aras,
      soalanUjian,      
      skemaJawapan,     
      tajukBab,         
      tajukSubtopik,    
      kodSubtopik,      
      teksRujukanAI,
      mode              
    } = await req.json();

    const tahapMurid = aras ? aras.toLowerCase() : "rendah"; 
    const isPemulihan = mode === "pemulihan"; 

    // ==========================================
    // LOGIK PINTASAN FASA (BYPASS)
    // ==========================================
    let maxPhase = 6;
    if (isPemulihan) maxPhase = 3; 
    else if (tahapMurid === "rendah") maxPhase = 2;
    else if (tahapMurid === "sederhana") maxPhase = 3;

    if (currentPhase > maxPhase) {
      return new Response(JSON.stringify({
        reply: "Tahniah! Anda telah melengkapkan bimbingan yang diperlukan. Anda sudah bersedia! Sila klik terus ke fasa seterusnya untuk menamatkan sesi ini. 🎉",
        isPhaseComplete: true
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    // ==========================================
    // LOGIK FASA INKUIRI 
    // ==========================================
    let arahanFasa = "";
    if (currentPhase === 1) {
      arahanFasa = `FASA 1 (MENGINGAT): Uji fakta asas dari nota.`;
    } else if (currentPhase === 2) {
      arahanFasa = `FASA 2 (MEMAHAMI): Minta murid terangkan sedikit dengan ayat mudah.`;
    } else if (currentPhase === 3) {
      arahanFasa = `FASA 3 (MENGAPLIKASI): Minta murid kaitkan kesan ringkas.`;
    } else if (currentPhase === 4) {
      arahanFasa = `FASA 4 (MENGANALISIS): Minta perbandingan atau sebab-akibat.`;
    } else if (currentPhase === 5) {
      arahanFasa = `FASA 5 (MENILAI): Minta murid menilai kewajaran peristiwa.`;
    } else if (currentPhase === 6) {
      arahanFasa = `FASA 6 (MENCIPTA): Tanya 1 soalan rumusan KBAT.`;
    }

    // ==========================================
    // PERSONA TUTOR & STRATEGI SOALAN
    // ==========================================
    let personaTutor = "";
    if (isPemulihan) {
      personaTutor = `
      [GAYA PENGAJARAN: MOD PEMULIHAN (SANTAI, SERONOK & SANGAT MUDAH)]
      - Murid ini sedang mengulang kaji kerana tidak lulus ujian. Jangan streskan mereka!
      - Guna nada yang SANGAT ceria, beri motivasi, dan banyakkan guna emoji.
      - FORMAT MENGAJAR WAJIB: Berikan 2 hingga 3 isi penting (point form) dari Nota Rujukan dahulu, barulah tanya soalan mudah.
      - STRATEGI BANK SOALAN: Ambil soalan yang paling MUDAH / OBJEKTIF dari [BANK SOALAN] dan jadikan ia soalan isi tempat kosong atau beri pembayang huruf pangkal.`;
    } else if (tahapMurid === "sederhana") {
      personaTutor = `
      [GAYA PENGAJARAN: FASILITATOR (ARAS SEDERHANA)]
      - Anda hanya akan menguji sehingga Fasa 3 sahaja. JANGAN BERIKAN JAWAPAN TERUS. Berikan klu (hints).
      - STRATEGI BANK SOALAN: Rujuk [BANK SOALAN] dan ubah suai ayatnya supaya berbunyi seperti perbualan. Bimbing mereka menjawab berpandukan [SKEMA JAWAPAN].`;
    } else if (tahapMurid === "rendah") {
      personaTutor = `
      [GAYA PENGAJARAN: PEMBIMBING (ARAS RENDAH)]
      - Gunakan bahasa SANGAT RINGKAS. Jika buntu, TERUS BERIKAN JAWAPAN BETUL dan minta mereka taip semula.
      - STRATEGI BANK SOALAN: Pecahkan soalan dari [BANK SOALAN] kepada bahagian yang sangat kecil dan mudah.`;
    } else {
      personaTutor = `
      [GAYA PENGAJARAN: GURU PAKAR (ARAS TINGGI)]
      - Selitkan elemen soalan KBAT ala SPM sebenar.
      - STRATEGI BANK SOALAN: Gunakan soalan aras tinggi/struktur dari [BANK SOALAN] untuk mencabar pemikiran mereka.`;
    }

    // ==========================================
    // SYSTEM PROMPT KESELURUHAN
    // ==========================================
    const systemPrompt = {
      role: "system",
      content: `Anda ialah "I-RAGs Tutor", guru maya Sejarah KSSM yang santai dan menyokong.
      
      TOPIK SEKARANG: ${tajukBab || "Silibus KSSM"}
      SUBTOPIK: ${kodSubtopik || ""} - ${tajukSubtopik || "Topik Am"}
      FASA SEMASA: ${arahanFasa}
      
      ${personaTutor}

      PERATURAN KETAT (WAJIB PATUH 100%):
      1. PENGESANAN JAWAPAN: Jika murid menaip apa-apa sahaja, ANGGAP IA PERCUBAAN MENJAWAB. Jika separa betul, PUJI dan betulkan dengan lembut.
      2. PENERANGAN DETAIL: Jika murid tak faham, berikan penerangan beserta CONTOH/ANALOGI MUDAH.
      3. ANTI-ULANG: Jangan tanya soalan fakta yang sama berulang kali.
      4. KELULUSAN: Asalkan jawapan murid relevan/logik, TERUS LULUSKAN ("isPhaseComplete": true). HANYA puji jika lulus, dilarang tanya soalan baru dalam mesej kelulusan ini.
      5. KETEPATAN SEJARAH: Ejaan fakta mutlak dijaga, tapi abaikan typo kecil murid.
      
      🚨 6. UNDANG-UNDANG AKRONIM (ANTI-HALUSINASI): Jika murid meminta formula, cara mudah ingat, atau akronim, anda HANYA dibenarkan mencipta akronim dari huruf pangkal fakta yang WUJUD DALAM NOTA RUJUKAN sahaja. JANGAN mereka-reka istilah baharu atau terma yang salah di sisi silibus Sejarah!
      
      [NOTA RUJUKAN BUKU TEKS (FAKTA MUTLAK AI)]:
      ${teksRujukanAI || "Tiada nota khusus."}

      [BANK SOALAN PEPERIKSAAN (PRE/POST/PEMULIHAN)]:
      ${soalanUjian || "Gunakan kreativiti anda untuk membina soalan."}

      [SKEMA JAWAPAN SOALAN UJIAN]:
      ${skemaJawapan || "Tiada skema khusus."}
      
      🚨 ARAHAN BERTANYA SOALAN 🚨
      Setiap kali anda membalas, mesej 'reply' anda WAJIB diakhiri dengan SATU SOALAN kepada murid. 
      Sila UTAMAKAN MENGGUNAKAN SOALAN DARI KOTAK [BANK SOALAN PEPERIKSAAN] DI ATAS! Olah semula struktur ayat soalan tersebut menjadi lebih santai (chat style) bersesuaian dengan Fasa dan Tahap Murid. Ini adalah untuk mendedahkan mereka kepada soalan ujian sebenar tanpa mereka sedar.

      PENTING: Anda MESTI membalas dalam format JSON berikut:
      {
        "analisis_dalaman": "Adakah teks murid ini jawapan? Perlu beri nota ringkas point form? Lulus ke tidak?",
        "reply": "Mesej balasan mesra anda berserta SATU SOALAN dari Bank Soalan (diolah santai)...",
        "isPhaseComplete": true atau false
      }`
    };

    const messages = [
      systemPrompt,
      ...(previousMessages || []), 
      { role: "user", content: text } 
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", 
      messages: messages,
      temperature: 0.2, 
      response_format: { type: "json_object" } 
    });

    const aiOutput = JSON.parse(response.choices[0].message.content);

    return new Response(JSON.stringify({
      reply: aiOutput.reply,
      isPhaseComplete: aiOutput.isPhaseComplete
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Ralat pada API Chat I-RAGs:", error);
    return new Response(JSON.stringify({ 
        reply: "Maaf, cikgu tengah semak jawapan pelajar lain sekejap. Boleh awak hantar semula mesej tadi? 😅", 
        isPhaseComplete: false 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}