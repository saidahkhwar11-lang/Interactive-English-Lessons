/* Al Reyadah English Department Portfolio
   Secure Supabase Login + Data Protection
*/
window.PORTFOLIO_SHARED={url:"https://hobfifobduqslvnagwlb.supabase.co",key:"sb_publishable_fbK9aPfpg1rgqy32fPR59A_uxp-kygF"};
(function(){
const MAIN_KEY="engDeptPortfolioV2",BACKUP_KEY="engDeptPortfolioV2_before_shared_sync";
const SESSION_HINT="portfolioSignedInHint";
const PORTFOLIO_URL="https://saidahkhwar11-lang.github.io/Interactive-English-Lessons/Department-Portfolio/";
try{const existing=localStorage.getItem(MAIN_KEY);if(existing&&!localStorage.getItem(BACKUP_KEY))localStorage.setItem(BACKUP_KEY,existing)}catch(e){console.error(e)}
const sdk=document.createElement("script");sdk.src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";sdk.onload=startPortfolioAuth;sdk.onerror=()=>showLogin("School network could not reach the sign-in service. Please try again.");document.head.appendChild(sdk);

function hasSignedInHint(){try{return localStorage.getItem(SESSION_HINT)==="1"}catch(e){return false}}
function setSignedInHint(on){try{if(on)localStorage.setItem(SESSION_HINT,"1");else localStorage.removeItem(SESSION_HINT)}catch(e){}}
async function startPortfolioAuth(){
 const forcedSignOut=new URLSearchParams(window.location.search).get("signedout")==="1";
 if(forcedSignOut){setSignedInHint(false);window.__portfolioExplicitSignOut=true;}
 const client=window.supabase.createClient(window.PORTFOLIO_SHARED.url,window.PORTFOLIO_SHARED.key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storage:window.localStorage}});
 window.portfolioSupabase=client;
 try{const {data,error}=await client.auth.getSession();if(error)throw error;if(forcedSignOut){if(data&&data.session)await client.auth.signOut();window.PORTFOLIO_USER=null;showLogin();history.replaceState(null,"",PORTFOLIO_URL);return}if(data&&data.session)showSignedIn(data.session.user);else showLogin()}catch(e){console.warn("Initial session check delayed/failed",e);if(!hasSignedInHint())showLogin()}
 client.auth.onAuthStateChange((event,session)=>{
   if(session){showSignedIn(session.user);return}
   // Only a confirmed sign-out should put a signed-in user back on the login page.
   // Temporary refresh/network events on filtered school Wi-Fi must not eject the user.
   if(event==="SIGNED_OUT"&&window.__portfolioExplicitSignOut===true){setSignedInHint(false);window.PORTFOLIO_USER=null;showLogin()}
 });
}
function showLogin(message){
 if(document.getElementById("portfolioLogin")){if(message){const m=document.getElementById("portfolioAuthMessage");if(m)m.textContent=message}return}
 const overlay=document.createElement("div");overlay.id="portfolioLogin";overlay.innerHTML=`
 <div class="portfolio-login-card"><div class="portfolio-login-icon">📚</div><h1>English Department Portfolio</h1>
 <p class="portfolio-school">Al Reyadah School · English Department</p><p class="portfolio-help">Sign in with your registered department account.</p>
 <input id="portfolioEmail" type="email" placeholder="Email address" autocomplete="email">
 <input id="portfolioPassword" type="password" placeholder="Password" autocomplete="current-password">
 <button id="portfolioSignIn">Sign In</button><button id="portfolioCreateAccount" class="secondary">Create My Account</button>
 <div id="portfolioAuthMessage">${message||""}</div></div>`;document.body.appendChild(overlay);
 if(!document.getElementById("portfolioLoginStyle")){const style=document.createElement("style");style.id="portfolioLoginStyle";style.textContent=`
 #portfolioLogin{position:fixed;inset:0;z-index:999999;display:flex;align-items:center;justify-content:center;padding:24px;background:linear-gradient(135deg,#edf5f6,#f7f2e8);font-family:Segoe UI,Arial,sans-serif}
 .portfolio-login-card{width:min(430px,92vw);background:white;border:1px solid #e1e8eb;border-radius:24px;padding:34px;text-align:center;box-shadow:0 20px 60px rgba(50,80,95,.12)}
 .portfolio-login-icon{font-size:42px;margin-bottom:8px}.portfolio-login-card h1{margin:5px 0;color:#405f70;font-size:25px}.portfolio-school{color:#78909b;margin:5px 0 22px}.portfolio-help{color:#687e89;font-size:14px;margin-bottom:18px}
 .portfolio-login-card input{width:100%;box-sizing:border-box;margin:6px 0;padding:13px;border:1px solid #d8e2e6;border-radius:11px;font-size:15px}
 .portfolio-login-card button{width:100%;margin-top:10px;padding:12px;border:0;border-radius:11px;cursor:pointer;font-weight:700;background:#78aaa8;color:white}.portfolio-login-card button.secondary{background:#f4e4b5;color:#645b47}
 .portfolio-login-card button:disabled{opacity:.65;cursor:wait}#portfolioAuthMessage{margin-top:14px;min-height:20px;color:#657985;font-size:13px}`;document.head.appendChild(style)}
 document.getElementById("portfolioSignIn").onclick=signIn;document.getElementById("portfolioCreateAccount").onclick=createAccount;
}
async function signIn(){
 const email=document.getElementById("portfolioEmail").value.trim(),password=document.getElementById("portfolioPassword").value,msg=document.getElementById("portfolioAuthMessage"),btn=document.getElementById("portfolioSignIn");
 if(!email||!password){msg.textContent="Please enter your email and password.";return}
 msg.textContent="Signing in...";btn.disabled=true;
 let timer=setTimeout(()=>{if(document.getElementById("portfolioAuthMessage"))msg.textContent="The school network is taking longer than usual. Still trying…"},6000);
 try{
   const {data,error}=await window.portfolioSupabase.auth.signInWithPassword({email,password});if(error)throw error;
   if(data&&data.session){setSignedInHint(true);showSignedIn(data.user||data.session.user)}else msg.textContent="Sign-in was not completed. Please try again.";
 }catch(e){msg.textContent=e&&e.message?e.message:"Unable to sign in. Please try again."}
 finally{clearTimeout(timer);if(document.body.contains(btn))btn.disabled=false}
}
async function createAccount(){
 const email=document.getElementById("portfolioEmail").value.trim(),password=document.getElementById("portfolioPassword").value,msg=document.getElementById("portfolioAuthMessage");
 if(!email||!password){msg.textContent="Please enter your email and choose a password.";return}if(password.length<8){msg.textContent="Please choose a password with at least 8 characters.";return}
 msg.textContent="Creating your account...";
 const {error}=await window.portfolioSupabase.auth.signUp({email,password,options:{emailRedirectTo:PORTFOLIO_URL,data:{display_name:email.toLowerCase()==="saidah.khwar11@gmail.com"?"Saidah Khwar":email.split("@")[0]}}});
 msg.textContent=error?error.message:"Account created. Please check your email for the confirmation message, then return here and sign in.";
}
function showSignedIn(user){setSignedInHint(true);const overlay=document.getElementById("portfolioLogin");if(overlay)overlay.remove();window.PORTFOLIO_USER=user;console.log("English Department Portfolio signed in:",user&&user.email)}
})();