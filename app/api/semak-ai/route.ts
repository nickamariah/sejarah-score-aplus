import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase"; // Pastikan ini menunjuk ke fail firebase.ts awak

export async function POST(req: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("API Key tidak dijumpai!");
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const data = await req.json();
    
    // KITA TAMBAH 'bab' DI SINI UNTUK TARIK PDF
    const { soalan, jawapanMurid, markahPenuh, skemaJawapan, bab } = data;

    // =====================================================================
    // FASA 1: LOGIK RAG TAHAP 2 (MENCARI & BACA PDF)
    // =====================================================================
    let pdfPart = null;
    let rujukanDigunakan = "Skema Teks Sahaja";

    // Hanya cari PDF jika nama 'bab' dihantar dari frontend
    if (bab) {
      console.log(`Mencari nota PDF untuk ${bab}...`);
      const bahanRef = collection(db, "bahan_rujukan");
      const q = query(bahanRef, where("bab", "==", bab));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const pdfUrl = querySnapshot.docs[0].data().urlPautan;
        console.log("PDF Dijumpai! Memuat turun...");
        
        // Muat turun dan tukar PDF ke Base64
        const res = await fetch(pdfUrl);
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        pdfPart = {
          inlineData: {
            data: buffer.toString("base64"),
            mimeType: "application/pdf",
          },
        };
        rujukanDigunakan = `Buku Teks / Nota PDF (${bab})`;
      } else {
        console.log(`Tiada PDF dijumpai untuk ${bab}.`);
      }
    }

    // =====================================================================
    // FASA 2: ARAHAN CIKGU N.I.C (SCAFFOLDING) & PEMARKAHAN
    // =====================================================================
    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: { responseMimeType: "application/json" } // Paksa return JSON
    });

    const prompt = `
      Anda adalah CIKGU N.I.C, seorang Ejen AI Scaffolding (Pembelajaran Inkuiri) untuk subjek Sejarah.
      
      MAKLUMAT SOALAN:
      Soalan: "${soalan}"
      Markah Penuh: ${markahPenuh}
      Jawapan Murid: "${jawapanMurid}"
      Skema Cikgu: "${skemaJawapan || 'Gunakan fakta sejarah.'}"

      TUGAS ANDA:
      1. Jika fail PDF dilampirkan bersama arahan ini, jadikan PDF tersebut sebagai RUJUKAN MUTLAK. Jangan berhalusinasi.
      2. Berikan markah (0 hingga ${markahPenuh}) berdasarkan jawapan murid.
      3. Di bahagian komen, JANGAN berikan jawapan lurus jika murid salah.
      4. Gunakan gaya bahasa seorang guru ("Tahniah!", "Cuba fikirkan semula..."). Berikan satu 'hint' kecil dari nota/skema, dan lontarkan satu soalan inkuiri untuk merangsang murid berfikir.

      Hasilkan output dalam format JSON ini dengan tepat:
      {
        "markahDicadangkan": (nombor markah),
        "komen": "(Komen bimbingan Inkuiri Cikgu N.I.C yang mesra)"
      }
    `;

    // Jika PDF wujud, hantar Prompt + PDF. Jika tidak, hantar Prompt sahaja.
    const requestParts = pdfPart ? [prompt, pdfPart] : [prompt];
    
    console.log("Cikgu N.I.C sedang berfikir...");
    const result = await model.generateContent(requestParts);
    const responseText = result.response.text();
    
    const aiData = JSON.parse(responseText);
    
    // Pulangkan data kepada frontend (dengan tambahan info rujukan)
    return NextResponse.json({
        markahDicadangkan: aiData.markahDicadangkan,
        komen: aiData.komen,
        rujukan: rujukanDigunakan
    });

  } catch (error: any) {
    console.error("RALAT KRONIK AI:", error);
    
    // TAKTIK DETEKTIF AWAK DIKEKALKAN!
    let senaraiModelBolehGuna = "Gagal dikesan";
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
      const dataModel = await res.json();
      if (dataModel.models) {
        const modelGenerateContent = dataModel.models.filter((m: any) => 
            m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")
        );
        senaraiModelBolehGuna = modelGenerateContent.map((m: any) => m.name.replace('models/', '')).join(' | ');
      }
    } catch (err) {}

    return NextResponse.json({ 
        markahDicadangkan: 0, 
        komen: `SISTEM AI GAGAL.\n\nSenarai Model Aktif:\n👉 [ ${senaraiModelBolehGuna} ]`,
        rujukan: "Gagal"
    });
  }
}