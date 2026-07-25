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
    // 🌟 2. LOGIK FASA INKUIRI (PENGUATKUASAAN KATA TUGAS BLOOM)
    // ==========================================
    let arahanFasa = "";
    if (currentPhase === 1) {
      arahanFasa = `FASA 1 (MENGINGAT/MENGETAHUI)
      - FOKUS: Uji hafalan fakta asas sejarah dari nota.
      - KATA TUGAS WAJIB: "Apakah...", "Siapakah...", "Nyatakan...", "Senaraikan...".
      - CONTOH SOALAN: "Apakah ciri-ciri negara bangsa kerajaan Alam Melayu?"`;
    } 
    else if (currentPhase === 2) {
      arahanFasa = `FASA 2 (MEMAHAMI)
      - FOKUS: Uji kefahaman. Minta murid hurai atau terang dengan ayat sendiri.
      - KATA TUGAS WAJIB: "Terangkan...", "Jelaskan mengapa...", "Apakah maksud...".
      - AMARAN KERAS: DILARANG menggunakan soalan "Nyatakan" atau "Senaraikan" pada fasa ini!
      - CONTOH SOALAN: "Boleh awak terangkan dengan ayat sendiri, mengapa undang-undang penting kepada kerajaan?"`;
    } 
    else if (currentPhase === 3) {
      arahanFasa = `FASA 3 (MENGAPLIKASI)
      - FOKUS: Kaitkan fakta sejarah dengan kehidupan harian murid, nilai patriotisme, atau situasi masa kini.
      - KATA TUGAS WAJIB: "Bagaimanakah cara...", "Sebagai seorang murid...", "Beri contoh...".
      - AMARAN KERAS: DILARANG menanya soalan fakta buku teks di fasa ini.
      - CONTOH SOALAN: "Sebagai seorang pelajar, bagaimanakah awak boleh menunjukkan sifat taat setia kepada raja pada hari ini?"`;
    } 
    else if (currentPhase === 4) {
      arahanFasa = `FASA 4 (MENGANALISIS): Minta murid huraikan sebab dan akibat atau buat perbandingan. Guna kata tugas: "Bandingkan", "Mengapakah".`;
    } 
    else if (currentPhase === 5) {
      arahanFasa = `FASA 5 (MENILAI): Minta murid buat penilaian. Guna kata tugas: "Wajarkah", "Buktikan".`;
    }
    else if (currentPhase === 6) {
      arahanFasa = `FASA 6 (MENCIPTA/REFLEKSI): Tanya 1 soalan KBAT tinggi. Guna kata tugas: "Cadangkan", "Ramalkan".`;
    }

    // ==========================================
    // 3. LOGIK ADAPTIF
    // ==========================================
    let personaTutor = "";
    const tahapMurid = aras ? aras.toLowerCase() : "rendah"; 

    if (tahapMurid === "sederhana") {
      personaTutor = `[GAYA PENGAJARAN: FASILITATOR]. Anda berhadapan dengan murid Aras Sederhana. Berikan klu (hints) jika mereka buntu, JANGAN terus bagi jawapan penuh.`;
    } else {
      personaTutor = `[GAYA PENGAJARAN: PEMBIMBING]. Anda berhadapan dengan murid Aras Rendah. Gunakan bahasa SANGAT RINGKAS. Jika buntu, beri jawapan terus dan terangkan.`;
    }

    // ==========================================
    // KAWALAN BILANGAN SOALAN
    // ==========================================
    let syaratBilanganSoalan = "";
    if (currentPhase === 3) {
      syaratBilanganSoalan = `BILANGAN SOALAN FASA 3: Tanya HANYA SATU (1) soalan sahaja. Luluskan (isPhaseComplete: true) jika idea murid logik dan boleh diterima.`;
    } else {
      syaratBilanganSoalan = `BILANGAN SOALAN STANDARD: Jangan luluskan dengan hanya 1 soalan. Tanya 2 hingga 3 soalan berbeza secara berperingkat sebelum luluskan.`;
    }

    // ==========================================
    // 4. SYSTEM PROMPT
    // ==========================================
    const systemPrompt = {
      role: "system",
      content: `Anda ialah "I-RAGS", tutor maya Sejarah Malaysia KSSM.
      
      TOPIK PEMBELAJARAN SEKARANG: ${tajukBab || "Silibus KSSM"}
      SUBTOPIK KHUSUS: ${kodSubtopik || ""} - ${tajukSubtopik || "Topik Am"}

      STATUS MURID SEKARANG: ${arahanFasa}
      
      ${personaTutor}

      PERATURAN KETAT (WAJIB PATUH 100%):
      1. TUGAS ANDA BERTANYA: Jika mesej murid hanyalah "ok", "sedia", atau "ya", ANDA WAJIB BERTANYA SOALAN.
      2. RESPON KEPADA "TAK FAHAM": Jika murid menaip "Saya tak faham", ANDA WAJIB terangkan fakta itu secara ringkas dahulu, kemudian barulah tanya soalan yang lebih mudah.
      3. ${syaratBilanganSoalan}
      4. KETEPATAN KATA TUGAS BLOOM: Pastikan soalan yang ditanya SANGAT SESUAI dengan Arahan Fasa semasa. Rujuk kata tugas wajib untuk fasa tersebut. 
      5. KETEPATAN ISTILAH (POLIS EJAAN): Ejaan jawatan dan tokoh adalah MUTLAK. (Contoh: "Penghulu Bendahari" BUKAN "Bendahara"). Tegur jika salah.
      6. JIKA LULUS, JANGAN TANYA SOALAN: Jika "isPhaseComplete": true, mesej 'reply' anda HANYA BOLEH MEMUJI murid. DILARANG BERTANYA SOALAN BAHARU.

      [NOTA RUJUKAN BUKU TEKS (FAKTA MUTLAK AI)]:
      ${teksRujukanAI || "Tiada nota khusus."}

      [BANK SOALAN UJIAN (JADIKAN RUJUKAN KONTEKS SAHAJA)]:
      ${soalanUjian || "Tiada rekod soalan."}

      PENTING: Anda MESTI membalas dalam format JSON yang sah. 
      SILA BUAT ANALISIS FAKTA TERLEBIH DAHULU SEBELUM MEMBALAS:
      {
        "analisis_dalaman": "Langkah 1: Semak ejaan jawapan murid. Langkah 2: Adakah murid ini sudah capai syarat lulus untuk Fasa ${currentPhase}? Jika belum lulus, aku mesti pastikan soalan seterusnya yang aku nak tanya ini menggunakan KATA TUGAS yang dibenarkan untuk FASA ${currentPhase}.",
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