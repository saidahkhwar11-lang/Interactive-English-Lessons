export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "POST only" }), { status: 405, headers: { "content-type": "application/json" } });
  try {
    const { image, grade, task, style, outOf } = await req.json();
    if (!image || !String(image).startsWith("data:image/")) return new Response(JSON.stringify({ error: "Please upload a clear image." }), { status: 400, headers: { "content-type": "application/json" } });
    const max = Number(outOf) || 20;
    const prompt = `You are an experienced English teacher at a UAE girls' school marking one student's actual work.
Grade: ${grade}. Task: ${task}. Requested style: ${style}. Mark is out of ${max}.

Read ONLY what is genuinely visible in the image. Never invent student wording. If a section is unclear, say it is unclear instead of guessing.
Give natural, concise teacher feedback, not generic AI language.
WWW: 1-2 specific strengths supported by visible evidence.
EBI: 1-2 highest-value next steps, referring to actual wording where useful.
Corrections: only real spelling/grammar/punctuation issues visible; show concise "student wording → correction" examples. If none are clear, say "No clear correction needed from the visible work."
Teacher comment: warm, short, varied, natural.
Score fairly for the selected grade/task. Do not over-penalize handwriting unless presentation is relevant.
Return ONLY valid JSON with keys: mark (number), www (string), ebi (string), corrections (string), finalComment (string).`;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: "gpt-5.1",
        input: [{ role: "user", content: [
          { type: "input_text", text: prompt },
          { type: "input_image", image_url: image, detail: "high" }
        ] }],
        max_output_tokens: 1200
      })
    });
    const data = await response.json();
    if (!response.ok) return new Response(JSON.stringify({ error: data?.error?.message || "AI marking failed." }), { status: response.status, headers: { "content-type": "application/json" } });
    const text = data.output_text || (data.output || []).flatMap(x=>x.content||[]).find(x=>x.type==="output_text")?.text || "";
    if (!text) return new Response(JSON.stringify({ error: "The AI returned no feedback text." }), { status: 502, headers: { "content-type": "application/json" } });
    const clean = text.replace(/^\`\`\`json\s*/i,"").replace(/\`\`\`\s*$/,"").trim();
    const result = JSON.parse(clean);
    result.mark = Math.max(0, Math.min(max, Number(result.mark) || 0));
    return new Response(JSON.stringify(result), { status: 200, headers: { "content-type": "application/json", "cache-control": "no-store" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Could not analyze this work: " + (e?.message || String(e)) }), { status: 500, headers: { "content-type": "application/json" } });
  }
}