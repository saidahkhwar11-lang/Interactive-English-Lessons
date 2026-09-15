const LESSON_PLAN_TARGET = 5;

function renderTeachers(){
  const key = weekKey();
  let output = '';
  state.teachers.forEach((teacher,index)=>{
    const uploaded = (teacher.plans?.[key] || []).length;
    const percent = Math.min(100, uploaded / LESSON_PLAN_TARGET * 100);
    const complete = uploaded >= LESSON_PLAN_TARGET;
    output += `<div class="teacher-list-row ${complete?'done':'low'}">
      <div class="name">📁 ${esc(teacher.name)}</div>
      <div class="progress"><div class="bar" style="width:${percent}%"></div></div>
      <div class="pct">${uploaded}/${LESSON_PLAN_TARGET}</div>
      <div class="work-status ${complete?'complete':'missing'}">${complete?'Complete':'Missing Work'}</div>
      <div class="teacher-row-actions">
        <button class="btn primary upload-row" onclick="uploadPlan(${index})">＋ Upload</button>
        <button class="btn details" onclick="openFolder(${index})">Details</button>
      </div>
    </div>`;
  });
  teacherGrid.innerHTML = output || '<p>No teacher folders yet.</p>';
  const stars = state.teachers.filter(t=>(t.plans?.[key]||[]).length>=LESSON_PLAN_TARGET).map(t=>t.name);
  starTrack.textContent = stars.length
    ? '⭐ Star Teachers of the Week: ' + stars.join(' ⭐ ')
    : `⭐ Star Teachers of the Week: Teachers who upload at least ${LESSON_PLAN_TARGET} lesson plans this week will appear here automatically.`;
}

function uaeReportReleased(){
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA',{
    timeZone:'Asia/Dubai', weekday:'short', hour:'2-digit', hourCycle:'h23'
  }).formatToParts(new Date()).map(x=>[x.type,x.value]));
  return parts.weekday !== 'Mon' || Number(parts.hour) >= 12;
}

function openWeeklyReport(){
  if(!uaeReportReleased()) return alert('This week’s report will be released Monday at 12:00 PM UAE time.');
  const key = weekKey();
  const rows = state.teachers.map(teacher=>{
    const count = (teacher.plans?.[key] || []).length;
    return {name:teacher.name,count,missing:Math.max(0,LESSON_PLAN_TARGET-count),complete:count>=LESSON_PLAN_TARGET};
  });
  const complete = rows.filter(row=>row.complete).length;
  openModal(`<div class="weekly-report-print">
    <div class="report-title"><div><h2>Weekly Lesson Plan Upload Report</h2>
    <p>English Department · ${esc(state.term)} · Week ${state.week}</p></div>
    <div class="report-target">Target: at least ${LESSON_PLAN_TARGET} plans per teacher</div></div>
    <div class="report-summary">
      <div><small>Total Teachers</small><b>${rows.length}</b></div>
      <div><small>Complete</small><b>${complete}</b></div>
      <div><small>Missing Work</small><b>${rows.length-complete}</b></div>
    </div>
    <table class="weekly-report-table"><thead><tr><th>Teacher</th><th>Uploaded</th><th>Missing</th><th>Completion</th><th>Status</th></tr></thead>
    <tbody>${rows.length?rows.map(row=>`<tr><td><b>${esc(row.name)}</b></td><td>${row.count} of ${LESSON_PLAN_TARGET}</td><td>${row.missing}</td><td>${Math.min(100,Math.round(row.count/LESSON_PLAN_TARGET*100))}%</td><td><span class="report-status ${row.complete?'complete':'missing'}">${row.complete?'Complete':'Missing Work'}</span></td></tr>`).join(''):'<tr><td colspan="5">No teacher folders have been added.</td></tr>'}</tbody></table>
    <div class="report-note">Report release: Monday at 12:00 PM UAE time.</div>
  </div>
  <div class="modal-footer report-actions"><button class="btn primary" onclick="window.print()">Print / Save PDF</button><button class="btn" onclick="closeModal()">Close</button></div>`);
  document.getElementById('modal').classList.add('report-mode');
}

