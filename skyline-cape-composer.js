/* Skyline timeline layout pass v6 */
(() => {
'use strict';
const ready=fn=>document.readyState==='loading'?document.addEventListener('DOMContentLoaded',fn,{once:true}):fn();
ready(()=>{
 const form=document.getElementById('sectionPostForm'),section=document.querySelector('.compact-create-post'),tabs=document.querySelector('.section-tabs'),ta=document.getElementById('sectionPostText'),media=document.getElementById('composerMediaInput'),discovery=document.querySelector('.timeline-discovery'),community=document.querySelector('.community-link');
 if(!form||!section||!tabs||!ta||!discovery)return;
 const parent=section.parentElement;
 /* Independent tabs immediately after the site header; community callout directly before Stories & Reels. */
 const header=document.querySelector('header');
 if(header)header.insertAdjacentElement('afterend',tabs);
 if(community)discovery.insertAdjacentElement('beforebegin',community);
 /* Put a compact + control on the same row as Stories & Reels. */
 const head=discovery.querySelector('.discovery-head');
 const launch=document.createElement('button');launch.type='button';launch.className='skyline-compose-launcher';launch.setAttribute('aria-label','Create a post or story');launch.title='Create a post or story';launch.textContent='+';
 if(head)head.appendChild(launch);else discovery.prepend(launch);
 const backdrop=document.createElement('div');backdrop.className='skyline-composer-backdrop';backdrop.hidden=true;
 backdrop.innerHTML='<section class="skyline-composer-dialog" role="dialog" aria-modal="true" aria-labelledby="skylineComposerTitle"><div class="skyline-composer-heading"><div><span class="eyebrow">SKYLINE COMMUNITY</span><h2 id="skylineComposerTitle">Create a post or story</h2></div><button type="button" class="skyline-composer-close" aria-label="Close composer">×</button></div><div class="skyline-composer-slot"></div></section>';
 document.body.appendChild(backdrop);backdrop.querySelector('.skyline-composer-slot').appendChild(section);section.classList.add('skyline-composer-modal-content');
 const key='skylineTimelineDraftV1',closeBtn=backdrop.querySelector('.skyline-composer-close');
 const hasContent=()=>!!ta.value.trim()||!!media?.files?.length;
 const save=()=>{try{localStorage.setItem(key,JSON.stringify({text:ta.value,savedAt:new Date().toISOString()}));}catch(e){}};
 const fit=()=>{ta.style.height='auto';const max=Math.max(180,Math.floor(innerHeight*.55)),h=ta.scrollHeight;ta.style.height=Math.min(h,max)+'px';ta.style.overflowY=h>max?'auto':'hidden';};
 const open=()=>{backdrop.hidden=false;document.body.classList.add('skyline-composer-open');try{const d=JSON.parse(localStorage.getItem(key)||'null');if(!ta.value&&d?.text)ta.value=d.text;}catch(e){}requestAnimationFrame(()=>{fit();ta.focus();});};
 const finish=()=>{backdrop.hidden=true;document.body.classList.remove('skyline-composer-open');launch.focus();};
 const close=()=>{if(!hasContent()){finish();return;}const a=prompt('Unfinished post: type SAVE to save draft, DISCARD to delete it, or KEEP to continue editing.','SAVE');if(a===null||/^keep$/i.test(a.trim()))return;if(/^save$/i.test(a.trim())){save();finish();return;}if(/^discard$/i.test(a.trim())){ta.value='';if(media)media.value='';try{localStorage.removeItem(key)}catch(e){}fit();finish();return;}alert('Please type SAVE, DISCARD, or KEEP.');};
 launch.addEventListener('click',open);closeBtn.addEventListener('click',close);backdrop.addEventListener('click',e=>{if(e.target===backdrop)close();});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!backdrop.hidden)close();});
 ta.addEventListener('input',()=>{fit();save();});ta.addEventListener('paste',()=>requestAnimationFrame(()=>{fit();save();}));addEventListener('resize',()=>{if(!backdrop.hidden)fit();});
 form.addEventListener('reset',()=>setTimeout(()=>{ta.style.height='';try{localStorage.removeItem(key)}catch(e){}finish();},0));form.addEventListener('submit',()=>setTimeout(()=>{if(!ta.value.trim()&&!media?.files?.length)finish();},250));section.hidden=false;fit();
 const nav=document.querySelector('.skyline-bottom-nav');if(nav){let timer=0,last=scrollY;addEventListener('scroll',()=>{const y=scrollY,delta=y-last;last=y;nav.classList.toggle('nav-scroll-moving',delta<0);nav.style.setProperty('--nav-drift',delta<0?'12px':'0px');clearTimeout(timer);timer=setTimeout(()=>{nav.classList.remove('nav-scroll-moving');nav.style.setProperty('--nav-drift','0px');},220);},{passive:true});}
});})();
