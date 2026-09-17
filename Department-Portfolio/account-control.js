(function(){
  async function renderAccount(){
    if(!parent||!parent.portfolioSupabase||!parent.PORTFOLIO_USER)return;
    const old=document.getElementById('portfolio-account-control');if(old)old.remove();
    const user=parent.PORTFOLIO_USER,client=parent.portfolioSupabase;
    let name=(user.user_metadata&&user.user_metadata.display_name)||user.email||'User',role='Teacher';
    try{
      const {data}=await client.from('portfolio_profiles').select('display_name,role').eq('user_id',user.id).maybeSingle();
      if(data){if(data.display_name)name=data.display_name;role=data.role==='admin'?'Coordinator / Admin':'Teacher';}
    }catch(e){console.warn('Account profile display:',e);}
    const box=document.createElement('div');box.id='portfolio-account-control';
    box.style.cssText='position:fixed;right:18px;top:14px;z-index:99999;background:#fff;border:1px solid #dfe4e3;border-radius:12px;padding:9px 12px;box-shadow:0 5px 18px rgba(70,86,91,.12);font:13px Segoe UI,Arial;color:#405761;display:flex;align-items:center;gap:10px';
    const info=document.createElement('span');
    const strong=document.createElement('strong');strong.textContent='👤 Signed in as: '+name;
    const small=document.createElement('small');small.textContent='Role: '+role;
    info.append(strong,document.createElement('br'),small);
    const btn=document.createElement('button');btn.textContent='Sign Out';
    btn.style.cssText='border:1px solid #d7dfdd;background:#f3f6f5;color:#536971;border-radius:8px;padding:7px 10px;cursor:pointer;font-weight:700';
    btn.onclick=async function(){btn.disabled=true;btn.textContent='Signing out...';const result=await client.auth.signOut();if(result.error){btn.disabled=false;btn.textContent='Sign Out';alert('Could not sign out. Please try again.');return;}parent.location.reload();};
    box.append(info,btn);document.body.appendChild(box);
  }
  renderAccount();setTimeout(renderAccount,1200);
})();