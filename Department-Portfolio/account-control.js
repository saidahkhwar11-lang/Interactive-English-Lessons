(function(){
  function renderAccount(){
    if(!parent || !parent.portfolioSupabase || !parent.PORTFOLIO_USER) return;
    if(document.getElementById('portfolio-account-control')) return;
    const box=document.createElement('div');
    box.id='portfolio-account-control';
    box.style.cssText='position:fixed;right:18px;bottom:18px;z-index:99999;background:#fff;border:1px solid #dfe4e3;border-radius:12px;padding:9px 12px;box-shadow:0 5px 18px rgba(70,86,91,.12);font:13px Segoe UI,Arial;color:#405761;display:flex;align-items:center;gap:10px';
    const info=document.createElement('span');
    info.innerHTML='<strong>Saidah Khwar</strong><br><small>Admin</small>';
    const btn=document.createElement('button');
    btn.textContent='Sign Out';
    btn.style.cssText='border:1px solid #d7dfdd;background:#f3f6f5;color:#536971;border-radius:8px;padding:7px 10px;cursor:pointer;font-weight:700';
    btn.onclick=async function(){
      btn.disabled=true; btn.textContent='Signing out...';
      const result=await parent.portfolioSupabase.auth.signOut();
      if(result.error){btn.disabled=false;btn.textContent='Sign Out';alert('Could not sign out. Please try again.');return;}
      parent.location.reload();
    };
    box.append(info,btn);document.body.appendChild(box);
  }
  renderAccount();
  setTimeout(renderAccount,1200);
})();