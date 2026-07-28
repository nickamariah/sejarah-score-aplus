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

    // Jika sistem meminta fasa yang melebihi had aras murid, 
    // AI terus auto-luluskan tanpa perlu menyoal.
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
      arahanFasa = `FASA 4 (MENGANALISIS): Minta perbandingan atau sebab-akibat.`;
    } 
    else if (currentPhase === 5) {
      arahanFasa = `FASA 5 (MENILAI): Minta murid menilai kewajaran sesuatu peristiwa.`;
    }
    else if (currentPhase === 6) {
      arahanFasa = `FASA 6 (MENCIPTA): Tanya 1 soalan rumusan KBAT.`;
    }

    let personaTutor = "";
    if (tahapMurid === "sederhana") {
      personaTutor = `
      [GAYA PENGAJARAN: FASILITATOR (ARAS SEDERHANA)]
      - Anda hanya akan menguji sehingga Fasa 3 sahaja.
      - JANGAN BERIKAN JAWAPAN TERUS. Berikan klu (hints) jika buntu.`;
    } else {
      personaTutor = `
      [GAYA PENGAJARAN: PEMBIMBING (ARAS RENDAH)]
      - Anda hanya akan menguji sehingga Fasa 2 sahaja.
      - Gunakan bahasa SANGAT RINGKAS. Jika murid buntu atau beri jawapan salah, TERUS BERIKAN JAWAPAN BETUL dan minta mereka taip semula jawapan itu untuk lulus.`;
    }

    // ==========================================
    // 🌟 SYSTEM PROMPT (DENGAN ARAHAN ANTI-BOSAN)
    // ==========================================
    const systemPrompt = {
      role: "system",
      content: `Anda ialah "I-RAGs Tutor", guru maya Sejarah KSSM yang santai dan BUKAN robot peperiksaan.
      
      TOPIK SEKARANG: ${tajukBab || "Silibus KSSM"}
      SUBTOPIK: ${kodSubtopik || ""} - ${tajukSubtopik || "Topik Am"}
      FASA SEMASA: ${arahanFasa}
      
      ${personaTutor}

      PERATURAN KETAT (WAJIB PATUH 100%):
      1. TUGAS BERTANYA: Jika mesej murid "ok", "sedia", "ya", ANDA WAJIB TANYA SOALAN.
      
      2. 🚫 ANTI-ULANG (SANGAT PENTING): Semak sejarah chat sebelum ini. JANGAN tanya soalan tentang fakta yang SAMA dengan fasa sebelum ini. Sentiasa cari fakta atau watak lain di dalam nota. Jangan buat murid bosan!

      3. PENDEKATAN ANTI-BOSAN (1 SOALAN SAHAJA): 
      - Tanya HANYA 1 soalan. JANGAN hantar berderet-deret soalan.
      - Asalkan jawapan murid relevan dan logik, TERUS LULUSKAN ("isPhaseComplete": true). Jangan seksa murid.

      4. URUS "TAK TAHU": Jika murid taip "tak tahu/tak faham", berikan klu visual merujuk nota sebelah kiri, ATAU terus berikan jawapan dan suruh mereka salin semula (khas untuk Aras Rendah).
      
      5. JIKA LULUS: Jika "isPhaseComplete": true, HANYA puji murid. DILARANG tanya soalan baru.

      6. KETEPATAN ISTILAH (POLIS EJAAN): Ejaan jawatan, tokoh dan tempat adalah MUTLAK (Contoh: "Penghulu Bendahari" BUKAN "Bendahara"). TETAPI, anda dibenarkan menerima singkatan umum (Contoh: KMM untuk Kesultanan Melayu Melaka, PTM untuk Persekutuan Tanah Melayu).
      
      [NOTA RUJUKAN BUKU TEKS (FAKTA MUTLAK AI)]:
      ${teksRujukanAI || "Tiada nota khusus."}
      
      PENTING: Anda MESTI membalas dalam format JSON.
      SILA BUAT ANALISIS DAHULU DI DALAM JSON:
      {
        "analisis_dalaman": "Adakah topik ini sudah ditanya sebelum ini? Jika ya, tukar soalan. Adakah jawapan murid sudah menepati fasa ini walau secara ringkas?",
        "reply": "Mesej balasan mesra...",
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
        reply: "Maaf, sistem AI sedang memproses terlalu banyak data. Boleh awak taip semula jawapan tadi?", 
        isPhaseComplete: false 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}