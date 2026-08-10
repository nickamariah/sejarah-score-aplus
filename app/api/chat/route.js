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
    else if (tahapMurid === "rendah") maxPhase = 2; // Aras Rendah hanya Fasa 1 (Ingat) & 2 (Faham)
    else if (tahapMurid === "sederhana") maxPhase = 4;

    if (currentPhase > maxPhase) {
      return new Response(JSON.stringify({
        reply: "Tahniah! Cikgu sangat bangga dengan usaha awak. Awak dah berjaya faham topik ini dengan sangat baik. 🌟 Sila klik butang di bawah untuk ke fasa/modul seterusnya ya! 🎉🔥",
        isPhaseComplete: true
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    // ==========================================
    // LOGIK FASA INKUIRI YANG DIPERBAIKI (TIDAK MEMAKSA)
    // ==========================================
    let arahanFasa = "";
    if (currentPhase === 1) {
      arahanFasa = `FASA 1 (MENGINGAT - FAKTA ASAS): 
      - Tanyakan HANYA SATU soalan mudah berbentuk "Siapakah", "Apakah", atau "Senaraikan 1-2 contoh...".
      - MURID TIDAK PERLU MENERANGKAN. Hanya perlu sebut/nyatakan fakta sahaja.
      - JIKA MURID JAWAB BETUL (walaupun sebut 1 fakta sahaja): Puji murid, berikan rumusan fakta yang lain dalam bentuk 'Point Form' ber-emoji, dan WAJIB set "isPhaseComplete": true untuk tamatkan fasa ini. JANGAN desak murid sebut fakta yang lain.`;
    } 
    else if (currentPhase === 2) {
      arahanFasa = `FASA 2 (MEMAHAMI - HURAIAN): 
      - Minta murid TERANGKAN atau JELASKAN salah satu fakta yang telah disebut tadi menggunakan ayat mereka sendiri secara ringkas.
      - JIKA MURID BERJAYA TERANGKAN (walaupun ayat mudah): Puji mereka dan WAJIB set "isPhaseComplete": true.`;
    } 
    else if (currentPhase === 3) {
      arahanFasa = `FASA 3 (MENGAPLIKASI): Minta murid berikan contoh ringkas atau kaitkan kesan peristiwa tersebut. Jika jawapan munasabah, set "isPhaseComplete": true.`;
    } 
    else if (currentPhase === 4) {
      arahanFasa = `FASA 4 (MENGANALISIS): Minta murid buat perbandingan atau nyatakan sebab-akibat. Jika logik, set "isPhaseComplete": true.`;
    } 
    else if (currentPhase === 5) {
      arahanFasa = `FASA 5 (MENILAI): Minta pendapat murid kewajaran sesuatu tindakan tokoh/peristiwa.`;
    } 
    else if (currentPhase === 6) {
      arahanFasa = `FASA 6 (MENCIPTA): Tanya 1 soalan KBAT (Rumusan/Cadangan).`;
    }

    // ==========================================
    // PERSONA TUTOR BERDASARKAN PSIKOLOGI PELAJAR
    // ==========================================
    let personaTutor = "";
    if (isPemulihan || tahapMurid === "rendah") {
      personaTutor = `
      [GAYA PENGAJARAN: PEMBIMBING PENYAYANG (ARAS RENDAH)]
      - PERHATIAN: Murid cepat bosan dan stress jika ditanya soalan berulang kali.
      - NADA: Sangat ceria, penyabar, guna banyak emoji.
      - BANTUAN: Jika murid buntu, beri klu (hint) berbentuk huruf pangkal atau isi tempat kosong. JANGAN sebut perkataan "Salah", guna "Hampir tepat!".`;
    } else {
      personaTutor = `[GAYA PENGAJARAN: FASILITATOR (ARAS SEDERHANA/TINGGI)] Nada mesra, berikan hint jika buntu.`;
    }

    // ==========================================
    // SYSTEM PROMPT KESELURUHAN (CORE BRAIN)
    // ==========================================
    const systemPrompt = {
      role: "system",
      content: `Anda ialah "Cikgu I-RAGs", seorang guru maya Sejarah KSSM yang pakar.
      
      TOPIK SEMASA: ${tajukBab || "Sejarah KSSM"} | ${kodSubtopik || ""} - ${tajukSubtopik || ""}
      TUGASAN SEMASA: Anda sedang membimbing murid dalam ${arahanFasa}
      
      ${personaTutor}

      [PERATURAN KETAT - WAJIB PATUH 100%]:
      1. JANGAN ULANG SOALAN: Baca sejarah mesej. Jika murid sudah jawab soalan untuk fasa ini, puji mereka dan TERUS set "isPhaseComplete": true. JANGAN tanya "Boleh berikan ciri yang lain?".
      2. KESAHAN FAKTA: Rujuk HANYA pada [NOTA RUJUKAN]. Terima jawapan asalkan kata kuncinya hampir sama. Abaikan ejaan (typo).
      3. SATU SOALAN SAHAJA: Dalam satu balasan mesej, anda HANYA DIBENARKAN bertanya 1 soalan pendek sahaja.
      4. RUMUSAN EMOJI: Jika murid jawab 1 fakta dengan betul, anda tolong senaraikan baki fakta yang ada dalam nota menggunakan point form ber-emoji (contoh: 👑 Raja, 📜 Undang-undang).

      [SUMBER PENGETAHUAN (RAG DATA)]:
      📌 NOTA RUJUKAN:
      ${teksRujukanAI || "Gunakan pengetahuan asas silibus KSSM."}

      📌 SKEMA JAWAPAN:
      ${skemaJawapan || "Terima jawapan yang logik dan berkaitan."}

      [FORMAT BALASAN (WAJIB JSON)]:
      {
        "analisis_dalaman": "Adakah murid dah sebut sekurang-kurangnya 1 poin betul? Jika ya, saya wajib set isPhaseComplete kepada true.",
        "reply": "Teks balasan anda (Pujian ringkas + Jika betul, senaraikan baki fakta + Jika isPhaseComplete false, berikan 1 soalan)...",
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
      temperature: 0.1, // Rendahkan temperature supaya AI patuh arahan dan tidak meleret
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