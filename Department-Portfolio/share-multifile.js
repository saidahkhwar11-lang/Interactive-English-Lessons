/*
 * Adds extra files to existing Teacher Share & Inspire evidence folders.
 * Existing single-file uploads are preserved and migrated in place.
 */
const PERMANENT_KIT_TITLE='Interactive Lesson Creation Kit – English Department';
const PERMANENT_KIT_BASE='https://raw.githubusercontent.com/saidahkhwar11-lang/Interactive-English-Lessons/main/Lesson-Creation-Resources/Interactive-Lesson-Creation-Kit-English-Department/Interactive-Lesson-Creation-Kit-English-Department/';
const PERMANENT_KIT_NAMES=[
  '00-README.txt',
  '01-START-HERE-TEACHER-INSTRUCTIONS.txt',
  '02-MASTER-PROMPT.txt',
  '03-TEACHER-REQUEST-TEMPLATE.txt',
  '04-APPROVED-LESSON-STRUCTURE-AND-RULES.txt',
  '05-EXAMPLE-TEACHER-REQUEST.txt',
  '06-EXAMPLE-INTERACTIVE-LESSON-LINK.txt',
  '07-APPROVED-LESSON-PLAN-EXAMPLE.pdf',
  '08-DETAILED-REQUEST-REFERENCE.txt'
];
function isKitShare(s){
  const n=String(s&&s.title||'').toLowerCase().replace(/[^a-z0-9]+/g,'');
  return n==='interactivelessoncreationkitenglishdepartment';
}
function ensurePermanentKit(){
  state.shares=state.shares.filter(s=>!isKitShare(s));
  state.shares.push({
    term:'Term 1',
    cat:'Innovations',
    title:PERMANENT_KIT_TITLE,
    teacher:'Saidah Khwar',
    grade:'All grades',
    desc:'Complete approved department kit for creating interactive lessons with ChatGPT.',
    static:true,
    files:PERMANENT_KIT_NAMES.map(name=>({
      name,
      data:PERMANENT_KIT_BASE+encodeURIComponent(name),
      permanent:true,
      date:'2026-09-14'
    }))
  });
}
function shareFiles(s){
  if(!s)return[];
  if(!Array.isArray(s.files))s.files=[];
  if(s.file){
    if(!s.files.some(f=>f.name===s.file&&f.data===(s.data||''))){
      s.files.unshift({name:s.file,data:s.data||'',date:s.date||''});
    }
    delete s.file;
    delete s.data;
  }
  const seen=new Set();
  s.files=s.files.filter(f=>{
    const key=String(f.name||'')+'|'+String(f.data||'');
    if(seen.has(key))return false;
    seen.add(key);
    return true;
  });
  return s.files;
}
function openShareFile(shareIndex,fileIndex){
  const f=shareFiles(state.shares[shareIndex])[fileIndex];
  if(!f||!f.data)return alert('This file is not available on this browser.');
  openStoredFile(f.data,f.name);
}
function addFilesToShare(i){
  const s=state.shares[i];
  if(!s)return;
  openModal(`<div class="folder-head"><div><h2>📁 ${esc(s.title||'Evidence')}</h2><small>Add more files without replacing existing files</small></div></div><label>Choose file(s)</label><input id="extraShareFiles" type="file" multiple><div class="notice">You can select several files at the same time.</div><div class="actions"><button class="btn primary" onclick="saveExtraShareFiles(${i})">Add Files</button><button class="btn" onclick="openShareFolder(${i})">Cancel</button></div>`);
}
function saveExtraShareFiles(i){
  const input=document.getElementById('extraShareFiles');
  const selected=[...(input&&input.files||[])];
  if(!selected.length)return alert('Choose at least one file.');
  const s=state.shares[i];
  const target=shareFiles(s);
  Promise.all(selected.map(file=>new Promise((resolve,reject)=>{
    const r=new FileReader();
    r.onload=()=>resolve({name:file.name,data:r.result,date:new Date().toISOString()});
    r.onerror=reject;
    r.readAsDataURL(file);
  }))).then(files=>{
    const fresh=files.filter(f=>!target.some(x=>x.name===f.name&&x.data===f.data));
    if(!fresh.length)return alert('The selected file is already inside this folder.');
    target.push(...fresh);
    try{
      localStorage.setItem(K,JSON.stringify(state));
      renderAll();
      openShareFolder(i);
    }catch(e){
      target.splice(target.length-fresh.length,fresh.length);
      alert('These files are too large for this browser storage. Please choose smaller files.');
    }
  }).catch(()=>alert('One or more files could not be read.'));
}
function deleteShareFile(shareIndex,fileIndex){
  const s=state.shares[shareIndex],files=shareFiles(s);
  if(!files[fileIndex]||!confirm('Delete this file from the folder?'))return;
  const removed=files.splice(fileIndex,1)[0];
  if(s.file===removed.name&&s.data===removed.data){s.file='';s.data='';}
  save();
  openShareFolder(shareIndex);
}
function openShareFolder(i){
  const s=state.shares[i];
  if(!s)return;
  const files=shareFiles(s);
  const icon=s.cat==='Teaching Strategies'?'🧠':s.cat==='Assessment Samples'?'🧾':'💡';
  let rows=files.length?files.map((f,j)=>`<div class="clean-upload"><div class="file-icon">📄</div><div class="file-info"><b>${esc(f.name||'File')}</b><small>${f.date?esc(new Date(f.date).toLocaleDateString()):'Saved file'}</small></div><div class="file-actions">${f.data?`<button class="btn open-btn" onclick="openShareFile(${i},${j})">Open</button>`:`<button class="btn open-btn" disabled>Open</button>`}${f.permanent?'':`<button class="btn delete-btn" onclick="deleteShareFile(${i},${j})">Delete</button>`}</div></div>`).join(''):'<div class="empty-state">This folder has no files yet.</div>';
  openModal(`<div class="folder-head"><div><h2>${icon} ${esc(s.title||'Evidence')}</h2><small>${esc(s.teacher||'')}${s.grade?' · '+esc(s.grade):''} · ${files.length} file(s)</small></div><button class="btn primary add-btn" onclick="addFilesToShare(${i})">＋ Add Files</button></div>${s.desc?`<p class="folder-description">${esc(s.desc)}</p>`:''}<div class="clean-list">${rows}</div><div class="modal-footer"><button class="btn" onclick="viewShares('${String(s.cat).replace(/'/g,"\\'")}')">Back</button><button class="btn" onclick="closeModal()">Close</button></div>`);
}
function viewShares(cat){
  const arr=state.shares.map((s,i)=>({...s,_i:i})).filter(s=>s.term===state.term&&s.cat===cat);
  openModal(`<div class="folder-head"><div><h2>${esc(cat)}</h2><small>${esc(state.term)}</small></div><button class="btn primary add-btn" onclick="addShare('${String(cat).replace(/'/g,"\\'")}')">＋ Add</button></div>${arr.length?`<div class="clean-list">${arr.map(s=>{const count=shareFiles(state.shares[s._i]).length;return `<div class="clean-upload share-folder-row"><div class="file-icon">📁</div><div class="file-info"><b>${esc(s.title||'Evidence folder')}</b><small>${esc(s.teacher||'')}${s.grade?' · '+esc(s.grade):''} · ${count} file(s)</small></div><div class="file-actions"><button class="btn open-btn" onclick="openShareFolder(${s._i})">Open Folder</button><button class="btn" onclick="addFilesToShare(${s._i})">Add Files</button>${s.static?'':`<button class="btn delete-btn" onclick="deleteShare(${s._i})">Delete</button>`}</div></div>`}).join('')}</div>`:'<div class="empty-state">No uploads saved for this term yet.</div>'}<div class="modal-footer"><button class="btn" onclick="closeModal()">Close</button></div>`);
}
(function(){
  const style=document.createElement('style');
  style.textContent='.share-folder-row .file-actions{flex-wrap:wrap;justify-content:flex-end}.folder-description{padding:10px 12px;margin:12px 0 0;background:#f7f8f6;border-radius:10px;color:#68777d}.box{width:min(760px,96vw)}@media(max-width:700px){.share-folder-row .file-actions{grid-column:1/-1}}';
  document.head.appendChild(style);
  ensurePermanentKit();
  state.shares.forEach(shareFiles);
  try{localStorage.setItem(K,JSON.stringify(state))}catch(e){}
  renderShares();
})();