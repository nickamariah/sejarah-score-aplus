import { OpenAI } from "openai";

// 1. HIDUPKAN ENJIN AI
// Sistem akan ambil kunci rahsia dari fail .env.local
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    // 2. TERIMA DATA DARI FRONTEND
    const { studentId, chapterId, text, previousMessages } = await req.json();

    // 3. RAG DINAMIK (NOTA RUJUKAN MENGIKUT BAB)
    let notaRujukan = "";
    
    if (chapterId === "sejarah_bab_1") {
      notaRujukan = `
        Bab 1: Warisan Negara Bangsa.
        Terdapat empat ciri-ciri asas pembentukan negara bangsa bagi Kerajaan Alam Melayu:
        1. Raja: Menjadi tonggak utama kerajaan dan dibantu oleh pembesar. Raja ditaati oleh rakyat.
        2. Undang-undang: Dilaksanakan untuk memastikan kesejahteraan kerajaan.
        3. Wilayah Pengaruh: Kawasan yang rakyatnya menerima dan memperakui pemerintahan raja.
        4. Rakyat: Penduduk dalam sesebuah wilayah yang setia kepada raja.
      `;
    } else if (chapterId === "sejarah_bab_2") {
      notaRujukan = `
        Bab 2: Kebangkitan Nasionalisme.
        Nasionalisme bermaksud perasaan cinta yang mendalam terhadap bangsa dan negara.
        Tokoh tempatan seperti Tok Janggut dan Dato' Maharajalela bangkit menentang penjajah British kerana pengenalan sistem cukai yang membebankan dan campur tangan dalam adat resam tempatan.
      `;
    } else {
      notaRujukan = "Sila rujuk nota am sejarah di dalam buku teks.";
    }

    // 4. ARAHAN PEDAGOGI (SCAFFOLDING) - TERAS KAJIAN PHD
    const systemPrompt = {
      role: "system",
      content: `Anda ialah "I-RAGs", seorang tutor maya yang ceria, mesra, dan pakar membimbing murid sekolah menengah di Malaysia untuk subjek Sejarah.
      
      PERATURAN PEDAGOGI (SANGAT PENTING - WAJIB PATUH):
      1. JANGAN PERNAH berikan jawapan secara terus (direct answer) walaupun murid merayu.
      2. Gunakan teknik Scaffolding dan Inkuiri Sokratik.
      3. Jika murid salah atau tidak tahu, berikan "hint" (petunjuk) kecil dan tanya SATU soalan mudah untuk dorong mereka berfikir.
      4. Rujuk fakta dalam ruangan KONTEKS di bawah sahaja. Jangan reka fakta di luar nota.
      5. Gunakan bahasa Melayu yang sangat santai, mudah difahami, dan puji usaha mereka (cth: "Bagus cubaan tu!", "Sikit lagi nak betul!").
      6. Sentiasa berikan jawapan yang pendek (maksimum 2 hingga 3 ayat sahaja).
      
      KONTEKS (NOTA RUJUKAN BAB INI):
      ${notaRujukan}
      `
    };

    // 5. SUSUN SEJARAH PERBUALAN (Supaya AI ingat apa yang diborakkan sebelum ni)
    const messages = [
      systemPrompt,
      ...(previousMessages || []), // Masukkan chat history
      { role: "user", content: text } // Masukkan chat baru murid
    ];

    // 6. HANTAR KE OPENAI GPT-4o-MINI
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Model paling pantas dan sesuai untuk tugas RAG
      messages: messages,
      temperature: 0.3, // Suhu rendah supaya AI fokus pada nota dan tak melalut
    });

    const aiReply = response.choices[0].message.content;

    // 7. HANTAR BALASAN AI KEMBALI KE FRONTEND
    return new Response(JSON.stringify({ reply: aiReply }), {
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