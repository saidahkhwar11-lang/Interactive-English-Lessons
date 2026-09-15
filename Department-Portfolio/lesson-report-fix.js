const LESSON_PLAN_TARGET = 5;
const LESSON_PLAN_FORM_URL = 'https://forms.cloud.microsoft/r/yJSaXpZkxM';
const WEEKLY_REPORTS_URL = 'https://emiratesschoolsese-my.sharepoint.com/:f:/g/personal/saidah_khwar_moe_sch_ae/IgBQzFxSjWZMTIKG5LgC1i0pASiLwtKT3A4VO73YZU-8hGA?e=zX66O0';

function openLessonPlanUpload(){
  window.open(LESSON_PLAN_FORM_URL,'_blank','noopener');
}

function openWeeklyReports(){
  window.open(WEEKLY_REPORTS_URL,'_blank','noopener');
}

function academicWeekInfo(weekNumber){
  const number = Math.max(1,Number(weekNumber)||1);
  const monday = new Date(Date.UTC(2026,8,21+(number-4)*7));
  const friday = new Date(monday.getTime()+4*86400000);
  const iso = date=>date.toISOString().slice(0,10);
  const label = new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'});
  return {
    startDate: iso(monday),
    endDate: iso(friday),
    deadline: `${iso(monday)}T12:00:00+04:00`,
    label: `${label.format(monday)} – ${label.format(friday)}`
  };
}

function weeklyTeacherStatus(teacherName){
  const week = window.WEEKLY_LESSON_PLAN_DATA?.weeks?.[String(state.week)];
  if(!week) return null;
  const wanted = String(teacherName || '').trim().toLowerCase();
  const match = Object.entries(week.teachers || {}).find(([name])=>String(name).trim().toLowerCase()===wanted);
  if(!match) return null;
  const value = match[1] || {};
  const submissions = Array.isArray(value.submissions) ? value.submissions.filter(Boolean) : [];
  const deadline = new Date(week.deadline || academicWeekInfo(state.week).deadline).getTime();
  const calculatedLate = Number.isFinite(deadline)
    ? submissions.filter(date=>new Date(date).getTime()>deadline).length
    : 0;
  return {
    total: submissions.length || Math.max(0,Number(value.total)||0),
    late: submissions.length ? calculatedLate : Math.max(0,Number(value.late)||0),
    lastSubmission: submissions.at(-1) || value.lastSubmission || ''
  };
}

function teacherProgressMarkup(status){
  if(!status) return `<div class="weekly-awaiting">Awaiting weekly update</div>`;
  const total = status.total;
  const remaining = Math.max(0,LESSON_PLAN_TARGET-total);
  const complete = total >= LESSON_PLAN_TARGET;
  const percent = Math.min(100,Math.round(total/LESSON_PLAN_TARGET*100));
  const label = total===0 ? 'No Uploads' : complete ? 'Target Complete' : `${remaining} Remaining`;
  return `<div class="weekly-progress-wrap">
    <div class="weekly-progress-meta"><b>${total}/${LESSON_PLAN_TARGET} — ${label}</b>${status.late?`<span class="late-badge">Late: ${status.late}</span>`:''}</div>
    <div class="progress weekly-progress" role="progressbar" aria-label="${total} of ${LESSON_PLAN_TARGET} lesson plans" aria-valuemin="0" aria-valuemax="${LESSON_PLAN_TARGET}" aria-valuenow="${Math.min(total,LESSON_PLAN_TARGET)}"><div class="bar ${complete?'complete':''}" style="width:${percent}%"></div></div>
  </div>`;
}

function renderTeachers(){
  let output = '';
  const stars = [];
  state.teachers.forEach((teacher,index)=>{
    const status = weeklyTeacherStatus(teacher.name);
    if(status?.total >= LESSON_PLAN_TARGET) stars.push(teacher.name);
    output += `<div class="teacher-list-row">
      <div class="name">📁 ${esc(teacher.name)}</div>
      ${teacherProgressMarkup(status)}
      <div class="teacher-row-actions">
        <button class="btn primary upload-row" onclick="openLessonPlanUpload()">＋ Upload</button>
        <button class="btn details" onclick="openWeeklyReports()">Details</button>
      </div>
    </div>`;
  });
  teacherGrid.innerHTML = output || '<p>No teacher folders yet.</p>';
  const updated = window.WEEKLY_LESSON_PLAN_DATA?.updatedAt;
  starTrack.textContent = stars.length
    ? `⭐ Star Teachers of Week ${state.week}: ${stars.join(' ⭐ ')}`
    : `⭐ Star Teachers of Week ${state.week}: No teacher has reached ${LESSON_PLAN_TARGET}/${LESSON_PLAN_TARGET} in the latest update.${updated?' Updated '+updated+'.':''}`;
}

