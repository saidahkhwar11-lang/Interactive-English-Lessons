const $ = id => document.getElementById(id);
const slots = new Map();
let mainCount = 0;
const status = $('status');
const create = $('createBtn');
let generatedUrls = [];

function toast(s) {
  $('toast').textContent = s;
  $('toast').classList.add('show');
  setTimeout(() => $('toast').classList.remove('show'), 1700);
}

function slotId(c) { return c.dataset.slot; }

function initSource(c) {
  const chk = c.querySelector('.not-from-book');
  const page = c.querySelector('.activity-page');
  if (!chk || !page) return;
  chk.addEventListener('change', () => {
    page.disabled = chk.checked;
    if (chk.checked) page.value = '';
    page.placeholder = chk.checked ? 'Not from the book' : 'e.g. 12';
  });
}

function initSlot(c) {
  const id = slotId(c);
  if (!slots.has(id)) slots.set(id, []);
  initSource(c);
  const input = c.querySelector('.slot-files');
  const zone = c.querySelector('.paste-zone');
  input?.addEventListener('change', () => addFiles(c, [...input.files]));
  zone?.addEventListener('paste', e => {
    const fs = [...e.clipboardData.files].filter(f => f.type.startsWith('image/') || f.type.startsWith('audio/') || f.type === 'application/pdf');
    if (fs.length) { e.preventDefault(); addFiles(c, fs); }
  });
  zone?.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag'); });
  zone?.addEventListener('dragleave', () => zone.classList.remove('drag'));
  zone?.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag');
    addFiles(c, [...e.dataTransfer.files]);
  });
  render(c);
}

function addFiles(c, files) {
  const id = slotId(c);
  const a = slots.get(id) || [];
  files.forEach(f => a.push({ id: crypto.randomUUID?.() || Date.now() + Math.random(), file: f, url: f.type.startsWith('image/') ? URL.createObjectURL(f) : '' }));
  slots.set(id, a);
  render(c);
  toast(`${files.length} file${files.length === 1 ? '' : 's'} added`);
}

function render(c) {
  const a = slots.get(slotId(c)) || [];
  const box = c.querySelector('.previews');
  if (!box) return;
  box.innerHTML = '';
  a.forEach(x => {
    const d = document.createElement('div');
    d.className = 'preview';
    d.innerHTML = x.url ? `<img src="${x.url}" alt="activity image"><button title="Remove">×</button>` : `<div class="file">${x.file.name}</div><button title="Remove">×</button>`;
    d.querySelector('button').onclick = () => {
      if (x.url) URL.revokeObjectURL(x.url);
      slots.set(slotId(c), a.filter(y => y.id !== x.id));
      render(c);
    };
    box.append(d);
  });
}

function sourceHtml() {
  return `<div class="activity-source"><label>📖 Activity Page <input class="activity-page" placeholder="e.g. 14"></label><label class="not-book"><input type="checkbox" class="not-from-book"> Not from the book</label></div>`;
}

function mainCard(n) {
  const d = document.createElement('div');
  d.className = 'activity-card';
  d.dataset.slot = 'main-' + n;
  d.innerHTML = `<div class="activity-head"><div><span class="badge main">MAIN ACTIVITY ${n}</span><h3>Main Activity ${n}</h3><p>Optional — paste or upload one or several activity pictures.</p></div><div><span class="ai-chip">✨ AI reads & builds it</span> <button class="remove-main" type="button">Remove</button></div></div>${sourceHtml()}<div class="paste-zone" tabindex="0"><b>📋 Paste activity picture here</b><span>Ctrl + V • drag & drop • or</span><label class="browse">Browse Files<input class="slot-files" type="file" accept="image/*,.pdf,audio/*" multiple></label></div><div class="previews"></div>`;
  d.querySelector('.remove-main').onclick = () => {
    (slots.get(d.dataset.slot) || []).forEach(x => x.url && URL.revokeObjectURL(x.url));
    slots.delete(d.dataset.slot);
    d.remove();
    renumber();
  };
  return d;
}

function renumber() {
  const cs = [...$('mainActivities').children];
  const oldData = cs.map(c => [c.dataset.slot, slots.get(c.dataset.slot) || []]);
  oldData.forEach(([id]) => slots.delete(id));
  cs.forEach((c, i) => {
    const id = 'main-' + (i + 1);
    c.dataset.slot = id;
    slots.set(id, oldData[i][1]);
    c.querySelector('.badge').textContent = 'MAIN ACTIVITY ' + (i + 1);
    c.querySelector('h3').textContent = 'Main Activity ' + (i + 1);
  });
  mainCount = cs.length;
  $('addMain').disabled = mainCount >= 5;
}

function addMain() {
  if (mainCount >= 5) return;
  const c = mainCard(mainCount + 1);
  $('mainActivities').append(c);
  mainCount++;
  initSlot(c);
  $('addMain').disabled = mainCount >= 5;
}

document.querySelectorAll('.activity-card[data-slot]').forEach(initSlot);
$('addMain').onclick = addMain;
addMain();
addMain();

