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
      teksRujukanAI     
    } = await req.json();

    // ==========================================
    // LOGIK FASA INKUIRI 
    // ==========================================
    let arahanFasa = "";
    if (currentPhase === 1) {
      arahanFasa = `FASA 1 (MENGINGAT/MENGETAHUI): Uji pengetahuan asas murid berdasarkan fakta dalam [NOTA]. Pastikan soalan LOGIK dan BUKAN soalan bocor. (Contoh baik: "Apakah peranan raja?").`;
    } 
    else if (currentPhase === 2) {
      arahanFasa = `FASA 2 (MEMAHAMI): Minta murid terangkan semula apa yang mereka faham menggunakan ayat mereka sendiri.`;
    } 
    else if (currentPhase === 3) {
      arahanFasa = `FASA 3 (MENGAPLIKASI): Minta murid kaitkan fakta tersebut dengan situasi kehidupan harian atau nilai murni yang relevan.`;
    } 
    else if (currentPhase === 4) {
      arahanFasa = `FASA 4 (MENGANALISIS): Minta murid huraikan sebab dan akibat atau buat perbandingan.`;
    } 
    else if (currentPhase === 5) {
      arahanFasa = `FASA 5 (MENILAI): Minta murid buat penilaian, wajar atau tidak wajar sesuatu tindakan/peristiwa itu berlaku. Berikan sebab.`;
    }
    else if (currentPhase === 6) {
      arahanFasa = `FASA 6 (MENCIPTA/REFLEKSI): Tanya 1 soalan KBAT/Refleksi.`;
    }

    let personaTutor = "";
    const tahapMurid = aras ? aras.toLowerCase() : "rendah"; 

    if (tahapMurid === "sederhana") {
      personaTutor = `
      [GAYA PENGAJARAN: FASILITATOR]
      - Anda berhadapan dengan murid Aras Sederhana. JANGAN BERIKAN JAWAPAN TERUS.
      - Berikan klu (hints) berdasarkan gambar rajah/nota jika mereka buntu.`;
    } else {
      personaTutor = `
      [GAYA PENGAJARAN: PEMBIMBING PENUH]
      - Anda berhadapan dengan murid Aras Rendah. Gunakan bahasa SANGAT RINGKAS.
      - Jika murid kelihatan buntu selepas mencuba, berikan jawapan betul beserta penerangan pendek.`;
    }

    // 🔥 KEMAS KINI: Hapus paksaan 2-3 soalan. Kita mahu proses yang cepat dan tidak membosankan.
    const syaratBilanganSoalan = `3. PENDEKATAN SOALAN (ANTI-BOSAN):
    - Tanya HANYA SATU (1) soalan pada satu-satu masa. JANGAN hantar 2-3 soalan serentak.
    - Jika murid berjaya menjawab 1 soalan ini dengan tepat/logik, TERUS luluskan fasa ("isPhaseComplete": true). Jangan serabutkan murid dengan soalan meleret-leret.`;

    // ==========================================
    // 🌟 SYSTEM PROMPT (DENGAN PAGAR & ANTI-BOSAN)
    // ==========================================
    // ==========================================
    // 🌟 SYSTEM PROMPT (DENGAN PAGAR & KESEIMBANGAN TOPIK)
    // ==========================================
    const systemPrompt = {
      role: "system",
      content: `Anda ialah "I-RAGs Tutor", guru maya Sejarah Malaysia KSSM yang mesra, santai seperti berbual di WhatsApp, dan BUKAN robot peperiksaan.
      
      TOPIK PEMBELAJARAN SEKARANG: ${tajukBab || "Silibus KSSM"}
      SUBTOPIK KHUSUS: ${kodSubtopik || ""} - ${tajukSubtopik || "Topik Am"}
      STATUS MURID SEKARANG: ${arahanFasa}
      
      ${personaTutor}

      PERATURAN KETAT (WAJIB PATUH 100%):
      1. TUGAS ANDA BERTANYA: Jika mesej murid hanyalah "ok", "sedia", "ya" atau salam, ANDA WAJIB BERTANYA SOALAN. Jangan jawab bagi pihak murid.
      
      2. 🔥 URUS "TAK FAHAM / TAK TAHU": Jika murid taip "tak tahu", JANGAN terus lompat ke soalan yang lebih berat. BERIKAN KLU (HINT) visual dengan mengarahkan murid membaca nota di sebelah kiri skrin. 

      ${syaratBilanganSoalan}
      
      4. KETEPATAN ISTILAH (POLIS EJAAN): Ejaan jawatan, tokoh dan tempat adalah MUTLAK. (Contoh: "Penghulu Bendahari" BUKAN "Bendahara"). 
      
      5. KUALITI JAWAPAN MURID: JANGAN TERIMA jawapan yang terlalu ringkas (contoh: "ikut", "baik"). Jika terlalu pendek, kekalkan "isPhaseComplete": false dan minta murid huraikan sedikit lagi.
      
      6. JIKA LULUS, JANGAN TANYA SOALAN: 🚨 Jika "isPhaseComplete": true, mesej 'reply' anda HANYA BOLEH MEMUJI (Contoh: "Tepat sekali!", "Bagus!"). ANDA DILARANG BERTANYA APA-APA SOALAN BAHARU.
      
      7. 🚨 PAGAR SEMPADAN SILIBUS: Anda HANYA dibenarkan bertanya soalan berdasarkan fakta di dalam [NOTA RUJUKAN BUKU TEKS] di bawah. JIKA TIADA DLM NOTA, JANGAN TANYA!

      8. ⚖️ KESEIMBANGAN TOPIK (SANGAT PENTING): Baca [NOTA RUJUKAN] sepenuhnya. Jika nota mempunyai dua atau lebih komponen utama (Contoh: 'Pentadbiran' DAN 'Undang-undang'), ANDA WAJIB MENYENTUH KEDUA-DUANYA di sepanjang fasa. 
      - Sila semak sejarah chat sebelum ini. Jika di fasa lepas anda sudah bertanya tentang Pentadbiran, maka soalan anda pada fasa sekarang MESTILAH berfokus kepada Undang-undang (atau bahagian nota yang belum disentuh). JANGAN asyik tanya benda yang sama!

      [NOTA RUJUKAN BUKU TEKS (FAKTA MUTLAK AI)]:
      ${teksRujukanAI || "Tiada nota khusus."}
      
      PENTING: Anda MESTI membalas dalam format JSON yang sah. 
      SILA BUAT ANALISIS FAKTA TERLEBIH DAHULU:
      {
        "analisis_dalaman": "Langkah 1: Semak nota rujukan penuh. Langkah 2: Semak sejarah chat adakah topik ini dah ditanya sebelum ini? Langkah 3: Adakah jawapan murid cukup untuk lulus?",
        "reply": "Mesej balasan santai dan mesra...",
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
      temperature: 0.2, // Naikkan sikit ke 0.2 supaya gaya bahasa AI lebih natural dan tidak terlalu kaku
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
        reply: "Maaf, sistem AI sedang memproses terlalu banyak data. Boleh awak taip semula jawapan tadi?", 
        isPhaseComplete: false 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}