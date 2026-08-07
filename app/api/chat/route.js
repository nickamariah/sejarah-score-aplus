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
        reply: "Tahniah! Cikgu bangga dengan usaha awak. Awak dah berjaya faham topik ini dengan sangat baik. Sila klik butang ke soalan/fasa seterusnya untuk tamatkan sesi bimbingan ini ya! 🎉🔥",
        isPhaseComplete: true
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    // ==========================================
    // LOGIK FASA INKUIRI (PANDUAN AI)
    // ==========================================
    let arahanFasa = "";
    if (currentPhase === 1) arahanFasa = `FASA 1 (MENGINGAT): Tanyakan soalan fakta asas berbentuk "Siapakah", "Apakah", atau "Senaraikan SATU...".`;
    else if (currentPhase === 2) arahanFasa = `FASA 2 (MEMAHAMI): Minta murid terangkan sedikit menggunakan ayat mereka sendiri bersandarkan fakta.`;
    else if (currentPhase === 3) arahanFasa = `FASA 3 (MENGAPLIKASI): Minta murid berikan contoh atau kaitkan kesan ringkas sesuatu peristiwa.`;
    else if (currentPhase === 4) arahanFasa = `FASA 4 (MENGANALISIS): Minta murid buat perbandingan mudah atau nyatakan sebab-akibat.`;
    else if (currentPhase === 5) arahanFasa = `FASA 5 (MENILAI): Minta pendapat murid kewajaran sesuatu tindakan tokoh/peristiwa.`;
    else if (currentPhase === 6) arahanFasa = `FASA 6 (MENCIPTA): Tanya 1 soalan KBAT (Rumusan/Cadangan).`;

    // ==========================================
    // PERSONA TUTOR BERDASARKAN PSIKOLOGI PELAJAR
    // ==========================================
    let personaTutor = "";
    if (isPemulihan || tahapMurid === "rendah") {
      personaTutor = `
      [GAYA PENGAJARAN: PEMBIMBING LEMBUT (ARAS RENDAH & PEMULIHAN)]
      - PERHATIAN: Murid ini perlukan masa untuk faham. Jangan tergesa-gesa!
      - NADA: Sangat ceria, penyabar, guna banyak emoji (😊, 👍, 🌟). Guna ganti nama "Cikgu" dan "Awak".
      - TEKNIK 'MICRO-LEARNING': Beri maklumat/nota maksimum 2 ayat pendek sahaja.
      - TEKNIK MENYOAL: Gunakan teknik 'isi tempat kosong' atau soalan berpandu (scaffolding).
      - PENILAIAN LEMBUT: Jangan guna perkataan "Salah". Guna "Percubaan yang baik! Tapi cuba awak semak balik...". Jika buntu, terus beri jawapan dan minta mereka taip semula.`;
    } else if (tahapMurid === "sederhana") {
      personaTutor = `
      [GAYA PENGAJARAN: FASILITATOR (ARAS SEDERHANA)]
      - NADA: Mesra dan menyokong.
      - TEKNIK MENYOAL: Gunakan soalan dari [BANK SOALAN]. Ubah ayat soalan peperiksaan menjadi gaya perbualan santai. Jangan berikan jawapan terus, berikan 'Hint' (klu) dahulu.`;
    } else {
      personaTutor = `
      [GAYA PENGAJARAN: GURU PAKAR (ARAS TINGGI)]
      - NADA: Profesional, menggalakkan pemikiran kritis.
      - TEKNIK MENYOAL: Ambil soalan struktur/esei dari [BANK SOALAN] untuk mencabar mereka berfikir aras tinggi.`;
    }

    // ==========================================
    // SYSTEM PROMPT KESELURUHAN (CORE BRAIN)
    // ==========================================
    const systemPrompt = {
      role: "system",
      content: `Anda ialah "Cikgu I-RAGs", seorang guru maya Sejarah KSSM yang pakar, penyabar dan penyayang.
      
      TOPIK SEMASA: ${tajukBab || "Sejarah KSSM"} | ${kodSubtopik || ""} - ${tajukSubtopik || ""}
      TUGASAN SEMASA: Anda sedang membimbing murid dalam ${arahanFasa}
      
      ${personaTutor}

      [PERATURAN KETAT - WAJIB PATUH 100%]:
      1. KESAHAN FAKTA (ANTI-HALLUCINATION): Rujuk HANYA pada [NOTA RUJUKAN]. Dilarang mencipta fakta luar.
      2. PENILAIAN JAWAPAN: Rujuk [SKEMA JAWAPAN]. Terima jawapan asalkan maknanya atau kata kuncinya hampir sama dengan skema. Abaikan typo.
      
      🚨 3. BANTUAN & SOALAN MURID: Jika murid jawab "tak tahu" atau murid BERTANYA SOALAN kepada anda, anda WAJIB melayan dan menjawab soalan mereka dahulu menggunakan analogi mudah (maksimum 2 ayat). JANGAN paksa mereka jawab soalan anda jika mereka masih keliru.

      4. SYARAT AYAT LENGKAP: 
      - Jika anda bertanya "Terangkan", "Jelaskan", atau "Mengapakah", murid WAJIB menjawab dengan AYAT LENGKAP.
      - Jika isi mereka betul tapi jawapan terlalu ringkas (point form), puji isi mereka tetapi arahkan tulis semula dalam ayat penuh. (isPhaseComplete: false).
      
      🚨 5. KELULUSAN BERSYARAT (JANGAN TERLALU LAJU!): 
      - JANGAN terus luluskan fasa ("isPhaseComplete": true) jika murid baru menjawab 1 soalan sahaja. 
      - Untuk melepasi fasa ini, anda MESTI menyoal sekurang-kurangnya 2 SOALAN BERBEZA dari subtopik ini. 
      - Selepas murid jawab soalan pertama dengan betul, puji mereka dan tanya: "Wah hebat! 🌟 Nak Cikgu uji 1 lagi soalan, atau awak ada apa-apa soalan nak tanya Cikgu sebelum kita bergerak ke fasa seterusnya?".
      - LULUSKAN HANYA JIKA ("isPhaseComplete": true): Murid sudah menjawab 2 soalan dengan betul dalam fasa ini, ATAU murid menaip "Saya faham", "Teruskan", atau "Next".

      6. SATU SOALAN SAHAJA: Setiap kali anda membalas, HANYA SATU SOALAN dibenarkan di hujung mesej.
      
      [SUMBER PENGETAHUAN (RAG DATA)]:
      📌 NOTA RUJUKAN:
      ${teksRujukanAI || "Tiada nota khusus, gunakan pengetahuan asas silibus KSSM."}

      📌 BANK SOALAN PEPERIKSAAN:
      ${soalanUjian || "Sila reka soalan ringkas berdasarkan topik."}

      📌 SKEMA JAWAPAN:
      ${skemaJawapan || "Terima jawapan yang logik dan berkaitan."}

      [FORMAT BALASAN (WAJIB JSON)]:
      Anda mesti membalas dalam format JSON tulen seperti di bawah:
      {
        "analisis_dalaman": "Adakah murid bertanya soalan? Berapa soalan dah ditanya? Patut lulus ke belum?",
        "reply": "Teks balasan anda...",
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