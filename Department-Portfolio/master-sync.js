/* Shared Portfolio state: admin writes the master; teachers load the master read-only. */
(function(){
  const MAIN_KEY='engDeptPortfolioV2';
  const BACKUP_KEY='engDeptPortfolioV2_before_shared_sync';
  let syncing=false, ready=false, originalSave=null, timer=null;

  function serverSafe(value){
    const copy=JSON.parse(JSON.stringify(value||{}));
    if(Array.isArray(copy.shares)){
      copy.shares=copy.shares.map(s=>{
        const x={...s};
        if(Array.isArray(x.files)) x.files=x.files.map(f=>({...f,data:(typeof f.data==='string'&&f.data.startsWith('data:'))?'':f.data}));
        if(typeof x.data==='string'&&x.data.startsWith('data:')) x.data='';
        return x;
      });
    }
    return copy;
  }
  function hasMasterData(data){return !!(data&&typeof data==='object'&&Object.keys(data).length);}
  async function profile(){
    const client=parent.portfolioSupabase,user=parent.PORTFOLIO_USER;
    if(!client||!user)return null;
    const {data,error}=await client.from('portfolio_profiles').select('role,display_name').eq('user_id',user.id).maybeSingle();
    if(error)throw error; return data;
  }
  async function pushMaster(){
    if(!ready||syncing)return;
    const client=parent.portfolioSupabase;if(!client)return;
    syncing=true;
    try{const {error}=await client.from('portfolio_state').update({data:serverSafe(state),updated_at:new Date().toISOString()}).eq('id','main');if(error)console.error('Portfolio shared save failed:',error);}finally{syncing=false;}
  }
  function schedulePush(){clearTimeout(timer);timer=setTimeout(pushMaster,500);}
  function loadTeacherMaster(master){
    /* Teacher receives coordinator's shared structure without gaining write access. */
    state=JSON.parse(JSON.stringify(master));
    localStorage.setItem(MAIN_KEY,JSON.stringify(state));
    renderAll();
    document.documentElement.setAttribute('data-portfolio-role','teacher');
    const style=document.createElement('style');
    style.id='teacher-readonly-guard';
    style.textContent=`button[onclick*="addTeacher"],button[onclick*="deleteTeacher"],button[onclick*="removeTeacher"],button[onclick*="setWeek"],button[onclick*="addEvent"],button[onclick*="addMeeting"]{display:none!important}`;
    document.head.appendChild(style);
  }
  async function start(){
    if(!parent.portfolioSupabase||!parent.PORTFOLIO_USER){setTimeout(start,500);return;}
    try{
      const p=await profile();if(!p)return;
      const client=parent.portfolioSupabase;
      const {data:row,error}=await client.from('portfolio_state').select('data,updated_at').eq('id','main').single();if(error)throw error;
      if(p.role==='teacher'){
        if(hasMasterData(row.data)){loadTeacherMaster(row.data);console.log('Teacher Portfolio loaded from shared coordinator master.');}
        return;
      }
      if(p.role!=='admin')return;
      if(!hasMasterData(row.data)){
        const existing=localStorage.getItem(MAIN_KEY);if(existing&&!localStorage.getItem(BACKUP_KEY))localStorage.setItem(BACKUP_KEY,existing);
        const {error:seedError}=await client.from('portfolio_state').update({data:serverSafe(state),updated_at:new Date().toISOString()}).eq('id','main');if(seedError)throw seedError;
      }
      originalSave=save;
      save=function(){originalSave();schedulePush();};
      ready=true;console.log('Portfolio admin master synchronization active.');
    }catch(e){console.error('Portfolio shared sync error:',e);}
  }
  start();
})();