import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 🌟 TAMBAHAN PENTING: Paksa pelayan (Vercel) tak timeout awal
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
    // 🌟 4. SYSTEM PROMPT (HALANG AI SYOK SENDIRI & TUKANG JAWAB)
    // ==========================================
    const systemPrompt = {
      role: "system",
      content: `Anda ialah "I-RAGS", tutor maya Sejarah Malaysia KSSM.
      
      TOPIK PEMBELAJARAN SEKARANG: ${tajukBab || "Silibus KSSM"}
      SUBTOPIK KHUSUS: ${kodSubtopik || ""} - ${tajukSubtopik || "Topik Am"}

      STATUS MURID SEKARANG: ${arahanFasa}
      
      ${personaTutor}

      PERATURAN KETAT (WAJIB PATUH 100%):
      1. TUGAS ANDA BERTANYA, BUKAN TUKANG CERITA: Apabila murid bersedia (menaip "ok", "sedia", "baik"), TUGAS PERTAMA ANDA ialah BERTANYA SOALAN mengikut arahan fasa. JANGAN sesekali berikan fakta/jawapan percuma sebelum murid cuba menjawab!
      2. SYARAT LULUS FASA (SANGAT KETAT): Anda DILARANG SAMA SEKALI menetapkan "isPhaseComplete": true jika murid hanya menaip "ok", "ya", atau "sedia". Fasa hanya boleh diluluskan ("isPhaseComplete": true) JIKA DAN HANYA JIKA murid telah menaip jawapan fakta sejarah yang betul berdasarkan Skema/Buku Teks.
      3. KETEPATAN ISTILAH SEJARAH: Anda MESTI sangat TEGAS dengan ejaan jawatan, nama tokoh, tempat, dan fakta. Contoh: "Bendahara" dan "Penghulu Bendahari" adalah jawatan BERBEZA. Tegur terus terang jika murid salah eja. Jangan 'auto-correct' jawapan mereka.
      4. JAWAPAN BERSANDARKAN BUKU TEKS: Nilai jawapan murid menggunakan [NOTA RUJUKAN BUKU TEKS] di bawah sebagai fakta mutlak.
      5. FORMAT BALASAN: Gunakan bahasa Melayu santai, dan PENDEK (maksimum 3 ayat). Tanya HANYA 1 soalan pada satu masa. Jangan bebankan murid.

      [NOTA RUJUKAN BUKU TEKS (FAKTA MUTLAK AI)]:
      ${teksRujukanAI || "Tiada nota khusus. Gunakan pengetahuan am Sejarah KSSM."}

      [BANK SOALAN UJIAN]:
      ${soalanUjian || "Tiada rekod soalan."}
      
      [SKEMA JAWAPAN UJIAN]:
      ${skemaJawapan || "Tiada rekod skema."}

      PENTING: Anda MESTI membalas dalam format JSON yang sah. 
      SILA BUAT ANALISIS FAKTA TERLEBIH DAHULU SEBELUM MEMBALAS:
      {
        "analisis_dalaman": "Langkah 1: Adakah mesej murid cuma sapaan/setuju (ok/sedia) atau jawapan fakta? Langkah 2: Jika cuma sapaan, saya MESTI tanya soalan fasa ini dan kekalkan isPhaseComplete: false. Langkah 3: Jika jawapan fakta, adakah ejaannya 100% tepat dengan buku teks? Rancang tindakan di sini.",
        "reply": "Mesej balasan (Tanya soalan jika murid belum jawab. Jangan jawab bagi pihak murid)...",
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

    // 🌟 KITA CUMA PULANGKAN REPLY DAN STATUS SAHAJA (KITA SEMBUNYIKAN ANALISIS DALAMAN DARI MURID)
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
        reply: "Maaf, sistem pemikiran saya sedang memproses terlalu banyak data (Server Sibuk). Boleh awak ulang semula jawapan tadi?", 
        isPhaseComplete: false 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}