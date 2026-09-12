(()=>{
const st=document.createElement('style');st.id='compactSavedMediaStyle';st.textContent=`
.teacherSavedDisplay{display:flex!important;flex-wrap:wrap;gap:10px!important;align-items:flex-start!important;justify-content:flex-start!important;width:max-content!important;max-width:100%!important;margin:0 0 10px!important;padding:0!important;background:transparent!important}
.teacherSavedDisplay .savedPic{position:relative!important;display:block!important;flex:0 0 168px!important;width:168px!important;max-width:168px!important;background:#fff!important;border:1px solid #dbe3ed!important;border-radius:14px!important;padding:6px!important;box-shadow:0 4px 14px #17233f14!important;overflow:hidden!important}
.teacherSavedDisplay .savedPic img{display:block!important;width:100%!important;height:102px!important;max-height:102px!important;object-fit:contain!important;border-radius:10px!important;cursor:zoom-in!important;background:#f8fafc!important}
.teacherSavedDisplay .quickMax{position:absolute!important;right:10px!important;bottom:10px!important;width:auto!important;margin:0!important;border:0!important;border-radius:999px!important;padding:6px 9px!important;background:#17233fe8!important;color:#fff!important;font-weight:900!important;cursor:pointer!important;font-size:.7rem!important;box-shadow:0 2px 8px #17233f33!important}
.teacherSavedDisplay .quickMax:hover{transform:translateY(-1px);background:#0f1b34!important}
@media(max-width:700px){.teacherSavedDisplay .savedPic{flex-basis:145px!important;width:145px!important;max-width:145px!important}.teacherSavedDisplay .savedPic img{height:88px!important;max-height:88px!important}}
`;
document.head.appendChild(st);
function enhance(){document.querySelectorAll('.teacherSavedDisplay .savedPic').forEach(card=>{const img=card.querySelector('img');if(!img)return;if(card.dataset.compactReady)return;card.dataset.compactReady='1';const b=document.createElement('button');b.type='button';b.className='quickMax';b.textContent='⛶';b.title='Maximize picture';b.setAttribute('aria-label','Maximize picture');b.onclick=e=>{e.stopPropagation();window.showZoom?.(img.src)};img.onclick=()=>window.showZoom?.(img.src);card.appendChild(b)})}
enhance();
new MutationObserver(enhance).observe(document.body,{childList:true,subtree:true});
})();