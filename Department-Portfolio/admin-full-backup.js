/* English Portfolio read-only administrator backup. No restore or database writes. */
(function(){
'use strict';
const PROJECT_TABLES=['portfolio_state','portfolio_profiles','portfolio_uploads','meeting_acknowledgements','department_todos','department_todo_completions','english_initiative_polls'];
const BUCKET='portfolio-files';
const SCRIPT_URL='https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const status=s=>{if($('portfolioBackupStatus'))$('portfolioBackupStatus').textContent=s};
const safePath=s=>String(s).split('/').map(x=>x.replace(/[^a-zA-Z0-9._-]/g,'_')).join('/');
function loadZip(){return new Promise((resolve,reject)=>{if(window.JSZip)return resolve(window.JSZip);const script=document.createElement('script');script.src=SCRIPT_URL;script.onload=()=>window.JSZip?resolve(window.JSZip):reject(Error('ZIP library unavailable'));script.onerror=()=>reject(Error('ZIP library failed to load'));document.head.appendChild(script)})}
async function fetchAll(client,table){
 const rows=[];let offset=0;
 while(true){
  const {data,error}=await client.from(table).select('*').range(offset,offset+499);
  if(error)throw Error(table+': '+error.message);
  rows.push(...(data||[]));if(!data||data.length<500)break;offset+=500;
  if(offset>100000)throw Error('Safety limit reached for '+table);
 }
 return rows;
}
async function listStorage(client,path=''){
 const {data,error}=await client.storage.from(BUCKET).list(path,{limit:1000,offset:0});
 if(error)throw Error('Storage listing failed at '+path+': '+error.message);
 const out=[];let offset=0;let page=data||[];
 while(true){
  for(const item of page){const full=path?path+'/'+item.name:item.name;if(item.id)out.push(full);else out.push(...await listStorage(client,full))}
  if(page.length<1000)break;offset+=1000;
  const r=await client.storage.from(BUCKET).list(path,{limit:1000,offset});
  if(r.error)throw Error('Storage listing failed at '+path+': '+r.error.message);page=r.data||[];
 }
 return out;
}
async function backup(){
 const button=$('portfolioBackupButton');if(button.disabled)return;
 const client=parent.portfolioSupabase,user=parent.PORTFOLIO_USER;
 if(!client||!user)return alert('Please sign in to the Portfolio first.');
 button.disabled=true;let errors=[];
 try{
  const {data:profile,error:roleError}=await client.from('portfolio_profiles').select('role').eq('user_id',user.id).single();
  if(roleError||profile?.role!=='admin')throw Error('Administrator permission required.');
  const JSZip=await loadZip(),zip=new JSZip(),records=zip.folder('database'),files=zip.folder('uploaded-files');
  const manifest={format:'al-reyadah-portfolio-backup-v1',created_at:new Date().toISOString(),tables:{},storage_bucket:BUCKET,files:[],errors:[]};
  for(const table of PROJECT_TABLES){
   status('Exporting '+table+'...');
   try{const rows=await fetchAll(client,table);records.file(table+'.json',JSON.stringify(rows,null,2));manifest.tables[table]=rows.length}
   catch(e){errors.push(e.message)}
  }
  status('Finding uploaded files...');
  let paths=[];
  try{paths=await listStorage(client)}catch(e){errors.push(e.message)}
  // Also include every referenced path, including files missed by a storage listing.
  const uploads=records.file('portfolio_uploads.json');
  if(uploads){const rows=JSON.parse(await uploads.async('string'));paths.push(...rows.map(r=>r.storage_path).filter(Boolean))}
  paths=[...new Set(paths)].sort();
  for(let i=0;i<paths.length;i++){
   const path=paths[i];status('Downloading files '+(i+1)+' / '+paths.length);
   try{const {data,error}=await client.storage.from(BUCKET).download(path);if(error||!data)throw Error(error?.message||'No file returned');
    const buffer=await data.arrayBuffer();
    // JSZip 3.x reliably accepts Uint8Array; passing an ArrayBuffer from
    // another browser realm can fail only when generateAsync() is called.
    const bytes=new Uint8Array(buffer);
    if(bytes.byteLength!==data.size)throw Error('Downloaded file size mismatch');
    files.file(safePath(path),bytes,{binary:true});
    manifest.files.push({storage_path:path,backup_path:'uploaded-files/'+safePath(path),bytes:bytes.byteLength});
   }catch(e){errors.push(path+': '+e.message)}
  }
  manifest.errors=errors;manifest.complete=errors.length===0;
  zip.file('manifest.json',JSON.stringify(manifest,null,2));
  status('Creating ZIP archive...');
  const blob=await zip.generateAsync({type:'blob',compression:'DEFLATE',compressionOptions:{level:3}});
  const stamp=new Date().toISOString().replace(/[:.]/g,'-');
  const name='English-Portfolio-'+(errors.length?'INCOMPLETE-':'FULL-')+'Backup-'+stamp+'.zip';
  const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=name;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(link.href),60000);
  status(errors.length?'INCOMPLETE backup downloaded — '+errors.length+' error(s). Check manifest.json.':'Backup downloaded: '+manifest.files.length+' files, '+Object.keys(manifest.tables).length+' data tables.');
  if(errors.length)alert('Warning: Backup incomplete. '+errors.length+' item(s) could not be exported. See manifest.json inside the ZIP.');
 }catch(e){status('Backup failed: '+e.message);alert('Backup failed: '+e.message)}
 finally{button.disabled=false}
}
async function init(){
 const client=parent.portfolioSupabase,user=parent.PORTFOLIO_USER;if(!client||!user)return setTimeout(init,500);
 const {data,error}=await client.from('portfolio_profiles').select('role').eq('user_id',user.id).maybeSingle();
 if(error||data?.role!=='admin')return;
 const card=document.createElement('article');card.className='card support-card';card.id='portfolioBackupCard';
 card.innerHTML='<div class="card-intro"><h3>🔐 Full Portfolio Backup</h3><p>Administrator only · All teachers, records and uploaded files</p></div><div class="actions"><button class="btn primary" id="portfolioBackupButton">⬇ Download Full Backup</button></div><p id="portfolioBackupStatus" role="status" style="padding:0 18px 14px;font-size:12px;color:#526775">Read-only backup. No live records will be changed.</p>';
 const grid=document.querySelector('.systemgrid');if(grid)grid.appendChild(card);else document.body.appendChild(card);
 $('portfolioBackupButton').addEventListener('click',backup);
}
init();
})();