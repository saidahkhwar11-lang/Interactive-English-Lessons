const $=id=>document.getElementById(id);
const command=$('commandFile'),materials=$('materials'),create=$('createBtn'),status=$('status');
function toast(s){$('toast').textContent=s;$('toast').classList.add('show');setTimeout(()=>$('toast').classList.remove('show'),1800)}
function names(files){const a=[...files];if(!a.length)return 'Choose all pictures / audio';if(a.length<=3)return a.map(f=>f.name).join(' · ');return `${a.length} files selected`}
command.addEventListener('change',()=>{$('commandName').textContent=command.files[0]?.name||'Choose command file';check()});
materials.addEventListener('change',()=>{$('materialsName').textContent=names(materials.files);check()});
function check(){status.className='status';if(command.files.length&&materials.files.length){status.textContent=`Ready — ${materials.files.length} lesson material${materials.files.length===1?'':'s'} selected.`;status.classList.add('ready')}else status.textContent=''}
async function createLesson(){
 if(!command.files.length){status.textContent='Please upload the lesson command first.';status.className='status error';return}
 if(!materials.files.length){status.textContent='Please upload the lesson pictures / materials.';status.className='status error';return}
 const endpoint=window.LESSON_CREATOR_API||'';
 if(!endpoint){status.textContent='The upload page is ready. Connect the secure AI generator to activate automatic lesson creation.';status.className='status error';toast('AI connection required');return}
 create.disabled=true;create.textContent='Creating lesson…';status.textContent='Analysing command and lesson materials…';status.className='status';
 try{const form=new FormData();form.append('command',command.files[0]);[...materials.files].forEach(f=>form.append('materials',f));form.append('teacher',$('teacher').value.trim()||'Saidah Khwar');const r=await fetch(endpoint,{method:'POST',body:form});if(!r.ok)throw new Error(await r.text()||`Request failed (${r.status})`);const data=await r.json();$('afterPanel').hidden=false;status.textContent='Lesson created successfully.';status.className='status ready';const buttons=[...$('afterPanel').querySelectorAll('button')],links=[data.lesson_url,data.plan_url,data.edit_url,data.save_url,data.backup_url];buttons.forEach((b,i)=>{if(links[i]){b.disabled=false;b.onclick=()=>window.open(links[i],i===3?'_self':'_blank')}});$('afterPanel').scrollIntoView({behavior:'smooth',block:'center'})}catch(e){status.textContent='Could not create the lesson: '+e.message;status.className='status error'}finally{create.disabled=false;create.textContent='✨ CREATE MY LESSON'}
}
create.addEventListener('click',createLesson);check();