function buildLessonHeader(){
  const grid = document.getElementById('teacherGrid');
  if(!grid) return;
  const card = grid.closest('.card');
  if(!card) return;
  card.classList.add('lesson-compact');
  card.querySelector('.lesson-custom-head')?.remove();
  const head = document.createElement('div');
  head.className = 'lesson-custom-head';
  head.innerHTML = `<div class="lesson-title"><div class="lesson-badge">LP</div><div>
    <h3>Weekly Lesson Plan Follow-up</h3>
    <p>${esc(state.term)} · target: at least ${LESSON_PLAN_TARGET} lesson plans per teacher</p>
  </div></div>
  <div class="lesson-head-actions">
    <div class="week-control">
      <button class="week-arrow" onclick="changeTrackingWeek(Math.max(1,state.week-1))" title="Previous week">‹</button>
      <div class="week-current"><span>Week</span><strong>${state.week}</strong></div>
      <button class="week-arrow" onclick="changeTrackingWeek(state.week+1)" title="Next week">›</button>
    </div>
    <button class="btn pdf-report-btn" onclick="openWeeklyReport()">📄 PDF Report</button>
  </div>`;
  card.insertBefore(head,grid);
}

(function(){
  const style = document.createElement('style');
  style.textContent = `
    .teacher-list-row{grid-template-columns:minmax(170px,1.15fr) minmax(180px,2fr) 48px 92px auto!important}
    .teacher-row-actions{display:flex;gap:6px;justify-content:flex-end}
    .upload-row,.teacher-list-row .details{white-space:nowrap}
    .work-status{font-size:11px;font-weight:900;text-align:center;border-radius:999px;padding:5px 8px}
    .work-status.complete,.report-status.complete{background:#dfeee6;color:#397157}
    .work-status.missing,.report-status.missing{background:#f6e5e2;color:#a2524c}
    .lesson-head-actions{display:flex;align-items:center;gap:8px}
    .pdf-report-btn{height:35px;padding:7px 11px!important;white-space:nowrap;background:#789b96!important;color:#fff!important;border-color:#789b96!important}
    .report-title{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;border-bottom:2px solid #789b96;padding-bottom:12px}
    .report-title h2{margin:0 0 5px;color:#405a65}.report-title p{margin:0;color:#77868c}
    .report-target{font-weight:800;background:#edf4f2;padding:8px 10px;border-radius:9px;color:#506d68}
    .report-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin:14px 0}
    .report-summary>div{border:1px solid #dfe5e3;border-radius:10px;padding:10px;background:#fafbf9}
    .report-summary small{display:block;color:#7b898e}.report-summary b{display:block;font-size:22px;margin-top:3px}
    .weekly-report-table{width:100%;border-collapse:collapse}
    .weekly-report-table th,.weekly-report-table td{text-align:left;padding:9px 8px;border-bottom:1px solid #e1e6e4;font-size:13px}
    .weekly-report-table th{background:#eef3f1;color:#536a68}
    .report-status{display:inline-block;font-size:11px;font-weight:900;border-radius:999px;padding:5px 8px}
    .report-note{margin-top:12px;color:#7d898d;font-size:12px}
    @media(max-width:760px){.lesson-custom-head{flex-direction:column}.lesson-head-actions{width:100%;justify-content:space-between}.teacher-list-row{grid-template-columns:1fr auto!important}.teacher-list-row .progress,.work-status,.teacher-row-actions{grid-column:1/-1}.work-status{text-align:left;width:max-content}.teacher-row-actions{justify-content:flex-start}.report-title{display:block}.report-target{margin-top:10px}.report-summary{grid-template-columns:1fr}}
    @media print{body *{visibility:hidden!important}.modal.report-mode,.modal.report-mode *{visibility:visible!important}.modal.report-mode{display:block!important;position:absolute!important;inset:0!important;background:#fff!important;padding:0!important}.modal.report-mode .box{width:100%!important;max-height:none!important;overflow:visible!important;border:0!important;box-shadow:none!important}.modal.report-mode .report-actions{display:none!important}}
  `;
  document.head.appendChild(style);
  const originalClose = closeModal;
  closeModal = function(){document.getElementById('modal').classList.remove('report-mode');originalClose()};
  renderTeachers();
  buildLessonHeader();
})();
