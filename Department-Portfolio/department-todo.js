/* Compact Department To-Do — isolated Portfolio feature */
(()=>{
const KEY='engDeptPortfolioTodoV1';
const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch(e){return[]}};
const write=a=>{localStorage.setItem(KEY,JSON.stringify(a));renderTodoSummary()};
const esc=s=>String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const today=()=>new Date().toISOString().slice(0,10);
const comingSoon=x=>{if(!x.due||x.done)return false;const d=(new Date(x.due+'T00:00:00')-new Date(today()+'T00:00:00'))/86400000;return d>=0&&d<=2};
const urgent=x=>!x.done&&x.priority==='High';
function summary(){const a=read(),active=a.filter(x=>!x.done);return {active:active.length,urgent:active.filter(urgent).length,soon:active.filter(comingSoon).length}}
window.renderTodoSummary=()=>{const e=document.getElementById('todoSummary');if(!e)return;const s=summary();e.innerHTML=`<b>${s.active}</b>${s.urgent?`<span class="todo-urgent" title="Highly Urgent">${s.urgent}</span>`:''}${s.soon?`<span class="todo-soon" title="Coming Soon">${s.soon}</span>`:''}`};
window.openTodoAdd=()=>openModal(`<h2>📋 Add Department Task</h2><label>Task</label><input id="todoTitle" placeholder="Task title"><label>Assign to</label><input id="todoAssign" placeholder="All Department or teacher name"><label>Due date</label><input id="todoDue" type="date"><label>Priority</label><select id="todoPriority"><option>Normal</option><option>High</option><option>Low</option></select><div class="actions"><button class="btn primary" onclick="saveTodo()">Save</button><button class="btn" onclick="closeModal()">Cancel</button></div>`);
window.saveTodo=()=>{const title=todoTitle.value.trim();if(!title)return alert('Add a task title.');const a=read();a.unshift({id:Date.now(),title,assign:todoAssign.value.trim()||'All Department',due:todoDue.value,priority:todoPriority.value,done:false,created:new Date().toISOString()});write(a);closeModal()};
function taskRow(x){const status=x.done?'Completed':urgent(x)?'Highly Urgent':comingSoon(x)?'Coming Soon':'Upcoming';return `<div class="item"><div style="display:flex;justify-content:space-between;gap:12px;align-items:start"><div><b>${esc(x.title)}</b><small>${esc(x.assign)} · ${x.due?esc(x.due):'No due date'} · ${esc(x.priority)} · ${status}</small></div><div class="actions" style="margin:0"><button class="btn ${x.done?'':'primary'}" onclick="toggleTodo(${x.id})">${x.done?'Reopen':'Complete'}</button><button class="btn danger" onclick="deleteTodo(${x.id})">Delete</button></div></div></div>`}
window.openTodoList=()=>{const a=read();openModal(`<div class="folder-head"><div><h2>📋 Department To-Do</h2><small>Active and completed department tasks</small></div><button class="btn primary" onclick="openTodoAdd()">＋ Add Task</button></div><div class="list">${a.length?a.map(taskRow).join(''):'<div class="empty-state">No tasks added yet.</div>'}</div><div class="modal-footer"><button class="btn" onclick="closeModal()">Close</button></div>`)};
window.toggleTodo=id=>{const a=read(),x=a.find(v=>v.id===id);if(x)x.done=!x.done;write(a);openTodoList()};
window.deleteTodo=id=>{if(!confirm('Delete this task?'))return;write(read().filter(x=>x.id!==id));openTodoList()};
window.installDepartmentTodo=()=>{const old=document.getElementById('departmentTodoCard');if(old)old.remove();if(document.getElementById('departmentTodoNav')){renderTodoSummary();return}const nav=document.querySelector('.nav');if(!nav)return;const btn=document.createElement('button');btn.id='departmentTodoNav';btn.className='todo-nav-btn';btn.onclick=openTodoList;btn.innerHTML=`☑ To-Do <span id="todoSummary"></span>`;nav.appendChild(btn);renderTodoSummary()};
installDepartmentTodo();
})();