(function(){
"use strict";
const URL="https://hobfifobduqslvnagwlb.supabase.co";
const KEY="sb_publishable_fbK9aPfpg1rgqy32fPR59A_uxp-kygF";
const ROOT="Grade9-Revision";
const state={student:null,controls:{},ready:false,teacherPreview:false};
const gate=window.Grade9Gate={
 isOpen:(category,i)=>state.ready&&(state.teacherPreview||state.controls[category+"-"+(i+1)]===true),
 student:()=>state.student,
 refresh:refresh,
 start:start,
 notify:()=>alert("This lesson is locked. Please wait for your teacher to open it.")
};
function overlay(){
 const style=document.createElement("style");
 style.textContent="#g9veil{position:fixed;inset:0;z-index:2147483000;background:linear-gradient(130deg,#302764,#735cd5);display:grid;place-items:center;font:17px Arial,sans-serif;color:#25314d}#g9veil .g9card{width:min(450px,92vw);background:white;border-radius:23px;padding:34px;box-shadow:0 20px 65px #181c3c66}#g9veil h2{font-size:29px;margin:0 0 12px}#g9veil input{width:100%;border:1px solid #ccd4e7;border-radius:12px;padding:15px;font:20px Arial;margin:12px 0}#g9veil button{width:100%;padding:14px;border:0;border-radius:12px;background:#6752ca;color:white;font-size:17px;font-weight:bold;cursor:pointer}#g9veil p{font-size:15px;line-height:1.5;color:#69758e}#g9status{color:#a33e49!important}#g9profile{position:fixed;bottom:12px;left:12px;z-index:100;background:#fff;border:1px solid #d9e0ef;border-radius:12px;padding:8px 13px;font:13px Arial;color:#485675;box-shadow:0 3px 12px #0001}";
 document.head.appendChild(style);
 const div=document.createElement("div");div.id="g9veil";div.innerHTML='<div class="g9card"><h2>Grade 9 Revision</h2><p>Enter your Student ID. Your name and class will be found automatically from the Assessment Tracker.</p><form id="g9form"><input id="g9id" inputmode="numeric" autocomplete="off" placeholder="Student ID" required><button type="submit" id="g9submit">Enter Revision</button></form><p id="g9status" role="alert"></p><p>For Grade 9/4 and 9/5 only. Lessons open when your teacher allows access.</p></div>';
 document.body.appendChild(div);
 div.querySelector("#g9form").addEventListener("submit",async e=>{e.preventDefault();await login(div.querySelector("#g9id").value)});
}
async function login(id){
 const status=document.querySelector("#g9status"),button=document.querySelector("#g9submit");
 button.disabled=true;status.textContent="Checking student ID…";
 try{
  const r=await fetch(URL+"/functions/v1/grade9-student-lookup",{method:"POST",headers:{"content-type":"application/json","apikey":KEY},body:JSON.stringify({student_id:id.trim()})});
  const data=await r.json();if(!r.ok)throw new Error(data.error||"Unable to verify ID.");
  state.student=data;localStorage.setItem("g9-revision-student-id",data.student_id);
  await refresh();state.ready=true;
  document.querySelector("#g9veil")?.remove();
  const old=document.querySelector("#g9profile");if(old)old.remove();
  const profile=document.createElement("div");profile.id="g9profile";profile.textContent=data.full_name+" · "+data.section;document.body.appendChild(profile);
  document.dispatchEvent(new CustomEvent("grade9-ready",{detail:data}));
 }catch(e){status.textContent=e.message||"Unable to connect. Please try again."}finally{button.disabled=false}
}
async function refresh(){
 try{
  const r=await fetch(URL+"/rest/v1/grade9_revision_lesson_controls?select=lesson_key,is_open",{headers:{"apikey":KEY,"Authorization":"Bearer "+KEY},cache:"no-store"});
  if(!r.ok)throw new Error("Unable to load teacher controls.");
  const data=await r.json();state.controls=Object.fromEntries(data.map(x=>[x.lesson_key,x.is_open]));
  document.dispatchEvent(new Event("grade9-controls-updated"));
 }catch(e){state.controls={};if(state.ready)console.warn("Lesson controls unavailable; lessons stay locked.",e)}
}
async function teacherPreview(){
 if(new URLSearchParams(location.search).get('teacher_preview')!=='1')return false;
 try{
  const stored=JSON.parse(localStorage.getItem('sb-hobfifobduqslvnagwlb-auth-token')||'null');
  if(!stored?.access_token)return false;
  const r=await fetch(URL+'/auth/v1/user',{headers:{apikey:KEY,Authorization:'Bearer '+stored.access_token},cache:'no-store'});
  if(!r.ok)return false;
  const user=await r.json();
  if(user.email!=='saidah.khwar11@gmail.com')return false;
  state.teacherPreview=true;state.ready=true;
  await refresh();
  document.dispatchEvent(new Event('grade9-teacher-preview'));
  return true;
 }catch(e){return false}
}
async function start(){
 if(await teacherPreview())return;
 overlay();
 const saved=localStorage.getItem("g9-revision-student-id");
 if(saved){document.querySelector("#g9id").value=saved;await login(saved)}
 setInterval(()=>{if(state.ready)refresh()},30000);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start);else start();
})();