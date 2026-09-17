const LESSON_PLAN_TARGET = 5;
const LESSON_PLAN_FORM_URL = 'https://forms.cloud.microsoft/r/yJSaXpZkxM';
const WEEKLY_REPORTS_URL = 'https://emiratesschoolsese-my.sharepoint.com/:x:/g/personal/saidah_khwar_moe_sch_ae/IQDFNjvAgJnDSI9bsti8goDnAd3nVvODKMrlq1UE0yapyUw?e=whLCnT';
const TERM_SEQUENCE = ['Term 1','Term 2','Term 3'];
const TERM_MAX_WEEKS = {'Term 1':18,'Term 2':14};

function openLessonPlanUpload(){window.open(LESSON_PLAN_FORM_URL,'_blank','noopener');}
function openWeeklyReports(){window.open(WEEKLY_REPORTS_URL,'_blank','noopener');}
function openAllLessonPlans(){if(typeof openAllSharedPlans==='function')openAllSharedPlans();else alert('Shared lesson plans are still loading. Please try again in a moment.');}

function normalizedTermWeek(term,week){
  let termIndex=Math.max(0,TERM_SEQUENCE.indexOf(term));let next=Number.parseInt(week,10);if(!Number.isFinite(next))next=1;
  while(next<1&&termIndex>0){termIndex-=1;next+=TERM_MAX_WEEKS[TERM_SEQUENCE[termIndex]]||1;}
  while(TERM_MAX_WEEKS[TERM_SEQUENCE[termIndex]]&&next>TERM_MAX_WEEKS[TERM_SEQUENCE[termIndex]]&&termIndex<TERM_SEQUENCE.length-1){next-=TERM_MAX_WEEKS[TERM_SEQUENCE[termIndex]];termIndex+=1;}
  const resolvedTerm=TERM_SEQUENCE[termIndex],maximum=TERM_MAX_WEEKS[resolvedTerm];
  return {term:resolvedTerm,week:Math.max(1,maximum?Math.min(next,maximum):next)};
}

function academicWeekInfo(weekNumber){
  const number=Math.max(1,Number(weekNumber)||1);
  const termStarts={'Term 1':Date.UTC(2026,7,31),'Term 2':Date.UTC(2027,0,4),'Term 3':Date.UTC(2027,3,12)};
  const termStart=termStarts[state.term]??termStarts['Term 1'];
  const monday=new Date(termStart+(number-1)*7*86400000),friday=new Date(monday.getTime()+4*86400000);
  const label=new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'});
  return {label:`${label.format(monday)} – ${label.format(friday)}`};
}

function changeFollowupWeek(delta){
  const next=normalizedTermWeek(state.term,Number(state.week)+delta);
  state.term=next.term;state.week=next.week;localStorage.setItem(K,JSON.stringify(state));
  renderTeachers();buildLessonHeader();
}

function renderTeachers(){
  teacherGrid.innerHTML=state.teachers.map(teacher=>`<div class="teacher-list-row followup-teacher-row"><div class="name">📁 ${esc(teacher.name)}</div><button class="btn primary upload-row" onclick="openLessonPlanUpload()">＋ Upload</button></div>`).join('')||'<p>No teacher folders yet.</p>';
  if(typeof starTrack!=='undefined'&&starTrack)starTrack.style.display='none';
}

function buildLessonHeader(){
  const grid=document.getElementById('teacherGrid');if(!grid)return;const card=grid.closest('.card');if(!card)return;
  card.classList.add('lesson-compact','followup-hub');card.querySelector('.lesson-custom-head')?.remove();
  const weekInfo=academicWeekInfo(state.week),head=document.createElement('div');head.className='lesson-custom-head followup-head';
  head.innerHTML=`<div class="lesson-title"><div class="lesson-badge">LP</div><div><h3>Lesson Plan Follow-up Hub</h3><div class="week-line"><span>${esc(state.term)}</span><button class="week-arrow" onclick="changeFollowupWeek(-1)" aria-label="Previous week">‹</button><b>Week ${state.week}</b><button class="week-arrow" onclick="changeFollowupWeek(1)" aria-label="Next week">›</button><span>${weekInfo.label}</span></div><div class="followup-rules"><span>Target: <b>${LESSON_PLAN_TARGET} lesson plans</b></span><span>Deadline: <b>Monday 12:00 PM</b></span></div></div></div><div class="lesson-head-actions"><button class="btn all-plans-btn" onclick="openAllLessonPlans()">📚 View All Lesson Plans</button><button class="btn pdf-report-btn" onclick="openWeeklyReports()">📊 Live Follow-up Report</button></div>`;
  card.insertBefore(head,grid);
}

(function(){
  const corrected=normalizedTermWeek(state.term,state.week);if(corrected.term!==state.term||corrected.week!==state.week){state.term=corrected.term;state.week=corrected.week;localStorage.setItem(K,JSON.stringify(state));}
  const style=document.createElement('style');style.textContent=`
  .followup-hub .teacher-grid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important;margin-top:10px!important}
  .followup-hub .teacher-list-row{display:flex!important;justify-content:space-between!important;align-items:center!important;gap:10px!important;padding:9px 12px!important;min-height:36px!important;border-radius:10px!important}
  .followup-hub .teacher-list-row .name{font-size:13px!important;white-space:nowrap}.followup-head{display:flex!important;justify-content:space-between!important;align-items:center!important;gap:14px!important;padding-bottom:10px!important;border-bottom:1px solid #e2e7e5!important}
  .followup-head h3{margin-bottom:3px!important}.week-line{display:flex;align-items:center;gap:7px;color:#74868b;font-size:12px;flex-wrap:wrap}.week-line b{color:#4f646c}.week-arrow{width:25px;height:25px;border:1px solid #d8e1de;border-radius:8px;background:#eef3f1;color:#58736f;font-size:19px;line-height:20px;cursor:pointer;font-weight:800}.week-arrow:hover{background:#dde9e5}
  .followup-rules{display:flex;gap:7px;flex-wrap:wrap;margin-top:5px}.followup-rules span{font-size:10.5px;color:#61777c;background:#f1f5f3;border:1px solid #dfe7e4;border-radius:999px;padding:4px 8px}.lesson-head-actions{display:flex;align-items:center;justify-content:flex-end;gap:8px;flex-wrap:wrap}.pdf-report-btn{height:38px;padding:7px 14px!important;white-space:nowrap;background:#789b96!important;color:#fff!important;border-color:#789b96!important;font-weight:800!important}.all-plans-btn{height:38px;padding:7px 14px!important;white-space:nowrap;background:#d9ccb0!important;color:#5f584a!important;border-color:#d0c19e!important;font-weight:800!important}.upload-row{white-space:nowrap;padding:6px 10px!important;font-size:11.5px!important}
  @media(max-width:850px){.followup-hub .teacher-grid{grid-template-columns:1fr!important}.followup-head{align-items:flex-start!important;flex-direction:column}.lesson-head-actions{justify-content:flex-start}}
  `;document.head.appendChild(style);uploadPlan=openLessonPlanUpload;renderTeachers();buildLessonHeader();
})();