function filesFor(id) { return (slots.get(id) || []).map(x => x.file); }

function activityMeta(c) {
  const notBook = c.querySelector('.not-from-book')?.checked || false;
  return { page: notBook ? '' : (c.querySelector('.activity-page')?.value.trim() || ''), not_from_book: notBook };
}

function htmlUrl(html) {
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
  generatedUrls.push(url);
  return url;
}

function safeName(s) {
  return (s || 'interactive-lesson').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase().slice(0, 80) || 'interactive-lesson';
}

function downloadHtml(html, name) {
  const a = document.createElement('a');
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

async function createLesson() {
  const grade = $('grade').value;
  const term = $('term').value;
  const skill = $('skill').value;
  const starterCard = document.querySelector('[data-slot="starter"]');
  const exitCard = document.querySelector('[data-slot="exit"]');
  const starter = filesFor('starter');
  const mains = [...$('mainActivities').children].map(c => ({ card: c, slot: c.dataset.slot, files: filesFor(c.dataset.slot) })).filter(x => x.files.length);
  const exit = filesFor('exit');

  if (!grade || !skill) {
    status.textContent = 'Please choose the grade and skill.';
    status.className = 'status error';
    return;
  }
  if (!starter.length && !mains.length && !exit.length) {
    status.textContent = 'Paste or upload at least one lesson activity picture.';
    status.className = 'status error';
    return;
  }

  const endpoint = window.LESSON_CREATOR_API || '/api/create-lesson';
  create.disabled = true;
  create.textContent = '✨ AI IS BUILDING YOUR LESSON…';
  status.textContent = 'Reading your textbook activities and preparing the complete lesson…';
  status.className = 'status';

  try {
    const form = new FormData();
    form.append('grade', grade);
    form.append('term', term);
    form.append('skill', skill);
    form.append('lesson_title', $('lessonTitle').value.trim());
    form.append('book_pages', $('bookPages').value.trim());
    form.append('prompt', $('lessonPrompt').value.trim());
    form.append('starter_meta', JSON.stringify(activityMeta(starterCard)));
    starter.forEach(f => form.append('starter', f));
    mains.forEach((m, i) => {
      form.append(`main_${i + 1}_meta`, JSON.stringify(activityMeta(m.card)));
      m.files.forEach(f => form.append(`main_${i + 1}`, f));
    });
    form.append('exit_ticket_meta', JSON.stringify(activityMeta(exitCard)));
    exit.forEach(f => form.append('exit_ticket', f));
    form.append('include_charter', 'true');

    const r = await fetch(endpoint, { method: 'POST', body: form });
    const raw = await r.text();
    let data;
    try { data = JSON.parse(raw); } catch { data = null; }
    if (!r.ok) throw new Error(data?.error || raw || `Request failed (${r.status})`);
    if (!data) throw new Error('The AI service returned an unreadable response.');

    generatedUrls.forEach(u => URL.revokeObjectURL(u));
    generatedUrls = [];

    let lessonUrl = data.lesson_url || '';
    let planUrl = data.plan_url || '';
    if (!lessonUrl && data.lesson_html) lessonUrl = htmlUrl(data.lesson_html);
    if (!planUrl && data.plan_html) planUrl = htmlUrl(data.plan_html);

    $('afterPanel').hidden = false;
    status.textContent = 'Lesson created successfully.';
    status.className = 'status ready';
    const bs = [...$('afterPanel').querySelectorAll('button')];
    bs.forEach(b => { b.disabled = true; b.onclick = null; });

    if (lessonUrl) {
      bs[0].disabled = false;
      bs[0].onclick = () => window.open(lessonUrl, '_blank');
      bs[2].disabled = false;
      bs[2].onclick = () => window.open(lessonUrl, '_blank');
    }
    if (planUrl) {
      bs[1].disabled = false;
      bs[1].onclick = () => window.open(planUrl, '_blank');
    }
    if (data.library_url) {
      bs[3].disabled = false;
      bs[3].onclick = () => window.open(data.library_url, '_self');
    }
    if (data.backup_url) {
      bs[4].disabled = false;
      bs[4].onclick = () => window.open(data.backup_url, '_blank');
    } else if (data.lesson_html || data.plan_html) {
      bs[4].disabled = false;
      bs[4].onclick = () => {
        const base = safeName(data.title || $('lessonTitle').value || `${grade}-${skill}`);
        if (data.lesson_html) downloadHtml(data.lesson_html, `${base}-lesson.html`);
        if (data.plan_html) setTimeout(() => downloadHtml(data.plan_html, `${base}-lesson-plan.html`), 250);
      };
    }

    $('afterPanel').scrollIntoView({ behavior: 'smooth' });
  } catch (e) {
    status.textContent = 'Could not create the lesson: ' + e.message;
    status.className = 'status error';
  } finally {
    create.disabled = false;
    create.textContent = '✨ CREATE MY LESSON';
  }
}

create.onclick = createLesson;
