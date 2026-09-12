(()=>{
const st=document.createElement('style');st.id='compactSavedMediaStyle';st.textContent=`
.teacherSavedDisplay{display:flex!important;flex-wrap:wrap;gap:10px!important;align-items:flex-start;margin:0 0 10px!important}
.teacherSavedDisplay .savedPic{width:190px!important;max-width:100%;background:#fff;border:1px solid #dbe3ed;border-radius:12px;padding:7px!important;box-shadow:0 3px 10px #17233f12}
.teacherSavedDisplay .savedPic img{display:block;width:100%!important;height:120px!important;max-height:120px!important;object-fit:contain!important;border-radius:8px;cursor:zoom-in;background:#fff}
.teacherSavedDisplay .quickMax{width:100%;margin-top:6px;border:0;border-radius:8px;padding:7px 9px;background:#17233f;color:#fff;font-weight:900;cursor:pointer;font-size:.76rem}
@media(max-width:700px){.teacherSavedDisplay .savedPic{width:150px!important}.teacherSavedDisplay .savedPic img{height:95px!important;max-height:95px!important}}
`;
document.head.appendChild(st);
function enhance(){document.querySelectorAll('.teacherSavedDisplay .savedPic').forEach(card=>{if(card.dataset.compactReady)return;card.dataset.compactReady='1';const img=card.querySelector('img');if(!img)return;const b=document.createElement('button');b.type='button';b.className='quickMax';b.textContent='⛶ Maximize';b.onclick=()=>window.showZoom?.(img.src);card.appendChild(b)})}
enhance();
const obs=new MutationObserver(enhance);obs.observe(document.body,{childList:true,subtree:true});
})();