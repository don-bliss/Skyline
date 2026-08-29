/* SkyLine social sections v18: compact feed + working like/comment/share */
(() => {
  'use strict';
  const root = document.getElementById('sectionFeed');
  if (!root) return;
  const tabs = [...document.querySelectorAll('[data-section]')];
  const payModal = document.getElementById('marketPayModal');
  const payName = document.getElementById('marketPayName');
  const payAmount = document.getElementById('marketPayAmount');
  const payForm = document.getElementById('marketPayForm');
  const closePay = document.getElementById('closeMarketPay');
  const postForm = document.getElementById('sectionPostForm');
  const postText = document.getElementById('sectionPostText');
  const feedLabel = document.getElementById('sectionFeedLabel');
  const mediaInput = document.getElementById('composerMediaInput');
  const mediaButton = document.getElementById('composerMedia');
  const gifButton = document.getElementById('composerGif');
  const locationButton = document.getElementById('composerLocation');
  let composerMedia = null;
  const DATA_KEY = 'skylineSectionPosts';
  const INTERACTION_KEY = 'skylinePostInteractions';
  const uid = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const data = {
    trends: [
      {id:'trend-1',name:'Olusina Stephen',username:'@olusina',text:'Omo you not fit chop this life at once ooo',time:'5m',likes:47000,comments:1200},
      {id:'trend-2',name:'SkyLine Community',username:'@skyline',text:'What is trending in your city today? Share the moment with the community.',time:'18m',likes:22000,comments:806},
      {id:'trend-3',name:'Amina Bello',username:'@aminabello',text:'Small wins still count. Keep moving.',time:'31m',likes:12000,comments:402}
    ],
    mutuals: [
      {id:'mutual-1',name:'Michael James',username:'@michaeljames',text:'New week, new goals. Who is building something exciting?',time:'12m',likes:824,comments:63},
      {id:'mutual-2',name:'Sarah Johnson',username:'@sarahjohnson',text:'Just discovered a great new place. The view was amazing.',time:'42m',likes:1100,comments:88},
      {id:'mutual-3',name:'Daniel Okafor',username:'@danielokafor',text:'Consistency beats intensity.',time:'1h',likes:640,comments:41}
    ],
    explore: [
      {id:'explore-1',name:'SkyLine World Desk',username:'@worlddesk',text:'WORLD: Major developments are unfolding across markets, technology and travel. Follow verified updates here.',time:'Now',likes:18000,comments:932},
      {id:'explore-2',name:'SkyLine Business',username:'@skylinebusiness',text:'BUSINESS: Global businesses are watching currency, commodities and technology markets closely today.',time:'22m',likes:9400,comments:401},
      {id:'explore-3',name:'SkyLine Tech',username:'@skylinetech',text:'TECH: New products and AI developments are driving today’s technology conversation.',time:'45m',likes:7800,comments:305}
    ],
    marketplace: [
      {id:'market-1',name:'Chidi Stores',username:'@chidistores',text:'Premium sneakers — new stock available. Delivery available nationwide.',time:'9m',likes:321,comments:29,price:'₦85,000'},
      {id:'market-2',name:'Ada Fashion',username:'@adafashion',text:'Original leather travel bag. Limited pieces available.',time:'26m',likes:210,comments:18,price:'₦65,000'},
      {id:'market-3',name:'Tech Hub',username:'@techhub',text:'Refurbished laptop, 16GB RAM, 512GB SSD. Tested and ready.',time:'1h',likes:540,comments:74,price:'₦620,000'}
    ]
  };
  try {
    const saved = JSON.parse(localStorage.getItem(DATA_KEY) || '{}');
    Object.keys(data).forEach(k => { if (Array.isArray(saved[k])) data[k] = [...saved[k], ...data[k]]; });
  } catch (_) {}
  let interactions = {};
  try { interactions = JSON.parse(localStorage.getItem(INTERACTION_KEY) || '{}'); } catch (_) {}
  let active = 'trends', query = '';
  const esc = s => String(s ?? '').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const formatCount = n => { n=Number(n)||0; return n>=1000000?(n/1000000).toFixed(n%1000000?'1':'0')+'M':n>=1000?(n/1000).toFixed(n%1000?'1':'0')+'K':String(n); };
  const currentUser = async () => window.skylineGetSession?.() || (()=>{try{return JSON.parse(localStorage.getItem('skylineUser')||'null')}catch{return null}})() || {name:'SkyLine User',username:'SkyLineUser'};
  const avatarFor = (p,u) => { const uname=String(p.username||'').replace(/^@/,'').toLowerCase(), cur=String(u?.username||u?.accountNumber||'').replace(/^@/,'').toLowerCase(); return (p.mine || (cur && uname===cur) || (u?.name && p.name===u.name)) && u?.avatar ? u.avatar : (p.avatar || 'assets/default-avatar.svg'); };
  const getState = p => interactions[p.id] || {liked:false,likes:Number(p.likes)||0,commentCount:Number(p.comments)||0,comments:Array.isArray(p.commentItems)?p.commentItems:[]};
  const saveInteractions = () => localStorage.setItem(INTERACTION_KEY, JSON.stringify(interactions));

  async function render() {
    const u = await currentUser();
    const items = data[active].filter(p => !query || `${p.name} ${p.username} ${p.text}`.toLowerCase().includes(query));
    const labels={trends:'Trending posts',mutuals:'Posts from your mutuals',explore:'World news and updates',marketplace:'Items available to trade'};
    if(feedLabel) feedLabel.textContent=labels[active];
    root.innerHTML = items.map(p => {
      const s=getState(p);
      const comments=s.comments||[];
      return `<article class="sky-post ${active==='marketplace'?'market-post':''}" data-post-id="${esc(p.id)}">
        <div class="sky-post-head">
          <a class="post-avatar-link" href="profile.html?user=${encodeURIComponent(String(p.username||'').replace(/^@/,''))}" aria-label="Open ${esc(p.name)}'s profile"><img src="${esc(avatarFor(p,u))}" alt="${esc(p.name)} profile photo" onerror="this.onerror=null;this.src='assets/default-avatar.svg'"></a>
          <div><a class="post-author-link" href="profile.html?user=${encodeURIComponent(String(p.username||'').replace(/^@/,''))}"><strong>${esc(p.name)}</strong></a><small>${esc(p.username)} · ${esc(p.time)}</small></div>
        </div>
        <p>${esc(p.text).replace(/\n/g,'<br>')}</p>
        ${p.mediaUrl ? (p.mediaType==='video'?`<video class="sky-post-media" src="${esc(p.mediaUrl)}" controls playsinline></video>`:`<img class="sky-post-media" src="${esc(p.mediaUrl)}" alt="Post media" onerror="this.style.display='none'">`) : ''}
        ${p.price?`<div class="market-price">${esc(p.price)}</div>`:''}
        <div class="sky-post-actions">
          <button type="button" data-action="like" class="${s.liked?'is-liked':''}">${s.liked?'♥':'♡'} <span>${formatCount(s.likes)}</span></button>
          <button type="button" data-action="comment">▢ <span>${formatCount(s.commentCount || 0)}</span> Comment</button>
          <button type="button" data-action="share">↗ Share</button>
          ${active==='marketplace'?`<button type="button" class="market-pay" data-name="${esc(p.name)}" data-price="${esc(p.price)}">Pay</button>`:''}
        </div>
        <div class="post-comment-panel" ${comments.length?'':'hidden'}>
          <div class="post-comments">${comments.map(c=>`<div class="post-comment"><strong>${esc(c.name)}</strong><span>${esc(c.text)}</span></div>`).join('')}</div>
          <form class="inline-comment-form"><input data-comment maxlength="300" placeholder="Write a comment..."><button type="submit">Post</button></form>
        </div>
      </article>`;
    }).join('') || '<div class="section-empty">No posts match this section.</div>';
  }
  tabs.forEach(t=>t.addEventListener('click',()=>{active=t.dataset.section;tabs.forEach(x=>{x.classList.toggle('active',x===t);x.setAttribute('aria-selected',String(x===t));});render();}));
  const autoGrowPost=()=>{if(!postText)return;postText.style.height='auto';const max=window.matchMedia('(max-width:700px)').matches?150:170;postText.style.height=Math.min(postText.scrollHeight,max)+'px';postText.style.overflowY=postText.scrollHeight>max?'auto':'hidden';};
  postText?.addEventListener('input',autoGrowPost);postText?.addEventListener('focus',()=>postForm?.classList.add('composer-focused'));autoGrowPost();
  mediaButton?.addEventListener('click',()=>mediaInput?.click());
  mediaInput?.addEventListener('change',()=>{const f=mediaInput.files?.[0];if(!f)return;const r=new FileReader();r.onload=e=>{composerMedia={url:e.target.result,type:f.type.startsWith('video/')?'video':'image'};};r.readAsDataURL(f);});
  gifButton?.addEventListener('click',()=>{const url=prompt('Paste a GIF URL');if(url?.trim())composerMedia={url:url.trim(),type:'gif'};});
  locationButton?.addEventListener('click',()=>{if(!navigator.geolocation){alert('Location is not available on this device.');return;}locationButton.disabled=true;navigator.geolocation.getCurrentPosition(pos=>{postText.value=`${postText.value}${postText.value?'\n':''}📍 ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;autoGrowPost();locationButton.disabled=false;postText.focus();},()=>{alert('Unable to access your location.');locationButton.disabled=false;},{enableHighAccuracy:false,timeout:8000});});
  postForm?.addEventListener('submit',async e=>{e.preventDefault();const text=postText?.value.trim();if(!text&&!composerMedia){postText?.focus();return;}const u=await currentUser();const post={id:uid(),name:u?.name||'SkyLine User',username:'@'+String(u?.username||u?.accountNumber||'SkyLineUser').replace(/^@/,''),text:text||'',time:'Just now',likes:0,comments:0,avatar:u?.avatar||'assets/default-avatar.svg',mine:true,mediaUrl:composerMedia?.url||'',mediaType:composerMedia?.type||''};data.trends.unshift(post);try{localStorage.setItem(DATA_KEY,JSON.stringify({trends:data.trends.filter(p=>p.mine).slice(0,20)}));}catch(_){}postText.value='';if(mediaInput)mediaInput.value='';composerMedia=null;autoGrowPost();postForm.classList.remove('composer-focused');active='trends';tabs.forEach(x=>{x.classList.toggle('active',x.dataset.section==='trends');x.setAttribute('aria-selected',String(x.dataset.section==='trends'));});render();});
  root.addEventListener('click',async e=>{
    const postEl=e.target.closest('.sky-post');if(!postEl)return;const p=[...Object.values(data).flat()].find(x=>String(x.id)===String(postEl.dataset.postId));if(!p)return;
    const actionBtn=e.target.closest('button[data-action]');
    if(actionBtn){const action=actionBtn.dataset.action;const s=getState(p);
      if(action==='like'){s.liked=!s.liked;s.likes=Math.max(0,s.likes+(s.liked?1:-1));interactions[p.id]=s;saveInteractions();render();}
      if(action==='comment'){const panel=postEl.querySelector('.post-comment-panel');if(panel){panel.hidden=false;postEl.querySelector('[data-comment]')?.focus();}}
      if(action==='share'){const url=`${location.origin}${location.pathname}#post-${encodeURIComponent(p.id)}`;try{if(navigator.share)await navigator.share({title:`${p.name} on SkyLine`,text:p.text,url});else{await navigator.clipboard.writeText(url);alert('Post link copied.');}}catch(err){if(err?.name!=='AbortError')alert('Post is ready to share.');}}
    }
    const pay=e.target.closest('.market-pay');if(pay){payName.textContent=pay.dataset.name;payAmount.value=pay.dataset.price.replace(/[^0-9.]/g,'');payModal?.classList.add('show');}
  });
  root.addEventListener('submit',e=>{const form=e.target.closest('.inline-comment-form');if(!form)return;e.preventDefault();const postEl=form.closest('.sky-post');const p=[...Object.values(data).flat()].find(x=>String(x.id)===String(postEl?.dataset.postId));if(!p)return;const input=form.querySelector('[data-comment]');const text=input.value.trim();if(!text)return;currentUser().then(u=>{const s=getState(p);s.comments=[...(s.comments||[]),{name:u?.name||'SkyLine User',text}];s.commentCount=(s.commentCount||0)+1;interactions[p.id]=s;saveInteractions();render();});});
  closePay?.addEventListener('click',()=>payModal?.classList.remove('show'));payModal?.addEventListener('click',e=>{if(e.target===payModal)payModal.classList.remove('show')});payForm?.addEventListener('submit',e=>{e.preventDefault();alert('Payment is reserved for the secure SkyLine backend. No money was moved.');payModal?.classList.remove('show');});
  document.addEventListener('skyline-search',e=>{query=String(e.detail?.query||'').trim().toLowerCase();render();});
  render();
})();
