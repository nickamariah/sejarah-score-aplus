import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { studentId, chapterId, text, previousMessages } = await req.json();

    let notaRujukan = "";
    
    if (chapterId === "tingkatan4_bab1") {
      notaRujukan = `
        Tingkatan 4 - Bab 1: Warisan Negara Bangsa.
        Terdapat EMPAT ciri-ciri asas pembentukan negara bangsa bagi Kerajaan Alam Melayu:
        1. Raja: Menjadi tonggak utama kerajaan dan dibantu oleh pembesar. Raja ditaati oleh rakyat.
        2. Undang-undang: Dilaksanakan untuk memastikan kesejahteraan kerajaan.
        3. Wilayah Pengaruh: Kawasan yang rakyatnya menerima dan memperakui pemerintahan raja.
        4. Rakyat: Penduduk dalam sesebuah wilayah yang setia kepada raja.
      `;
    } else if (chapterId === "tingkatan5_bab1") {
      notaRujukan = `
        Tingkatan 5 - Bab 1: Kedaulatan Negara.
        Kedaulatan bermaksud kekuasaan tertinggi dan kewibawaan sesebuah negara yang bebas serta mempunyai hak untuk melaksanakan pemerintahan dan pentadbiran negara.
        Terdapat 4 jenis kedaulatan: Kedaulatan Tradisional, Kedaulatan Moden, Kedaulatan Undang-undang, dan Kedaulatan Antarabangsa.
      `;
    } else {
      notaRujukan = "Sila rujuk nota am sejarah di dalam buku teks.";
    }

    // ====================================================================
    // PROMPT YANG TELAH DIPERKETATKAN (STRICT GROUNDING)
    // ====================================================================
    const systemPrompt = {
      role: "system",
      content: `Anda ialah "I-RAGs", tutor maya Sejarah untuk murid sekolah menengah.

      PERATURAN SANGAT KETAT (WAJIB PATUH 100%):
      1. SUMBER FAKTA: Anda MESTI menilai jawapan murid berdasarkan maklumat di dalam kotak [KONTEKS] di bawah SAHAJA. 
      2. DILARANG BERHALUSINASI: Jangan sesekali menambah fakta luar seperti Geografi, iklim, atau bentuk muka bumi jika ia tiada dalam [KONTEKS].
      3. JIKA MURID BETUL: Jika murid menyenaraikan fakta yang TEPAT berdasarkan [KONTEKS] (contohnya Raja, Rakyat, Wilayah Pengaruh, Undang-undang), anda WAJIB sahkan ia betul, puji mereka memanggil mereka hebat, dan JANGAN cari salah mereka.
      4. TEKNIK SCAFFOLDING (JIKA SALAH): Jika jawapan murid salah atau tidak lengkap, jangan beri jawapan terus. Beri "hint" menggunakan ayat dari [KONTEKS] untuk dorong mereka berfikir.
      5. FORMAT BALASAN: Gunakan bahasa Melayu santai, mesra, dan pendek (maksimum 3 ayat).

      [KONTEKS BUKU TEKS]:
      """
      ${notaRujukan}
      """
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
      // Suhu dikurangkan lagi ke 0.1 supaya AI jadi sangat skema & tak mereka cerita
      temperature: 0.1, 
    });

    const aiReply = response.choices[0].message.content;

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