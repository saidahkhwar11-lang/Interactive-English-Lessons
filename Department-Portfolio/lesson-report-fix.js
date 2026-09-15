const LESSON_PLAN_TARGET = 5;
const LESSON_PLAN_FORM_URL = 'https://forms.cloud.microsoft/r/yJSaXpZkxM';
const WEEKLY_REPORTS_URL = 'https://emiratesschoolsese-my.sharepoint.com/:f:/g/personal/saidah_khwar_moe_sch_ae/IgBQzFxSjWZMTIKG5LgC1i0pASiLwtKT3A4VO73YZU-8hGA?e=zX66O0';

function openLessonPlanUpload(){
  window.open(LESSON_PLAN_FORM_URL,'_blank','noopener');
}

function openWeeklyReports(){
  window.open(WEEKLY_REPORTS_URL,'_blank','noopener');
}

function renderTeachers(){
  let output = '';
  state.teachers.forEach((teacher,index)=>{
    output += `<div class="teacher-list-row">
      <div class="name">📁 ${esc(teacher.name)}</div>
      <div class="report-record-note">Uploads and compliance are recorded in the official weekly report.</div>
      <div class="teacher-row-actions">
        <button class="btn primary upload-row" onclick="openLessonPlanUpload()">＋ Upload</button>
        <button class="btn details" onclick="openWeeklyReports()">Details</button>
      </div>
    </div>`;
  });
  teacherGrid.innerHTML = output || '<p>No teacher folders yet.</p>';
  starTrack.textContent = `Weekly compliance is confirmed in the Monday report. Target: at least ${LESSON_PLAN_TARGET} lesson plans per teacher.`;
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
    <button class="btn pdf-report-btn" onclick="openWeeklyReport()">📂 Weekly Reports</button>
  </div>`;
  card.insertBefore(head,grid);
}

(function(){
  const style = document.createElement('style');
  style.textContent = `
    .teacher-list-row{grid-template-columns:minmax(190px,1.15fr) minmax(280px,2fr) auto!important}
    .report-record-note{color:#6f7f85;font-size:12px;line-height:1.35}
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
  uploadPlan = openLessonPlanUpload;
  renderTeachers();
  buildLessonHeader();
})();
