/* Safe shared master-state synchronization. Admin-only writes; local backup remains untouched. */
(function(){
  const MAIN_KEY='engDeptPortfolioV2';
  const BACKUP_KEY='engDeptPortfolioV2_before_shared_sync';
  let syncing=false, ready=false, originalSave=null, timer=null;

  function serverSafe(value){
    const copy=JSON.parse(JSON.stringify(value||{}));
    if(Array.isArray(copy.shares)){
      copy.shares=copy.shares.map(s=>{
        const x={...s};
        if(Array.isArray(x.files)) x.files=x.files.map(f=>({
          ...f,
          data:(typeof f.data==='string' && f.data.startsWith('data:'))?'':f.data
        }));
        if(typeof x.data==='string' && x.data.startsWith('data:')) x.data='';
        return x;
      });
    }
    return copy;
  }

  function hasMasterData(data){
    return !!(data && typeof data==='object' && Object.keys(data).length);
  }

  async function profile(){
    const client=parent.portfolioSupabase;
    const user=parent.PORTFOLIO_USER;
    if(!client||!user) return null;
    const {data,error}=await client.from('portfolio_profiles').select('role').eq('user_id',user.id).maybeSingle();
    if(error) throw error;
    return data;
  }

  async function pushMaster(){
    if(!ready||syncing) return;
    const client=parent.portfolioSupabase;
    if(!client) return;
    syncing=true;
    try{
      const payload=serverSafe(state);
      const {error}=await client.from('portfolio_state').update({data:payload,updated_at:new Date().toISOString()}).eq('id','main');
      if(error) console.error('Portfolio shared save failed:',error);
    }finally{syncing=false;}
  }

  function schedulePush(){
    clearTimeout(timer);
    timer=setTimeout(pushMaster,500);
  }

  async function start(){
    if(!parent.portfolioSupabase||!parent.PORTFOLIO_USER){setTimeout(start,500);return;}
    try{
      const p=await profile();
      if(!p||p.role!=='admin') return;
      const client=parent.portfolioSupabase;
      const {data:row,error}=await client.from('portfolio_state').select('data,updated_at').eq('id','main').single();
      if(error) throw error;

      if(!hasMasterData(row.data)){
        /* First activation: this verified browser becomes the master. */
        const existing=localStorage.getItem(MAIN_KEY);
        if(existing && !localStorage.getItem(BACKUP_KEY)) localStorage.setItem(BACKUP_KEY,existing);
        const payload=serverSafe(state);
        const {error:seedError}=await client.from('portfolio_state').update({data:payload,updated_at:new Date().toISOString()}).eq('id','main');
        if(seedError) throw seedError;
        console.log('Portfolio shared master created from protected local copy.');
      } else {
        /* Never overwrite this browser silently on first rollout. Keep local working copy until explicit merge phase. */
        console.log('Portfolio shared master already exists; local copy left unchanged.');
      }

      originalSave=save;
      save=function(){
        originalSave();
        schedulePush();
      };
      ready=true;
      console.log('Portfolio admin master synchronization active.');
    }catch(e){console.error('Portfolio master sync error:',e);}
  }
  start();
})();