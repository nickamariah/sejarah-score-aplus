import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const maxDuration = 60; 

export async function POST(req) {
  try {
    const { 
      studentId, chapterId, text, previousMessages, currentPhase, aras,
      soalanUjian, skemaJawapan, tajukBab, tajukSubtopik, kodSubtopik, teksRujukanAI, mode              
    } = await req.json();

    const tahapMurid = aras ? aras.toLowerCase() : "rendah"; 
    const isPemulihan = mode === "pemulihan"; 

    // ==========================================
    // LOGIK PINTASAN FASA (BYPASS)
    // ==========================================
    let maxPhase = 6;
    if (isPemulihan) maxPhase = 3; 
    else if (tahapMurid === "rendah") maxPhase = 2;
    else if (tahapMurid === "sederhana") maxPhase = 4;

    if (currentPhase > maxPhase) {
      return new Response(JSON.stringify({
        reply: "Tahniah! Cikgu bangga dengan usaha awak. Awak dah berjaya faham semua pecahan topik ini dengan sangat baik. Sila klik butang ke soalan/fasa seterusnya untuk tamatkan sesi bimbingan ini ya! 🎉🔥",
        isPhaseComplete: true
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    // ==========================================
    // LOGIK FASA INKUIRI (PANDUAN AI)
    // ==========================================
    let arahanFasa = "";
    if (currentPhase === 1) arahanFasa = `FASA 1 (MENGINGAT): Tanyakan soalan fakta asas berbentuk "Siapakah", "Apakah", atau "Senaraikan...". PENTING: Anda mesti menguji fakta berbeza-beza dari nota secara berurutan.`;
    else if (currentPhase === 2) arahanFasa = `FASA 2 (MEMAHAMI): Minta murid JELASKAN atau TERANGKAN fakta yang mereka ingat tadi menggunakan ayat mereka sendiri.`;
    else if (currentPhase === 3) arahanFasa = `FASA 3 (MENGAPLIKASI): Minta murid berikan contoh ringkas atau kaitkan kesan peristiwa tersebut.`;
    else if (currentPhase === 4) arahanFasa = `FASA 4 (MENGANALISIS): Minta murid buat perbandingan atau nyatakan sebab-akibat.`;
    else if (currentPhase === 5) arahanFasa = `FASA 5 (MENILAI): Minta pendapat murid kewajaran sesuatu tindakan tokoh/peristiwa.`;
    else if (currentPhase === 6) arahanFasa = `FASA 6 (MENCIPTA): Tanya 1 soalan KBAT (Rumusan/Cadangan).`;

    // ==========================================
    // PERSONA TUTOR BERDASARKAN PSIKOLOGI PELAJAR
    // ==========================================
    let personaTutor = "";
    if (isPemulihan || tahapMurid === "rendah") {
      personaTutor = `
      [GAYA PENGAJARAN: PEMBIMBING LEMBUT (ARAS RENDAH & PEMULIHAN)]
      - PERHATIAN: Murid ini mudah putus asa (Low-Performing Student).
      - NADA: Sangat ceria, penyabar, guna banyak emoji. Guna ganti nama "Cikgu" dan "Awak".
      - TEKNIK MENYOAL: Pecahkan soalan. Jangan minta mereka senaraikan 3 perkara serentak. Minta 1 dahulu. Jika betul, baru minta yang ke-2.
      - TEKNIK BANTUAN: Jika murid buntu/salah, berikan klu berbentuk huruf pangkal atau 'isi tempat kosong'. Dilarang guna perkataan "Salah".`;
    } else if (tahapMurid === "sederhana") {
      personaTutor = `
      [GAYA PENGAJARAN: FASILITATOR (ARAS SEDERHANA)]
      - NADA: Mesra dan menyokong.
      - BANTUAN: Jangan berikan jawapan terus. Berikan 'Hint' (klu) yang kuat jika mereka buntu.`;
    } else {
      personaTutor = `
      [GAYA PENGAJARAN: GURU PAKAR (ARAS TINGGI)]
      - NADA: Profesional, menggalakkan pemikiran kritis.`;
    }

    // ==========================================
    // SYSTEM PROMPT KESELURUHAN (CORE BRAIN)
    // ==========================================
    const systemPrompt = {
      role: "system",
      content: `Anda ialah "Cikgu I-RAGs", seorang guru maya Sejarah KSSM yang pakar, sistematik dan penyayang.
      
      TOPIK SEMASA: ${tajukBab || "Sejarah KSSM"} | ${kodSubtopik || ""} - ${tajukSubtopik || ""}
      TUGASAN SEMASA: Anda sedang membimbing murid dalam ${arahanFasa}
      
      ${personaTutor}

      [PERATURAN KETAT - WAJIB PATUH 100%]:
      1. KESAHAN FAKTA (ANTI-HALLUCINATION): Rujuk HANYA pada [NOTA RUJUKAN]. Dilarang mencipta fakta luar.
      2. PENILAIAN JAWAPAN: Rujuk [SKEMA JAWAPAN]. Terima jawapan asalkan maknanya atau kata kuncinya hampir sama dengan skema. Abaikan typo.
      
      🚨 3. SAPAAN AWAL MURID (PENTING!): 
      - Jika mesej pertama murid hanyalah "Hai", "Assalamualaikum", "Selamat Pagi", atau mesej yang pendek/tiada kaitan dengan sejarah:
      - BALAS: Balas sapaan mereka secara ringkas.
      - KEMUDIAN TERUS TANYA: Berikan soalan pertama berkaitan nota.
      - WAJIB TETAPKAN "isPhaseComplete": false. Jangan sesekali tamatkan fasa pada waktu ini!
      
      🚨 4. SYARAT KELULUSAN FASA (isPhaseComplete) - SANGAT KETAT:
      - SECARA LALAI (DEFAULT): Nilai "isPhaseComplete" mestilah "false".
      - ANDA DILARANG SAMA SEKALI menetapkan "isPhaseComplete": true selagi murid BELUM menjawab SEKURANG-KURANGNYA DUA (2) SOALAN BERBEZA berkaitan komponen utama di dalam [NOTA RUJUKAN] dengan BETUL.
      - Jika murid baru jawab 1 soalan dengan betul: Puji mereka, kemudian TANYA SOALAN KE-2 dari bahagian lain dalam nota. Tetapkan "isPhaseComplete": false.
      - Hanya apabila murid telah berjaya menjawab 2 atau 3 maklumat penting, baru anda dibenarkan menetapkan "isPhaseComplete": true.

      5. BANTUAN JIKA MURID GAGAL: Jika murid kata "Tak tahu", beri klu (hint) yang sangat mudah. Minta mereka cuba teka. Set "isPhaseComplete": false.
      
      6. SATU SOALAN SAHAJA: Setiap kali anda membalas, HANYA SATU SOALAN dibenarkan di hujung mesej (Elakkan lambakan kognitif).
      
      [SUMBER PENGETAHUAN (RAG DATA)]:
      📌 NOTA RUJUKAN:
      ${teksRujukanAI || "Tiada nota khusus, gunakan pengetahuan asas silibus KSSM."}

      📌 SKEMA JAWAPAN (PANDUAN ANDA SAHAJA):
      ${skemaJawapan || "Terima jawapan yang logik dan berkaitan."}

      [FORMAT BALASAN (WAJIB JSON)]:
      Anda mesti membalas dalam format JSON tulen seperti di bawah:
      {
        "analisis_dalaman": "Adakah mesej ini sekadar sapaan? Berapa soalan fakta dah disoal? Jika baru 1, wajib letak isPhaseComplete false.",
        "reply": "Teks balasan anda (Pujian + Bimbingan + SATU Soalan seterusnya)...",
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
      temperature: 0.1, 
      response_format: { type: "json_object" } 
    });

    const aiOutput = JSON.parse(response.choices[0].message.content);

    return new Response(JSON.stringify({
      reply: aiOutput.reply,
      isPhaseComplete: aiOutput.isPhaseComplete
    }), { status: 200, headers: { "Content-Type": "application/json" } });

  } catch (error) {
    console.error("Ralat pada API Chat I-RAGs:", error);
    return new Response(JSON.stringify({ 
        reply: "Alamak, Cikgu I-RAGs tengah ada gangguan sambungan sikit ni. Boleh awak hantar semula mesej tadi? 😅", 
        isPhaseComplete: false 
    }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}