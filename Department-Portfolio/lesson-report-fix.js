const LESSON_PLAN_TARGET = 5;
const LESSON_PLAN_FORM_URL = 'https://forms.cloud.microsoft/r/yJSaXpZkxM';
const WEEKLY_REPORTS_URL = 'https://emiratesschoolsese-my.sharepoint.com/:x:/g/personal/saidah_khwar_moe_sch_ae/IQDFNjvAgJnDSI9bsti8goDnAd3nVvODKMrlq1UE0yapyUw?e=whLCnT';
const TERM_SEQUENCE = ['Term 1','Term 2','Term 3'];
const TERM_MAX_WEEKS = {'Term 1':18,'Term 2':14};

function openLessonPlanUpload(){
  window.open(LESSON_PLAN_FORM_URL,'_blank','noopener');
}

function openWeeklyReports(){
  window.open(WEEKLY_REPORTS_URL,'_blank','noopener');
}

function normalizedTermWeek(term,week){
  let termIndex = Math.max(0,TERM_SEQUENCE.indexOf(term));
  let next = Number.parseInt(week,10);
  if(!Number.isFinite(next)) next = 1;
  while(next < 1 && termIndex > 0){
    termIndex -= 1;
    next += TERM_MAX_WEEKS[TERM_SEQUENCE[termIndex]] || 1;
  }
  while(TERM_MAX_WEEKS[TERM_SEQUENCE[termIndex]] && next > TERM_MAX_WEEKS[TERM_SEQUENCE[termIndex]] && termIndex < TERM_SEQUENCE.length-1){
    next -= TERM_MAX_WEEKS[TERM_SEQUENCE[termIndex]];
    termIndex += 1;
  }
  const resolvedTerm = TERM_SEQUENCE[termIndex];
  const maximum = TERM_MAX_WEEKS[resolvedTerm];
  return {term:resolvedTerm,week:Math.max(1,maximum?Math.min(next,maximum):next)};
}

function academicWeekInfo(weekNumber){
  const number = Math.max(1,Number(weekNumber)||1);
  const termStarts = {
    'Term 1': Date.UTC(2026,7,31),
    'Term 2': Date.UTC(2027,0,4),
    'Term 3': Date.UTC(2027,3,12)
  };
  const termStart = termStarts[state.term] ?? termStarts['Term 1'];
  const monday = new Date(termStart+(number-1)*7*86400000);
  const friday = new Date(monday.getTime()+4*86400000);
  const label = new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'});
  return {label:`${label.format(monday)} – ${label.format(friday)}`};
}

function renderTeachers(){
  let output = '';
  state.teachers.forEach((teacher)=>{
    output += `<div class="teacher-list-row followup-teacher-row">
      <div class="name">📁 ${esc(teacher.name)}</div>
      <div class="teacher-purpose">Submit weekly lesson plans through the official upload form</div>
      <div class="teacher-row-actions">
        <button class="btn primary upload-row" onclick="openLessonPlanUpload()">＋ Upload Lesson Plan</button>
      </div>
    </div>`;
  });
  teacherGrid.innerHTML = output || '<p>No teacher folders yet.</p>';
  if(typeof starTrack !== 'undefined' && starTrack){
    starTrack.innerHTML = `<strong>Official follow-up:</strong> Submission status, late work and missing plans are verified in the Weekly Follow-up Report.`;
    starTrack.classList.add('followup-note');
  }
}

function buildLessonHeader(){
  const grid = document.getElementById('teacherGrid');
  if(!grid) return;
  const card = grid.closest('.card');
  if(!card) return;
  card.classList.add('lesson-compact','followup-hub');
  card.querySelector('.lesson-custom-head')?.remove();
  const weekInfo = academicWeekInfo(state.week);
  const head = document.createElement('div');
  head.className = 'lesson-custom-head followup-head';
  head.innerHTML = `<div class="lesson-title"><div class="lesson-badge">LP</div><div>
    <h3>Lesson Plan Follow-up Hub</h3>
    <p>${esc(state.term)} · Week ${state.week} · ${weekInfo.label}</p>
    <div class="followup-rules"><span>Target: <b>${LESSON_PLAN_TARGET} lesson plans</b></span><span>Deadline: <b>Monday 12:00 PM</b></span></div>
  </div></div>
  <div class="lesson-head-actions">
    <button class="btn primary hub-upload" onclick="openLessonPlanUpload()">＋ Upload Lesson Plan</button>
    <button class="btn pdf-report-btn" onclick="openWeeklyReports()">📊 Live Follow-up Report</button>
  </div>`;
  card.insertBefore(head,grid);
}

(function(){
  const corrected = normalizedTermWeek(state.term,state.week);
  if(corrected.term!==state.term || corrected.week!==state.week){
    state.term=corrected.term;
    state.week=corrected.week;
    localStorage.setItem(K,JSON.stringify(state));
  }
  const style = document.createElement('style');
  style.textContent = `
    .followup-hub .teacher-list-row{grid-template-columns:minmax(190px,1fr) minmax(260px,1.7fr) auto!important;align-items:center}
    .followup-head{align-items:center!important}
    .followup-rules{display:flex;gap:8px;flex-wrap:wrap;margin-top:7px}
    .followup-rules span{font-size:11px;color:#61777c;background:#f1f5f3;border:1px solid #dfe7e4;border-radius:999px;padding:5px 9px}
    .lesson-head-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end}
    .hub-upload,.pdf-report-btn{height:38px;padding:8px 13px!important;white-space:nowrap}
    .pdf-report-btn{background:#789b96!important;color:#fff!important;border-color:#789b96!important}
    .teacher-purpose{font-size:11px;color:#7c8b8f;background:#f7f9f8;border:1px solid #e2e8e6;border-radius:8px;padding:8px 10px}
    .teacher-row-actions{display:flex;gap:6px;justify-content:flex-end}
    .upload-row{white-space:nowrap}
    .followup-note{margin-top:10px!important;background:#eef4f2!important;color:#60746f!important;border:1px solid #dce7e3!important;border-radius:10px!important;padding:10px 12px!important;font-size:11px!important}
    @media(max-width:850px){.followup-head{flex-direction:column;align-items:flex-start!important}.lesson-head-actions{width:100%;justify-content:flex-start}.followup-hub .teacher-list-row{grid-template-columns:1fr auto!important}.teacher-purpose{grid-column:1/-1}.teacher-row-actions{justify-content:flex-start;grid-column:1/-1}}
  `;
  document.head.appendChild(style);
  uploadPlan = openLessonPlanUpload;
  renderTeachers();
  buildLessonHeader();
})();
