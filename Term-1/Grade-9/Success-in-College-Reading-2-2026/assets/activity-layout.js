(()=>{
const css=`
.canvas{display:flex!important;flex-direction:column;gap:14px}
.canvas>.media{min-height:auto!important;flex:0 0 auto}
.activity-content{background:#fff;border-radius:14px;padding:18px 20px 28px;flex:0 0 auto}
.activity-content .content-title{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 12px;padding-bottom:10px;border-bottom:1px solid #dbe3ed}
.activity-content .content-title h2{font:800 1.35rem Georgia;margin:0;color:#17233f}
.activity-content .content-title span{font-size:.75rem;font-weight:900;color:#ee6c4d}
.activity-content .q{font-size:1rem;padding:14px 16px;margin:10px 0;background:#fbfdff}
.activity-content .q b{font-size:1.05rem}
.activity-content .reveal{font-size:.9rem}
.activity-content .ans{font-size:.96rem;line-height:1.45}
.activity-content .deep{margin-top:14px}
.task .q,.task .deep,.task .restart{display:none!important}
.task .guide{position:sticky;top:0}
.exitMainBoard{display:none!important}
@media(max-width:1000px){.activity-content{padding:15px}.task .q,.task .deep,.task .restart{display:none!important}}
`;
const st=document.createElement('style');st.id='mainActivityLayoutStyle';st.textContent=css;document.head.appendChild(st);

function qCard(q,a){
 const d=document.createElement('div');d.className='q';
 d.innerHTML=`<b>${q}</b><br><button class="reveal" type="button">Reveal Answer</button><div class="ans">${a}</div>`;
 d.querySelector('.reveal').onclick=()=>{const ans=d.querySelector('.ans');ans.classList.toggle('show');d.querySelector('.reveal').textContent=ans.classList.contains('show')?'Hide Answer':'Reveal Answer'};
 return d;
}

const custom={
1:[
['1. Successful students are prepared ______.','for class'],
['2. Successful students follow an organized ______.','study routine'],
['3. Successful students know they must work ______.','hard to succeed'],
['4. Successful students have good ______.','study skills'],
['5. Successful students attend ______ and pay ______.','every class · close attention'],
['6. Successful students ask their tutors ______ when they need it.','for help']
]
};

document.querySelectorAll('.activity').forEach((act,i)=>{
 const canvas=act.querySelector('.canvas'), task=act.querySelector('.task');
 if(!canvas||!task)return;

 // Remove old broken textbook-image placeholders. Teacher Media remains above and reading/charter content stays.
 const media=canvas.querySelector('.media');
 if(media){
   media.querySelectorAll('img[data-b64]').forEach(img=>img.remove());
   if(!media.children.length) media.remove();
 }

 const oldPanel=canvas.querySelector('.activity-content');if(oldPanel)oldPanel.remove();
 const panel=document.createElement('section');panel.className='activity-content';
 panel.innerHTML=`<div class="content-title"><h2>${i===3?'Vocabulary Challenge':i===4?'Charter Connection Activity':'Activity Questions & Answers'}</h2><span>${act.querySelector('.identity>div:last-child')?.textContent||''}</span></div>`;

 if(custom[i]) custom[i].forEach(x=>panel.appendChild(qCard(x[0],x[1])));
 else {
   const originalQuestions=[...task.querySelectorAll('.q')];
   originalQuestions.forEach(q=>{
     const question=q.querySelector('b')?.textContent?.trim()||'';
     const answer=q.querySelector('.ans')?.innerHTML||'';
     if(question)panel.appendChild(qCard(question,answer));
   });
 }

 const deep=task.querySelector('.deep');
 if(deep){const c=deep.cloneNode(true);c.querySelectorAll('.reveal').forEach(btn=>btn.remove());panel.appendChild(c)}

 if(i===3){
   const r=document.createElement('button');r.className='restart';r.textContent='↻ Restart Game';
   r.onclick=()=>{panel.querySelectorAll('.ans').forEach(x=>x.classList.remove('show'));panel.querySelectorAll('.reveal').forEach(x=>x.textContent='Reveal Answer')};
   panel.appendChild(r)
 }
 canvas.appendChild(panel);
});
})();