function uaeReportReleased(){
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA',{
    timeZone:'Asia/Dubai', weekday:'short', hour:'2-digit', hourCycle:'h23'
  }).formatToParts(new Date()).map(x=>[x.type,x.value]));
  return parts.weekday !== 'Mon' || Number(parts.hour) >= 12;
}

function openWeeklyReport(){
  openWeeklyReports();
}

function buildLessonHeader(){
  const grid = document.getElementById('teacherGrid');
  if(!grid) return;
  const card = grid.closest('.card');
  if(!card) return;
  card.classList.add('lesson-compact');
  card.querySelector('.lesson-custom-head')?.remove();
  const head = document.createElement('div');
  const weekInfo = academicWeekInfo(state.week);
  head.className = 'lesson-custom-head';
  head.innerHTML = `<div class="lesson-title"><div class="lesson-badge">LP</div><div>
    <h3>Weekly Lesson Plan Follow-up</h3>
    <p>${esc(state.term)} · Week ${state.week}: ${weekInfo.label} · target: ${LESSON_PLAN_TARGET} lesson plans</p>
  </div></div>
  <div class="lesson-head-actions">
    <div class="week-control">
      <button class="week-arrow" onclick="changeTrackingWeek(Math.max(1,state.week-1))" title="Previous week">‹</button>
      <div class="week-current"><span>Week</span><strong>${state.week}</strong></div>
      <button class="week-arrow" onclick="changeTrackingWeek(state.week+1)" title="Next week">›</button>
    </div>
    <button class="btn pdf-report-btn" onclick="openWeeklyReport()">📂 Weekly Reports</button>
  </div>`;
  card.insertBefore(head,grid);
}

(function(){
  const style = document.createElement('style');
  style.textContent = `
    .teacher-list-row{grid-template-columns:minmax(190px,1.05fr) minmax(310px,2fr) auto!important}
    .report-record-note{color:#6f7f85;font-size:12px;line-height:1.35}
    .weekly-progress-wrap{display:grid;gap:5px;min-width:0}
    .weekly-progress-meta{display:flex;align-items:center;justify-content:space-between;gap:8px;color:#536a70;font-size:11px}
    .weekly-progress-meta b{white-space:nowrap}
    .weekly-progress{height:7px!important;background:#e8eeec!important;border-radius:999px;overflow:hidden}
    .weekly-progress .bar{height:100%;background:#d69b58!important;border-radius:999px;transition:width .3s ease}
    .weekly-progress .bar.complete{background:#5e9a75!important}
    .weekly-awaiting{font-size:11px;color:#899497;background:#f5f7f6;border:1px dashed #d8dfdc;border-radius:8px;padding:7px 9px}
    .late-badge{font-size:10px;font-weight:900;color:#a2524c;background:#f6e5e2;border-radius:999px;padding:3px 7px;white-space:nowrap}
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
    @media(max-width:760px){.lesson-custom-head{flex-direction:column}.lesson-head-actions{width:100%;justify-content:space-between}.teacher-list-row{grid-template-columns:1fr auto!important}.weekly-progress-wrap,.weekly-awaiting,.teacher-row-actions{grid-column:1/-1}.teacher-row-actions{justify-content:flex-start}.report-title{display:block}.report-target{margin-top:10px}.report-summary{grid-template-columns:1fr}}
    @media print{body *{visibility:hidden!important}.modal.report-mode,.modal.report-mode *{visibility:visible!important}.modal.report-mode{display:block!important;position:absolute!important;inset:0!important;background:#fff!important;padding:0!important}.modal.report-mode .box{width:100%!important;max-height:none!important;overflow:visible!important;border:0!important;box-shadow:none!important}.modal.report-mode .report-actions{display:none!important}}
  `;
  document.head.appendChild(style);
  const originalClose = closeModal;
  closeModal = function(){document.getElementById('modal').classList.remove('report-mode');originalClose()};
  uploadPlan = openLessonPlanUpload;
  renderTeachers();
  buildLessonHeader();
})();
