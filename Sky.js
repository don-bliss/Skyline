/* SkyLine application helpers */
(() => {
  "use strict";
  const apply = theme => {
    const isDark = theme === "dark";
    document.body.classList.toggle("dark-mode", isDark);
    const toggle = document.getElementById("themeToggle");
    if(toggle) toggle.textContent = isDark ? "☀" : "◐";
    document.querySelectorAll(".theme-switch").forEach(sw=>{
      sw.classList.toggle("on", isDark);
      sw.setAttribute("aria-checked", String(isDark));
    });
  };
  window.skylineSetTheme = theme => { apply(theme === "light" ? "light" : "dark"); localStorage.setItem("skylineTheme", theme === "light" ? "light" : "dark"); };
  apply(localStorage.getItem("skylineTheme") || "dark");
  document.addEventListener("click", e=>{
    const toggle=e.target.closest("#themeToggle");
    if(!toggle) return;
    const next=document.body.classList.contains("dark-mode")?"light":"dark";
    window.skylineSetTheme(next);
  });

  document.querySelectorAll(".toggle-password").forEach(t=>t.addEventListener("click",()=>{const i=document.getElementById(t.dataset.target);if(!i)return;i.type=i.type==='password'?'text':'password';t.textContent=i.type==='password'?'Show':'Hide';}));

  const userBox = document.querySelectorAll("[data-user-name]");
  const avatarBox = document.querySelectorAll("[data-user-avatar]");
  window.skylineRenderUser = async () => {
    const u = await window.skylineGetSession?.() || (()=>{try{return JSON.parse(localStorage.getItem('skylineUser')||'null')}catch{return null}})(); if(!u)return;
    userBox.forEach(el=>el.textContent=u.name || 'SkyLine User');
    avatarBox.forEach(el=>{if(u.avatar){el.src=u.avatar;el.style.display='block';} });
    document.querySelectorAll('[data-user-account]').forEach(el=>el.textContent=u.accountNumber||'');
    document.querySelectorAll('[data-user-username]').forEach(el=>el.textContent='@'+String(u.username||u.accountNumber||'SkyLineUser').replace(/^@/,''));
    document.querySelectorAll('[data-user-email]').forEach(el=>el.textContent=u.email||'');
    document.querySelectorAll('[data-user-balance]').forEach(el=>el.textContent='₦'+Number(u.balance||0).toLocaleString('en-NG',{minimumFractionDigits:2,maximumFractionDigits:2}));
  };
  document.addEventListener('DOMContentLoaded',()=>window.skylineRenderUser?.());

  const signup = document.getElementById("signupForm");
  if(signup){
    const account = document.getElementById("accountNumber");
    let generated = ''; const gen=()=>{let n='';for(let i=0;i<10;i++)n+=Math.floor(Math.random()*10);return n;}; generated=gen(); if(account)account.textContent=generated;
    const photo=document.getElementById('profilePhoto'), preview=document.getElementById('profilePreview'), icon=document.getElementById('profileIcon');
    photo?.addEventListener('change',()=>{const f=photo.files?.[0];if(!f)return;const r=new FileReader();r.onload=e=>{preview.src=e.target.result;preview.style.display='block';if(icon)icon.style.display='none';};r.readAsDataURL(f);});
    const pass=document.getElementById('signupPassword'), confirm=document.getElementById('confirmPassword'), strength=document.getElementById('passwordStrength'), bar=document.getElementById('strengthBar'), match=document.getElementById('passwordMatch');
    const rules=[['lengthRule',v=>v.length>=8],['uppercaseRule',v=>/[A-Z]/.test(v)],['lowercaseRule',v=>/[a-z]/.test(v)],['numberRule',v=>/[0-9]/.test(v)],['specialRule',v=>/[^A-Za-z0-9]/.test(v)]];
    const check=()=>{const v=pass?.value||'';let score=0;rules.forEach(([id,test])=>{const ok=test(v);score+=ok?1:0;document.getElementById(id)?.classList.toggle('valid',ok);});if(bar)bar.style.width=v?(score<=2?'30%':score<=4?'65%':'100%'):'0';if(strength)strength.textContent=v?`Password strength: ${score<=2?'Weak':score<=4?'Medium':'Strong'}`:'Password strength: —';if(match&&confirm){match.textContent=!confirm.value?'':pass.value===confirm.value?'✓ Passwords match':'✕ Passwords do not match';}};
    pass?.addEventListener('input',check);confirm?.addEventListener('input',check);
    signup.addEventListener('submit',async e=>{e.preventDefault();const name=document.getElementById('fullName').value.trim(),email=document.getElementById('email').value.trim(),phone=document.getElementById('phone').value.trim(),password=pass.value,terms=document.getElementById('terms').checked;if(!name||!email||!phone||password.length<8||!terms||password!==confirm.value){alert('Please complete the form and make sure your password meets all requirements.');return;}const btn=document.getElementById('createAccountBtn');btn.disabled=true;btn.textContent='Creating account...';let avatar='';if(photo?.files?.[0]){avatar=await new Promise(res=>{const r=new FileReader();r.onload=e=>res(e.target.result);r.readAsDataURL(photo.files[0]);});}try{if(window.skylineAuthReady) await window.skylineAuthReady; if(typeof window.skylineSignUp!=='function') throw new Error('SkyLine authentication is unavailable. Please refresh the page and try again.'); const result=await window.skylineSignUp({name,email,phone,password,avatar});const code=String(Math.floor(100000+Math.random()*900000));const verification={email:email.trim().toLowerCase(),code,createdAt:Date.now(),expiresAt:Date.now()+10*60*1000,verified:false};sessionStorage.setItem('skylinePendingVerification',JSON.stringify(verification));document.getElementById('createdAccountNumber').textContent=result.user.accountNumber||generated;document.getElementById('verificationEmail').textContent=email;const demo=document.getElementById('demoVerificationCode');if(demo){demo.textContent=window.SKYLINE_CLOUD?.enabled?'A verification code has been requested for delivery to your email.':'Local test mode code: '+code;demo.hidden=false;}document.getElementById('successOverlay')?.classList.add('show');setTimeout(()=>location.href='verify-email.html',1400);}catch(err){console.error('SkyLine signup error:',err);alert(err?.message||'Unable to create your account. Please refresh the page and try again.');btn.disabled=false;btn.textContent='Create Account';}});
  }

  const login=document.getElementById('loginForm');
  if(login){
    const email=document.getElementById('loginEmail'), password=document.getElementById('loginPassword'), remember=document.getElementById('rememberLogin');
    const remembered=localStorage.getItem('skylineRememberedEmail');if(remembered){email.value=remembered;remember.checked=true;}
    login.addEventListener('submit',async e=>{e.preventDefault();const em=email.value.trim(),pw=password.value;if(!em||!pw)return;const btn=document.getElementById('loginBtn'),txt=document.getElementById('loginBtnText');btn.disabled=true;txt.textContent='Signing in...';try{const u=await window.skylineSignIn(em,pw);if(remember.checked)localStorage.setItem('skylineRememberedEmail',em);else localStorage.removeItem('skylineRememberedEmail');localStorage.setItem('skylineUser',JSON.stringify(u));document.getElementById('loginSuccess')?.classList.add('show');const next=new URLSearchParams(location.search).get('next');setTimeout(()=>location.replace(next&&/^(home|timeline|profile|inbox|wallet|settings|notifications)\.html$/.test(next)?`${next}?v=20260829-v15`:'timeline.html?v=20260829-v15'),900);}catch(err){alert(err.message||'Unable to sign in.');btn.disabled=false;txt.textContent='Login';}});
    document.getElementById('forgotPassword')?.addEventListener('click',e=>{e.preventDefault();document.getElementById('forgotModal')?.classList.add('show');});
    document.getElementById('closeForgot')?.addEventListener('click',()=>document.getElementById('forgotModal')?.classList.remove('show'));
    document.getElementById('resetBtn')?.addEventListener('click',async()=>{const em=document.getElementById('resetEmail').value.trim();if(!em)return;if(window.skylineAuth?.cloud){const {error}=await window.skylineAuth.client.auth.resetPasswordForEmail(em,{redirectTo:location.origin+location.pathname.replace('login.html','reset-password.html')});if(error){alert(error.message);return;}}alert('If an account exists for that email, a password reset email has been requested.');document.getElementById('forgotModal')?.classList.remove('show');});
  }
})();
