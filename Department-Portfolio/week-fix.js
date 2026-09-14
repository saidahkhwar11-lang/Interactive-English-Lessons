function availableTrackingWeeks(){
  let max=Math.max(1,parseInt(state.week,10)||1);
  const prefix=state.term+'-W';
  state.teachers.forEach(t=>{
    Object.keys(t.plans||{}).forEach(k=>{
      if(k.startsWith(prefix)){
        const n=parseInt(k.slice(prefix.length),10);
        if(Number.isFinite(n)&&n>max)max=n;
      }
    });
  });
  return Array.from({length:max},(_,i)=>i+1);
}

function lessonRows(i){
  const t=state.teachers[i];
  const k=weekKey();
  return (t.plans[k]||[]).map((p,j)=>({p,key:k,index:j,week:state.week}))
    .sort((a,b)=>String(b.p.date||'').localeCompare(String(a.p.date||'')));
}

function changeTrackingWeek(v){
  let n=parseInt(v,10);
  if(!Number.isFinite(n)||n<1)n=1;
  state.week=n;
  localStorage.setItem(K,JSON.stringify(state));
  renderAll();
  buildLessonHeader();
}

function buildLessonHeader(){
  const grid=document.getElementById('teacherGrid');
  if(!grid)return;
  const card=grid.closest('.card');
  if(!card)return;
  card.classList.add('lesson-compact');
  const old=card.querySelector('.lesson-custom-head');
  if(old)old.remove();
  const weeks=availableTrackingWeeks();
  const options=weeks.map(w=>`<option value="${w}" ${w===Number(state.week)?'selected':''}>Week ${w}</option>`).join('');
  const head=document.createElement('div');
  head.className='lesson-custom-head';
  head.innerHTML=`<div class="lesson-title"><div class="lesson-badge">LP</div><div><h3>Weekly Lesson Plan Follow-up</h3><p>${esc(state.term)} · choose a week to view only that week’s plans</p></div></div><div class="week-control"><button class="week-arrow" onclick="changeTrackingWeek(Math.max(1,state.week-1))" title="Previous week">‹</button><select class="week-select" onchange="changeTrackingWeek(this.value)" aria-label="Select week">${options}</select><button class="week-arrow" onclick="changeTrackingWeek(state.week+1)" title="Next week">›</button></div>`;
  card.insertBefore(head,grid);
}

function openFolder(i){
  const t=state.teachers[i];
  const rows=lessonRows(i);
  let html=`<div class="folder-head"><div><h2>📁 ${esc(t.name)}</h2><small>${esc(state.term)} · Week ${state.week} only</small></div><button class="btn primary add-btn" onclick="uploadPlan(${i})">＋ Add</button></div>`;
  if(!rows.length){
    html+=`<div class="empty-state">No lesson plans uploaded for Week ${state.week}.</div>`;
  }else{
    html+=`<div class="clean-list">${rows.map(r=>{const p=r.p;return `<div class="clean-upload"><div class="file-icon">📄</div><div class="file-info"><b>${esc(p.file||'Lesson plan')}</b><small>${esc(p.grade||'Grade not specified')} · Week ${state.week}</small></div><div class="file-actions">${p.data?`<button class="btn open-btn" onclick="openStoredFile(state.teachers[${i}].plans['${r.key}'][${r.index}].data,'${esc(p.file||'lesson-plan')}')">Open</button>`:`<button class="btn open-btn" disabled title="This older entry has no stored file">Open</button>`}<button class="btn delete-btn" onclick="deletePlan(${i},'${r.key}',${r.index})">Delete</button></div></div>`}).join('')}</div>`;
  }
  html+='<div class="modal-footer"><button class="btn" onclick="closeModal()">Close</button></div>';
  openModal(html);
}

(function applyWeeklyHistoryFix(){
  const style=document.createElement('style');
  style.textContent=`.week-select{border:0;background:#f8f9f7;color:#53676e;font:inherit;font-weight:800;font-size:12px;padding:6px 24px 6px 9px;border-radius:7px;cursor:pointer;width:auto;min-width:88px}.week-select:focus{outline:2px solid #cbd9d4;outline-offset:1px}`;
  document.head.appendChild(style);

  const meetingCard=[...document.querySelectorAll('.card')].find(c=>c.querySelector('h3')&&c.querySelector('h3').textContent.includes('Meeting Minutes'));
  if(meetingCard){
    const addBtn=[...meetingCard.querySelectorAll('button')].find(b=>b.textContent.includes('Add Meeting Minutes'));
    if(addBtn){const actions=addBtn.closest('.actions');if(actions)actions.remove();else addBtn.remove();}
  }

  renderTeachers();
  buildLessonHeader();
})();