import { NextResponse } from "next/server";
import mammoth from "mammoth";

type ImportedQuestion = {
  id: string;
  prompt: string;
  type: "open" | "single_choice" | "scale" | "yes_no";
  options: string[];
  required: boolean;
};

const cleanText = (value: string) =>
  value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();

const questionFromRow = (cells: string[], headers: string[]): ImportedQuestion | null => {
  const prompt = cleanText(cells[0] || "").replace(/^\d+[.)-]?\s*/, "");
  if (!prompt || /^(pregunta|reactivo|ítem|item)$/i.test(prompt)) return null;

  const options = headers.slice(1).map(cleanText).filter(Boolean);
  const normalized = options.map((option) => option.toLowerCase());
  const isScale = options.length === 5 && options.every((option, index) => option === String(index + 1));
  const isYesNo = normalized.length === 2 && normalized.includes("sí") && normalized.includes("no");

  return {
    id: crypto.randomUUID(),
    prompt,
    type: isScale ? "scale" : isYesNo ? "yes_no" : options.length > 1 ? "single_choice" : "open",
    options: isScale || isYesNo ? [] : options,
    required: true,
  };
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Selecciona un archivo Word." }, { status: 400 });
    if (!file.name.toLowerCase().endsWith(".docx")) return NextResponse.json({ error: "Por ahora el importador acepta archivos .docx." }, { status: 400 });
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "El archivo no puede superar 10 MB." }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const [{ value: rawText }, { value: html }] = await Promise.all([
      mammoth.extractRawText({ buffer }),
      mammoth.convertToHtml({ buffer }),
    ]);

    const lines = rawText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const tableRows = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].map((row) =>
      [...row[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((cell) => cleanText(cell[1])),
    ).filter((row) => row.length > 0);

    const questions: ImportedQuestion[] = [];
    if (tableRows.length > 1) {
      const headers = tableRows[0];
      for (const row of tableRows.slice(1)) {
        const question = questionFromRow(row, headers);
        if (question) questions.push(question);
      }
    }

    if (!questions.length) {
      for (const line of lines) {
        const numbered = line.match(/^\d+[.)-]\s*(.+)/);
        const prompt = numbered?.[1] || (line.endsWith("?") ? line : "");
        if (prompt) questions.push({ id: crypto.randomUUID(), prompt, type: "open", options: [], required: true });
      }
    }

    const notesLabel = lines.find((line) => /notas? adicionales?|comentarios? adicionales?/i.test(line));
    if (notesLabel) questions.push({ id: crypto.randomUUID(), prompt: notesLabel.replace(/\(opcional\)/i, "").replace(/:$/, "").trim(), type: "open", options: [], required: false });

    const title = lines.find((line) => /cuestionario|encuesta|registro/i.test(line) && !/^instrucciones/i.test(line)) || file.name.replace(/\.docx$/i, "").replace(/_/g, " ");
    const subtitle = lines.find((line) => /seguimiento|autorregistro/i.test(line) && line !== title && !/^este cuestionario/i.test(line));
    const instructionLine = lines.find((line) => /^instrucciones?:/i.test(line));
    const disclaimer = lines.find((line) => /^este (cuestionario|registro|formulario)/i.test(line));
    const instructions = [subtitle, instructionLine?.replace(/^instrucciones?:\s*/i, ""), disclaimer].filter(Boolean).join("\n\n");

    if (!questions.length) return NextResponse.json({ error: "No pude identificar preguntas. Puedes agregarlas manualmente en el creador." }, { status: 422 });

    return NextResponse.json({
      title,
      instructions,
      frequency: /diario|cada día/i.test(rawText) ? "daily" : /semanal|cada semana/i.test(rawText) ? "weekly" : "once",
      questions,
    });
  } catch (error) {
    console.error("DOCX import failed", error);
    return NextResponse.json({ error: "No pude leer este Word. Verifica que sea un archivo .docx válido." }, { status: 500 });
  }
}
