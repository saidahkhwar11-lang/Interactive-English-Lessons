import OpenAI from 'openai';
import formidable from 'formidable';
import fs from 'node:fs';
import fsp from 'node:fs/promises';

export const config = { maxDuration: 60 };

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MASTER_PROMPT_URL = 'https://raw.githubusercontent.com/saidahkhwar11-lang/Interactive-English-Lessons/main/Lesson-Creation-Resources/Interactive-Lesson-Master-Prompt.txt';

function first(v='') { return Array.isArray(v) ? (v[0] || '') : (v || ''); }
function arr(v) { return !v ? [] : (Array.isArray(v) ? v : [v]); }

async function parseMultipart(req) {
  return await new Promise((resolve, reject) => {
    const form = formidable({ multiples: true, maxFiles: 30, maxFileSize: 8 * 1024 * 1024, maxTotalFileSize: 24 * 1024 * 1024, allowEmptyFiles: false });
    form.parse(req, (err, fields, files) => err ? reject(err) : resolve({ fields, files }));
  });
}

function mimeOf(file) { return file.mimetype || 'application/octet-stream'; }

async function imagePart(file) {
  const data = await fsp.readFile(file.filepath);
  return { type: 'input_image', image_url: `data:${mimeOf(file)};base64,${data.toString('base64')}`, detail: 'high' };
}

async function pdfPart(file) {
  const data = await fsp.readFile(file.filepath);
  return { type: 'input_file', filename: file.originalFilename || 'activity.pdf', file_data: data.toString('base64') };
}

async function transcribeAudio(file) {
  const tx = await client.audio.transcriptions.create({
    model: process.env.OPENAI_TRANSCRIBE_MODEL || 'gpt-4o-mini-transcribe',
    file: fs.createReadStream(file.filepath)
  });
  return tx.text || '';
}

function safeJson(v, fallback={}) {
  try { return JSON.parse(first(v) || '{}'); } catch { return fallback; }
}

async function appendFiles(content, label, files) {
  const list = arr(files);
  if (!list.length) return;
  content.push({ type:'input_text', text:`\n${label} source material follows. Inspect it carefully and use its actual content, not invented textbook content.` });
  for (const file of list) {
    const mime = mimeOf(file);
    if (mime.startsWith('image/')) content.push(await imagePart(file));
    else if (mime === 'application/pdf') content.push(await pdfPart(file));
    else if (mime.startsWith('audio/')) {
      const transcript = await transcribeAudio(file);
      content.push({ type:'input_text', text:`Audio transcript for ${label}:\n${transcript}` });
    }
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error:'Method not allowed' });
  if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error:'OPENAI_API_KEY is not configured in Vercel yet.' });

  try {
    const { fields, files } = await parseMultipart(req);
    const grade = first(fields.grade), term = first(fields.term), skill = first(fields.skill);
    if (!grade || !skill) return res.status(400).json({ error:'Grade and skill are required.' });

    const masterPrompt = await fetch(MASTER_PROMPT_URL).then(r => {
      if (!r.ok) throw new Error('Could not load the locked Master Prompt.');
      return r.text();
    });

    const metadata = {
      grade, term, skill,
      lesson_title: first(fields.lesson_title),
      book_pages: first(fields.book_pages),
      special_request: first(fields.prompt),
      starter: safeJson(fields.starter_meta),
      exit_ticket: safeJson(fields.exit_ticket_meta),
      include_charter: first(fields.include_charter) === 'true'
    };

    const content = [{
      type:'input_text',
      text:`You are generating a complete classroom-ready interactive English lesson webpage and its exact school lesson-plan webpage.\n\nLOCKED MASTER PROMPT — follow it strictly:\n${masterPrompt}\n\nTEACHER INPUT:\n${JSON.stringify(metadata, null, 2)}\n\nIMPORTANT IMPLEMENTATION RULES:\n- Produce TWO complete standalone HTML documents: lesson_html and plan_html.\n- lesson_html must be visually polished, interactive, board-ready, responsive, and self-contained with CSS and JavaScript embedded.\n- Preserve uploaded activity order: Starter, populated Main Activities only, Exit Ticket, then Charter Connection Activity.\n- Every Main Activity is optional; do not create empty activities.\n- Read uploaded screenshots/images/PDF pages and build instructions/questions/answers from what is actually visible.\n- Use adult female-student imagery only if any imagery is created or referenced stylistically.\n- The lesson plan must follow the exact bilingual school-plan structure defined in the Master Prompt; do not simplify it.\n- Include answer reveal, timers, Full Screen/maximize behavior, highlighting where applicable, and a real interactive Exit Ticket game of at most 5 questions.\n- Add Deep Thinking only when it genuinely suits the reading/listening content.\n- Add the Charter Connection Activity after Exit Ticket and infer the most relevant Charter axis.\n- If lesson title is blank, infer a concise title from the uploaded content.\n- Do not use external libraries or remote assets that are required for core functionality.\n- Return valid HTML only inside the JSON fields; no markdown fences.`
    }];

    await appendFiles(content, 'STARTER', files.starter);
    for (let i=1;i<=5;i++) {
      const f = files[`main_${i}`];
      if (arr(f).length) {
        const meta = safeJson(fields[`main_${i}_meta`]);
        content.push({ type:'input_text', text:`MAIN ACTIVITY ${i} metadata: ${JSON.stringify(meta)}` });
        await appendFiles(content, `MAIN ACTIVITY ${i}`, f);
      }
    }
    await appendFiles(content, 'EXIT TICKET', files.exit_ticket);

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || 'gpt-5.6-terra',
      reasoning: { effort: process.env.OPENAI_REASONING_EFFORT || 'medium' },
      input: [{ role:'user', content }],
      max_output_tokens: 30000,
      text: {
        verbosity: 'medium',
        format: {
          type:'json_schema',
          name:'lesson_package',
          strict:true,
          schema:{
            type:'object',
            additionalProperties:false,
            properties:{
              title:{type:'string'},
              lesson_html:{type:'string'},
              plan_html:{type:'string'}
            },
            required:['title','lesson_html','plan_html']
          }
        }
      }
    });

    const payload = JSON.parse(response.output_text);
    return res.status(200).json(payload);
  } catch (err) {
    console.error(err);
    const msg = err?.message || 'Lesson generation failed.';
    return res.status(500).json({ error: msg });
  }
}
