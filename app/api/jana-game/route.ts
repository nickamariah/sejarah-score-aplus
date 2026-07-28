import { NextResponse } from "next/server";
import OpenAI from "openai";

export const maxDuration = 45; // Mengelak Vercel timeout

export async function POST(req: Request) {
  try {
    const { tingkatan, bab, aras } = await req.json();

    if (!process.env.OPENAI_API_KEY) throw new Error("API Key hilang");
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // AI akan jana soalan spesifik berdasarkan silibus yang cikgu minta
    const systemPrompt = `Anda adalah Guru Pakar Sejarah KSSM.
Tugas anda ialah membina 5 pasang "Soalan dan Jawapan Ringkas" untuk permainan Padankan Kad (Flashcards) bagi Silibus Tingkatan ${tingkatan}, Tajuk: ${bab}.

Arahan:
1. Hasilkan 5 fakta berbeza berkaitan bab ini.
2. Soalan mesti pendek (Maks 12 perkataan).
3. Jawapan mesti SANGAT PENDEK, maksimum 1-3 perkataan sahaja (Contoh: "Bendahara", "Sultan", "Undang-undang Laut").
4. Oleh kerana murid ini di tahap '${aras}', pastikan soalan ini tidak terlalu berbelit.

Hasilkan output format JSON TEPAT seperti ini:
{
  "pasangan": [
    { "soalan": "Ketua pentadbir kerajaan Melaka", "jawapan": "Bendahara" },
    ...sehingga 5 pasang
  ]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", 
      messages: [{ role: "system", content: systemPrompt }],
      response_format: { type: "json_object" },
      temperature: 0.3 // Rendah supaya fakta tepat
    });

    const aiData = JSON.parse(response.choices[0]?.message?.content || "{}");

    return NextResponse.json({ pasangan: aiData.pasangan || [] });

  } catch (error) {
    console.error("Gagal jana game AI:", error);
    return NextResponse.json({ error: "Gagal menjana permainan" }, { status: 500 });
  }
}