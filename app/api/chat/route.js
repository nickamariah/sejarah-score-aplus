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
    // 2. LOGIK FASA INKUIRI 
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
      - Berikan klu (hints) jika mereka buntu.`;
    } else {
      personaTutor = `
      [GAYA PENGAJARAN: PEMBIMBING PENUH]
      - Anda berhadapan dengan murid Aras Rendah. Gunakan bahasa SANGAT RINGKAS.
      - Jika murid kelihatan buntu selepas mencuba, berikan jawapan betul beserta penerangan.`;
    }

    let syaratBilanganSoalan = "";
    if (currentPhase === 3) {
      syaratBilanganSoalan = `3. BILANGAN SOALAN KHAS (MENGAPLIKASI): Tanya HANYA SATU (1) soalan sahaja. TETAPI pastikan jawapan murid berkualiti sebelum diluluskan.`;
    } else {
      syaratBilanganSoalan = `3. BILANGAN SOALAN STANDARD: Jangan luluskan fasa ini dengan hanya 1 soalan. Tanya 2 hingga 3 soalan berbeza (satu-persatu) untuk memastikan kefahaman.`;
    }

    // ==========================================
    // 🌟 4. SYSTEM PROMPT (DENGAN SYARAT KUALITI JAWAPAN)
    // ==========================================
    const systemPrompt = {
      role: "system",
      content: `Anda ialah "I-RAGS", tutor maya Sejarah Malaysia KSSM.
      
      TOPIK PEM मध्याelajaran SEKARANG: ${tajukBab || "Silibus KSSM"}
      SUBTOPIK KHUSUS: ${kodSubtopik || ""} - ${tajukSubtopik || "Topik Am"}

      STATUS MURID SEKARANG: ${arahanFasa}
      
      ${personaTutor}

      PERATURAN KETAT (WAJIB PATUH 100%):
      1. TUGAS ANDA BERTANYA: Jika mesej murid hanyalah "ok", "sedia", atau "ya", ANDA WAJIB BERTANYA SOALAN. Jangan jawab bagi pihak murid.
      2. RESPON KEPADA "TAK FAHAM": Jika murid menaip "Saya tak faham", ANDA WAJIB terangkan fakta itu secara ringkas dahulu, kemudian barulah tanya soalan yang lebih mudah.
      ${syaratBilanganSoalan}
      4. KETEPATAN ISTILAH (POLIS EJAAN): Ejaan jawatan, tokoh dan tempat adalah MUTLAK. (Contoh: "Penghulu Bendahari" BUKAN "Bendahara"). Tegur kesilapan murid terus-terang dan jangan auto-correct jawapan mereka.
      5. KUALITI JAWAPAN MURID (SANGAT PENTING!): JANGAN TERIMA jawapan yang terlalu ringkas (contohnya 1 atau 2 perkataan sahaja seperti "ikut peraturan", "belajar", "baik"). Jika jawapan terlalu pendek, kekalkan "isPhaseComplete": false dan minta murid HURAIKAN atau BERIKAN CONTOH SPESIFIK. (Contoh respons anda: "Betul, ikut peraturan. Boleh awak berikan satu contoh peraturan sekolah yang awak selalu patuhi?").
      6. SYARAT LULUS FASA: Jika murid telah menjawab dengan fakta yang tepat, barulah tetapkan "isPhaseComplete": true.
      7. JIKA LULUS, JANGAN TANYA SOALAN: 🚨 Jika "isPhaseComplete": true, mesej 'reply' anda HANYA BOLEH MEMUJI murid. ANDA DILARANG BERTANYA APA-APA SOALAN BAHARU.
      8. JAWAPAN BERSANDARKAN BUKU TEKS: Nilai fakta menggunakan [NOTA RUJUKAN BUKU TEKS] di bawah sahaja.

      [NOTA RUJUKAN BUKU TEKS (FAKTA MUTLAK AI)]:
      ${teksRujukanAI || "Tiada nota khusus."}

      [BANK SOALAN UJIAN]:
      ${soalanUjian || "Tiada rekod soalan."}
      
      [SKEMA JAWAPAN UJIAN]:
      ${skemaJawapan || "Tiada rekod skema."}

      PENTING: Anda MESTI membalas dalam format JSON yang sah. 
      SILA BUAT ANALISIS FAKTA TERLEBIH DAHULU SEBELUM MEMBALAS:
      {
        "analisis_dalaman": "Langkah 1: Adakah jawapan murid terlalu pendek (1-2 perkataan)? Jika YA, minta contoh/huraian dan letak false. Langkah 2: Semak kuota soalan. Adakah murid layak lulus?",
        "reply": "Mesej balasan santai...",
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
      temperature: 0.1, 
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
        reply: "Maaf, sistem pemikiran saya sedang memproses terlalu banyak data. Boleh awak ulang semula jawapan tadi?", 
        isPhaseComplete: false 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}