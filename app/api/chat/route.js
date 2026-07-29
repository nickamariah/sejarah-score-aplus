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

    const tahapMurid = aras ? aras.toLowerCase() : "rendah"; 

    // ==========================================
    // 🌟 KEMAS KINI: LOGIK PINTASAN FASA (BYPASS)
    // ==========================================
    // Murid Rendah: Fasa 1 & 2 sahaja.
    // Murid Sederhana: Fasa 1, 2, & 3 sahaja.
    let maxPhase = 6;
    if (tahapMurid === "rendah") maxPhase = 2;
    else if (tahapMurid === "sederhana") maxPhase = 3;

    if (currentPhase > maxPhase) {
      return new Response(JSON.stringify({
        reply: "Tahniah! Anda telah melengkapkan bimbingan yang diperlukan untuk tahap anda. Sila klik terus ke fasa seterusnya untuk menamatkan sesi ini. 🎉",
        isPhaseComplete: true
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    // ==========================================
    // LOGIK FASA INKUIRI (HANYA BERLAKU JIKA DALAM HAD)
    // ==========================================
    let arahanFasa = "";
    if (currentPhase === 1) {
      arahanFasa = `FASA 1 (MENGINGAT): Uji fakta asas dari nota. Jangan meleret. (Contoh: "Apakah...?", "Siapakah...?").`;
    } 
    else if (currentPhase === 2) {
      arahanFasa = `FASA 2 (MEMAHAMI): Minta murid terangkan sedikit dengan ayat mudah. (Contoh: "Boleh jelaskan kenapa...").`;
    } 
    else if (currentPhase === 3) {
      arahanFasa = `FASA 3 (MENGAPLIKASI): Minta murid kaitkan dengan nilai murni atau kesan ringkas.`;
    } 
    else if (currentPhase === 4) {
      arahanFasa = `FASA 4 (MENGANALISIS): Minta perbandingan atau sebab-akibat berbentuk soalan KBAT.`;
    } 
    else if (currentPhase === 5) {
      arahanFasa = `FASA 5 (MENILAI): Minta murid menilai kewajaran sesuatu peristiwa ala soalan SPM.`;
    }
    else if (currentPhase === 6) {
      arahanFasa = `FASA 6 (MENCIPTA): Tanya 1 soalan rumusan KBAT aras tinggi.`;
    }

    let personaTutor = "";
    if (tahapMurid === "sederhana") {
      personaTutor = `
      [GAYA PENGAJARAN: FASILITATOR (ARAS SEDERHANA)]
      - Anda hanya akan menguji sehingga Fasa 3 sahaja.
      - JANGAN BERIKAN JAWAPAN TERUS. Berikan klu (hints) jika buntu.`;
    } else if (tahapMurid === "rendah") {
      personaTutor = `
      [GAYA PENGAJARAN: PEMBIMBING (ARAS RENDAH)]
      - Anda hanya akan menguji sehingga Fasa 2 sahaja.
      - Gunakan bahasa SANGAT RINGKAS. Jika murid buntu atau beri jawapan salah, TERUS BERIKAN JAWAPAN BETUL dan minta mereka taip semula jawapan itu untuk lulus.`;
    } else {
      personaTutor = `
      [GAYA PENGAJARAN: GURU PAKAR (ARAS TINGGI)]
      - Uji sehingga Fasa 6. Selitkan elemen soalan KBAT ala SPM sebenar.`;
    }

    // ==========================================
    // 🌟 SYSTEM PROMPT (PENAMBAHBAIKAN UTAMA DI SINI)
    // ==========================================
    const systemPrompt = {
      role: "system",
      content: `Anda ialah "I-RAGs Tutor", guru maya Sejarah KSSM yang santai, menyokong, dan BUKAN robot peperiksaan yang rigid.
      
      TOPIK SEKARANG: ${tajukBab || "Silibus KSSM"}
      SUBTOPIK: ${kodSubtopik || ""} - ${tajukSubtopik || "Topik Am"}
      FASA SEMASA: ${arahanFasa}
      
      ${personaTutor}

      PERATURAN KETAT (WAJIB PATUH 100%):
      
      1. 🚨 PENGESANAN JAWAPAN (ISU UTAMA): Jika murid menaip apa-apa sahaja (walaupun pendek, ejaan santai/chat, atau tidak lengkap), ANGGAP IA PERCUBAAN MENJAWAB! 
      - JANGAN SEKALI-KALI berkata "tiada jawapan diberikan" atau "anda belum menjawab". 
      - Jika jawapan mereka separa betul atau kurang tepat, PUJI percubaan tersebut, betulkan dengan lembut, dan pimpin mereka ke jawapan yang sebenar.

      2. 💡 PENERANGAN LEBIH DETAIL: Jika murid salah, buntu, atau menaip "tak tahu/tak faham", BERIKAN PENERANGAN YANG DETAIL, JELAS, BERSERTA CONTOH ATAU ANALOGI MUDAH. Pastikan murid betul-betul faham jalan ceritanya sebelum anda bertanya soalan baru yang lebih mudah.
      
      3. TUGAS BERTANYA: Jika mesej murid hanyalah "ok", "sedia", "ya", atau persetujuan, ANDA WAJIB BERTANYA 1 SOALAN berdasarkan Fasa Semasa.
      
      4. 🚫 ANTI-ULANG: Semak sejarah chat sebelum ini. JANGAN tanya soalan tentang fakta yang SAMA berulang kali. Sentiasa pelbagaikan watak/fakta dari nota.
      
      5. PENDEKATAN ANTI-BOSAN: Tanya HANYA 1 soalan pada satu-satu masa. Asalkan jawapan murid relevan dan logik dengan soalan (walaupun ringkas), TERUS LULUSKAN ("isPhaseComplete": true).
      
      6. KETEPATAN ISTILAH SEJARAH: Ejaan jawatan/tokoh rasmi (Cth: Penghulu Bendahari BUKAN Bendahara) adalah MUTLAK. Namun, benarkan singkatan lazim (KMM, PTM) dan abaikan typo kecil selagi maksud sejarahnya tidak lari.
      
      7. JIKA LULUS: Jika "isPhaseComplete": true, HANYA puji murid. DILARANG bertanya soalan baru di dalam mesej kelulusan ini (kerana sistem auto akan tanya soalan baru).
      
      [NOTA RUJUKAN BUKU TEKS (FAKTA MUTLAK AI)]:
      ${teksRujukanAI || "Tiada nota khusus. Sila rujuk silibus Sejarah KSSM secara umum."}
      
      PENTING: Anda MESTI membalas dalam format JSON.
      SILA BUAT ANALISIS DALAMAN DAHULU SEBELUM MEMBALAS:
      {
        "analisis_dalaman": "Adakah teks murid ini satu jawapan (walaupun ringkas)? Adakah murid perlukan analogi? Adakah jawapan ini cukup untuk lulus fasa?",
        "reply": "Mesej balasan mesra anda...",
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
      temperature: 0.2, // Rendah supaya AI tidak berhalusinasi fakta Sejarah
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