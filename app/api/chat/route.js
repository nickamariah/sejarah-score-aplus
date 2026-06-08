import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    // Kita terima 'currentPhase' dari Frontend
    const { studentId, chapterId, text, previousMessages, currentPhase } = await req.json();

    // ==========================================
    // 1. RAG DINAMIK: SUBTOPIK, BANK SOALAN & INKUIRI
    // ==========================================
    let notaRujukan = "";
    let soalanSebenar = "";
    
    // PEMBOLEH UBAH DINAMIK UNTUK SOALAN INKUIRI
    let soalanTanya = "";
    let soalanTeroka = "";
    let soalanAnalisis = "";
    let soalanRefleksi = "";

    if (chapterId === "tingkatan4_bab1_sub1.1" || chapterId === "tingkatan4_bab1") {
      notaRujukan = `
        Subtopik 1.1: Konsep Alam Melayu.
        Kerajaan Alam Melayu mempunyai 4 ciri-ciri asas pembentukan negara bangsa: Raja, Undang-undang, Wilayah Pengaruh, dan Rakyat.
      `;
      soalanSebenar = `- Soalan SPM: Jelaskan ciri-ciri negara bangsa kerajaan Alam Melayu. (4 Markah)`;
      
      // SET INKUIRI SUBTOPIK 1.1
      soalanTanya = "Mengapakah kerajaan Alam Melayu boleh dianggap sebagai sebuah negara bangsa?";
      soalanTeroka = "Cuba cari dalam nota. Apakah bukti pertama yang anda temui?";
      soalanAnalisis = "Antara raja dan undang-undang, yang manakah lebih penting dalam pembentukan negara bangsa? Mengapa?";
      soalanRefleksi = "Jika sesebuah negara tiada undang-undang hari ini, adakah ia boleh kekal stabil seperti kerajaan dahulu?";
    } 
    else if (chapterId === "tingkatan4_bab1_sub1.2") {
      notaRujukan = `
        Subtopik 1.2: Ciri-ciri Negara Bangsa Kesultanan Melayu Melaka.
        Kerajaan Melaka mempunyai ciri seperti kerajaan, rakyat, kedaulatan, wilayah pengaruh, undang-undang, dan lambang kebesaran.
      `;
      soalanSebenar = `- Soalan SPM: Nyatakan ciri negara bangsa Kesultanan Melayu Melaka. (4 Markah)`;
      
      // SET INKUIRI SUBTOPIK 1.2 (CONTOH LAIN)
      soalanTanya = "Apakah yang membuatkan Kesultanan Melayu Melaka diiktiraf sebagai model negara bangsa yang sangat unggul?";
      soalanTeroka = "Berdasarkan nota, cuba cari satu ciri Kesultanan Melayu Melaka yang tiada pada kerajaan sebelumnya.";
      soalanAnalisis = "Mengapakah 'lambang kebesaran' sangat penting kepada Sultan Melaka pada waktu itu berbanding sekarang?";
      soalanRefleksi = "Pada pendapat awak, adakah ciri-ciri Kesultanan Melayu Melaka ini masih diamalkan di Malaysia hari ini?";
    }

    // ==========================================
    // 2. LOGIK 5 FASA INKUIRI (DINAMIK)
    // ==========================================
    let arahanFasa = "";
    if (currentPhase === 1) {
      arahanFasa = `FASA 1 (TANYA): Cetuskan inkuiri murid. JANGAN tanya soalan 'recall'. Contoh soalan untuk ditanya: "${soalanTanya}"`;
    } 
    else if (currentPhase === 2) {
      arahanFasa = `FASA 2 (TEROKA): Arahkan murid meneroka nota rujukan. Contoh: "${soalanTeroka}"`;
    } 
    else if (currentPhase === 3) {
      arahanFasa = `FASA 3 (ANALISIS): Bimbing murid membuat analisis perbandingan/hubung kait. Contoh: "${soalanAnalisis}"`;
    } 
    else if (currentPhase === 4) {
      arahanFasa = `FASA 4 (RUMUS): Minta murid merumuskan dan membuat kesimpulan ringkas tentang bukti yang dibincangkan.`;
    } 
    else if (currentPhase === 5) {
      arahanFasa = `FASA 5 (REFLEKSI): Tanya soalan KBAT/Refleksi luar dari kotak. Contoh: "${soalanRefleksi}"`;
    }

    // ==========================================
    // 3. SYSTEM PROMPT (DENGAN OUTPUT JSON & ANTI-HALUSINASI)
    // ==========================================
    const systemPrompt = {
      role: "system",
      content: `Anda ialah "I-RAGs", tutor maya Sejarah untuk murid aras rendah.
      
      STATUS MURID SEKARANG: ${arahanFasa}

      PERATURAN KETAT (WAJIB PATUH 100%):
      1. SUMBER FAKTA: Nilai jawapan murid berdasarkan [KONTEKS] di bawah SAHAJA. JANGAN berhalusinasi atau tambah fakta luar (seperti Geografi/iklim) jika ia tiada dalam nota.
      2. PANDUAN MENYOAL: Berpandukan [BANK SOALAN SEBENAR], bimbing murid (Scaffolding) supaya mereka dapat menjawab soalan aras peperiksaan tersebut. JANGAN beri jawapan bocor.
      3. PENILAIAN JAWAPAN: Jika murid telah berjaya menjawab tugasan Fasa ini dengan betul, tetapkan "isPhaseComplete" kepada true dan puji usaha mereka. Jika jawapan salah, tetapkan "isPhaseComplete" kepada false dan beri "hint".
      4. FORMAT BALASAN: Gunakan bahasa Melayu santai, mesra, dan PENDEK (maksimum 3 ayat).

      [BANK SOALAN SEBENAR (JADIKAN PANDUAN BERTANYA)]:
      ${soalanSebenar}
      
      [KONTEKS BUKU TEKS]:
      ${notaRujukan}

      PENTING: Anda MESTI membalas dalam format JSON yang sah (valid JSON) seperti ini:
      {
        "reply": "Mesej balasan anda kepada murid...",
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
      temperature: 0.1, // Suhu sangat rendah (0.1) supaya AI skema dan ikut buku teks sahaja
      response_format: { type: "json_object" } 
    });

    // Parse output JSON dari AI
    const aiOutput = JSON.parse(response.choices[0].message.content);

    return new Response(JSON.stringify(aiOutput), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Ralat pada API Chat I-RAGs:", error);
    return new Response(JSON.stringify({ error: "Maaf, sistem I-RAGs sedang berehat sebentar." }), {
      status: 500,
    });
  }
}