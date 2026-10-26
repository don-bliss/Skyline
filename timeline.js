/* SkyLine Timeline */
(() => {
  "use strict";
  const KEY = "skylinePosts";
  const form = document.getElementById("postForm");
  const text = document.getElementById("postText");
  const image = document.getElementById("postImage");
  const feed = document.getElementById("timelineFeed");
  const preview = document.getElementById("postPreview");
  const imagePreview = document.getElementById("postImagePreview");
  let posts = [];
  try { posts = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { posts=[]; }

  async function user(){ return await window.skylineGetSession?.() || JSON.parse(localStorage.getItem("skylineUser")||"null") || {name:"SkyLine User",avatar:""}; }
  const esc=s=>String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  function save(){localStorage.setItem(KEY,JSON.stringify(posts));}
  function render(){
    if(!feed)return;
    feed.innerHTML = posts.length ? posts.map(p=>`<article class="timeline-post" data-id="${p.id}"><div class="post-user"><div class="avatar">${p.avatar?`<img src="${p.avatar}" alt="">`:'<span>SB</span>'}</div><div><strong>${esc(p.name)}</strong><small>${new Date(p.createdAt).toLocaleString([], {dateStyle:'medium',timeStyle:'short'})}</small></div></div><p>${esc(p.text||"").replace(/\n/g,"<br>")}</p>${p.image?`<img class="timeline-image" src="${p.image}" alt="Post image">`:''}<div class="post-meta"><span>${p.likes||0} likes</span><span>${p.comments?.length||0} comments</span></div><div class="post-actions"><button data-action="like">${p.liked?'♥':'♡'} Like</button><button data-action="comment">Comment</button><button data-action="share">Share</button>${p.mine?'<button data-action="delete">Delete</button>':''}</div><div class="comments">${(p.comments||[]).map(c=>`<div><strong>${esc(c.name)}</strong> ${esc(c.text)}</div>`).join("")}<div class="comment-box"><input data-comment placeholder="Write a comment..."><button data-action="add-comment">Post</button></div></div></article>`).join('') : '<div class="timeline-empty"><div class="empty-icon">✦</div><h2>Your timeline starts here</h2><p>Share an update, photo or moment with your SkyLine community.</p></div>';
  }
  image?.addEventListener('change',()=>{const f=image.files?.[0]; if(!f)return; const r=new FileReader(); r.onload=e=>{imagePreview.src=e.target.result;preview.hidden=false;};r.readAsDataURL(f);});
  form?.addEventListener('submit',async e=>{e.preventDefault();const value=text.value.trim();const file=image.files?.[0];if(!value&&!file){text.focus();return;}const u=await user();const add=(src)=>{posts.unshift({id:crypto.randomUUID?.()||String(Date.now()),name:u.name,email:u.email,avatar:u.avatar||'',text:value,image:src||'',createdAt:new Date().toISOString(),likes:0,liked:false,comments:[],mine:true});save();render();form.reset();preview.hidden=true;};if(file){const r=new FileReader();r.onload=e=>add(e.target.result);r.readAsDataURL(file);}else add('');});
  feed?.addEventListener('click',async e=>{const btn=e.target.closest('button[data-action]');if(!btn)return;const post=btn.closest('.timeline-post');const p=posts.find(x=>x.id===post.dataset.id);if(!p)return;const action=btn.dataset.action; if(action==='like'){p.liked=!p.liked;p.likes=Math.max(0,(p.likes||0)+(p.liked?1:-1));} if(action==='delete'){posts=posts.filter(x=>x.id!==p.id);} if(action==='share'){try{await navigator.clipboard.writeText(location.href+'#post-'+p.id);alert('Post link copied.');}catch{alert('Post ready to share.');}} if(action==='add-comment'){const input=post.querySelector('[data-comment]');if(input.value.trim()){const u=await user();p.comments.push({name:u.name,text:input.value.trim()});input.value='';}} if(action==='comment'){post.querySelector('[data-comment]')?.focus();}save();render();});
  render();
})();
