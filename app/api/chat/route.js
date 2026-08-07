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
    // Murid lemah/pemulihan tidak perlu sampai fasa mencipta. Cukup fasa asas.
    if (isPemulihan) maxPhase = 3; 
    else if (tahapMurid === "rendah") maxPhase = 2;
    else if (tahapMurid === "sederhana") maxPhase = 4;

    if (currentPhase > maxPhase) {
      return new Response(JSON.stringify({
        reply: "Tahniah! Cikgu bangga dengan usaha awak. Awak dah berjaya faham topik ini dengan baik. Sila klik butang ke soalan seterusnya untuk tamatkan sesi bimbingan ini ya! 🎉🔥",
        isPhaseComplete: true
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    // ==========================================
    // LOGIK FASA INKUIRI (PANDUAN AI)
    // ==========================================
    let arahanFasa = "";
    if (currentPhase === 1) {
      arahanFasa = `FASA 1 (MENGINGAT): Tanyakan soalan fakta asas berbentuk "Siapakah", "Apakah", atau "Senaraikan SATU...".`;
    } else if (currentPhase === 2) {
      arahanFasa = `FASA 2 (MEMAHAMI): Minta murid terangkan sedikit menggunakan ayat mereka sendiri bersandarkan fakta.`;
    } else if (currentPhase === 3) {
      arahanFasa = `FASA 3 (MENGAPLIKASI): Minta murid berikan contoh atau kaitkan kesan ringkas sesuatu peristiwa.`;
    } else if (currentPhase === 4) {
      arahanFasa = `FASA 4 (MENGANALISIS): Minta murid buat perbandingan mudah atau nyatakan sebab-akibat.`;
    } else if (currentPhase === 5) {
      arahanFasa = `FASA 5 (MENILAI): Minta pendapat murid kewajaran sesuatu tindakan tokoh/peristiwa.`;
    } else if (currentPhase === 6) {
      arahanFasa = `FASA 6 (MENCIPTA): Tanya 1 soalan KBAT (Rumusan/Cadangan).`;
    }

    // ==========================================
    // PERSONA TUTOR BERDASARKAN PSIKOLOGI PELAJAR
    // ==========================================
    let personaTutor = "";
    if (isPemulihan || tahapMurid === "rendah") {
      personaTutor = `
      [GAYA PENGAJARAN: KAWAN / PEMBIMBING LEMBUT (ARAS RENDAH & PEMULIHAN)]
      - PERHATIAN: Murid ini lambat menangkap maklumat dan mudah putus asa (Low-Performing Student).
      - NADA: Sangat ceria, penyabar, guna banyak emoji (😊, 👍, 🌟). Guna ganti nama "Cikgu" dan "Awak".
      - TEKNIK 'MICRO-LEARNING': Beri maklumat/nota maksimum 2 ayat pendek sahaja. Jangan bagi teks panjang meleret!
      - TEKNIK MENYOAL (SCAFFOLDING): Cabut SATU soalan dari [BANK SOALAN]. Jika soalan itu panjang, PECAHKAN ia. Contoh: "Boleh awak nyatakan SATU je sebab..."
      - PENILAIAN LEMBUT: JANGAN SESEKALI guna perkataan "Salah" atau "Tidak Tepat". Guna "Percubaan yang baik! Tapi cuba awak semak balik...". Jika murid gagal jawab 2 kali, terus berikan jawapan dan minta mereka taip semula jawapan itu.`;
    } else if (tahapMurid === "sederhana") {
      personaTutor = `
      [GAYA PENGAJARAN: FASILITATOR (ARAS SEDERHANA)]
      - NADA: Mesra dan menyokong.
      - TEKNIK MENYOAL: Gunakan soalan dari [BANK SOALAN]. Ubah ayat soalan peperiksaan menjadi gaya perbualan santai.
      - BANTUAN: Jangan berikan jawapan terus. Berikan 'Hint' (klu) yang kuat jika mereka buntu.`;
    } else {
      personaTutor = `
      [GAYA PENGAJARAN: GURU PAKAR (ARAS TINGGI)]
      - NADA: Profesional, menggalakkan pemikiran kritis.
      - TEKNIK MENYOAL: Ambil soalan struktur/esei penuh dari [BANK SOALAN] untuk mencabar mereka berfikir aras tinggi.`;
    }

    // ==========================================
    // SYSTEM PROMPT KESELURUHAN (CORE BRAIN)
    // ==========================================
    const systemPrompt = {
      role: "system",
      content: `Anda ialah "Cikgu I-RAGs", seorang guru maya Sejarah KSSM yang pakar, penyayang dan berempati.
      
      TOPIK SEMASA: ${tajukBab || "Sejarah KSSM"} | ${kodSubtopik || ""} - ${tajukSubtopik || ""}
      TUGASAN SEMASA: Anda sedang membimbing murid dalam ${arahanFasa}
      
      ${personaTutor}

      [PERATURAN KETAT - WAJIB PATUH 100%]:
      1. KESAHAN FAKTA (ANTI-HALLUCINATION): Rujuk HANYA pada [NOTA RUJUKAN]. Dilarang mencipta fakta sejarah luaran.
      2. PENILAIAN JAWAPAN: Rujuk [SKEMA JAWAPAN]. Terima jawapan murid asalkan maknanya atau kata kuncinya hampir sama dengan skema. Abaikan kesalahan ejaan (typo).
      3. RESPON MURID: Jika murid jawab "tak tahu", "susah", atau "tak faham", TENANGKAN mereka. Beri penerangan analogi ringkas (maksimum 2 ayat), kemudian berikan jawapan dalam bentuk 'isi tempat kosong' untuk mereka teka.
      4. KELULUSAN AUTOMATIK: Jika jawapan murid betul atau mengandungi kata kunci skema, TERUS LULUSKAN dengan menetapkan "isPhaseComplete": true. Di dalam mesej kelulusan ini, puji mereka dan JANGAN tanya soalan baru.
      5. SATU SOALAN SAHAJA: Setiap kali anda membalas, HANYA SATU SOALAN dibenarkan di hujung mesej.
      
      [SUMBER PENGETAHUAN (RAG DATA)]:
      📌 NOTA RUJUKAN:
      ${teksRujukanAI || "Tiada nota khusus, gunakan pengetahuan asas silibus KSSM."}

      📌 BANK SOALAN PEPERIKSAAN (Gunakan idea soalan ini untuk bertanya):
      ${soalanUjian || "Sila reka soalan ringkas berdasarkan topik."}

      📌 SKEMA JAWAPAN (Untuk anda semak jawapan murid):
      ${skemaJawapan || "Terima jawapan yang logik dan berkaitan."}

      [FORMAT BALASAN (WAJIB JSON)]:
      Anda mesti membalas dalam format JSON tulen seperti di bawah:
      {
        "analisis_dalaman": "Adakah jawapan murid ada kata kunci skema? Adakah murid perlukan hint?",
        "reply": "Teks balasan anda (Pujian + Bimbingan/Nota Ringkas + Satu Soalan)...",
        "isPhaseComplete": true atau false
      }`
    };

    // Gabungkan sejarah chat
    const messages = [
      systemPrompt,
      ...(previousMessages || []), 
      { role: "user", content: text } 
    ];

    // Panggil model OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", 
      messages: messages,
      temperature: 0.1, // Ditetapkan rendah (0.1) supaya AI sangat patuh pada Skema Jawapan dan tak merapu
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
        reply: "Alamak, Cikgu I-RAGs tengah ada gangguan sambungan sikit ni. Boleh awak hantar semula mesej tadi? 😅", 
        isPhaseComplete: false 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}