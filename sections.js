/* SkyLine social sections: Trends, Mutuals, Explore, Marketplace */
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
  const data = {
    trends: [
      {name:'Olusina Stephen', username:'@olusina', text:'Omo you not fit chop this life at once ooo', time:'5m', likes:'47K', comments:'1.2K', image:''},
      {name:'SkyLine Community', username:'@skyline', text:'What is trending in your city today? Share the moment with the community.', time:'18m', likes:'22K', comments:'806'},
      {name:'Amina Bello', username:'@aminabello', text:'Small wins still count. Keep moving.', time:'31m', likes:'12K', comments:'402'}
    ],
    mutuals: [
      {name:'Michael James', username:'@michaeljames', text:'New week, new goals. Who is building something exciting?', time:'12m', likes:'824', comments:'63'},
      {name:'Sarah Johnson', username:'@sarahjohnson', text:'Just discovered a great new place. The view was amazing.', time:'42m', likes:'1.1K', comments:'88'},
      {name:'Daniel Okafor', username:'@danielokafor', text:'Consistency beats intensity.', time:'1h', likes:'640', comments:'41'}
    ],
    explore: [
      {name:'SkyLine World Desk', username:'@worlddesk', text:'WORLD: Major developments are unfolding across markets, technology and travel. Follow verified updates here.', time:'Now', likes:'18K', comments:'932'},
      {name:'SkyLine Business', username:'@skylinebusiness', text:'BUSINESS: Global businesses are watching currency, commodities and technology markets closely today.', time:'22m', likes:'9.4K', comments:'401'},
      {name:'SkyLine Tech', username:'@skylinetech', text:'TECH: New products and AI developments are driving today’s technology conversation.', time:'45m', likes:'7.8K', comments:'305'}
    ],
    marketplace: [
      {name:'Chidi Stores', username:'@chidistores', text:'Premium sneakers — new stock available. Delivery available nationwide.', time:'9m', likes:'321', comments:'29', price:'₦85,000'},
      {name:'Ada Fashion', username:'@adafashion', text:'Original leather travel bag. Limited pieces available.', time:'26m', likes:'210', comments:'18', price:'₦65,000'},
      {name:'Tech Hub', username:'@techhub', text:'Refurbished laptop, 16GB RAM, 512GB SSD. Tested and ready.', time:'1h', likes:'540', comments:'74', price:'₦620,000'}
    ]
  };

  try {
    const saved = JSON.parse(localStorage.getItem(DATA_KEY) || '{}');
    Object.keys(data).forEach(k => { if (Array.isArray(saved[k])) data[k] = [...saved[k], ...data[k]]; });
  } catch (_) {}

  let active = 'trends';
  let query = '';
  const esc = s => String(s).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const avatar = () => {
    try {
      const u = JSON.parse(localStorage.getItem('skylineUser') || 'null');
      return u?.avatar || 'assets/default-avatar.svg';
    } catch (_) { return 'assets/default-avatar.svg'; }
  };
  const userAvatarFor = (p, u) => {
    const uname = String(p.username || '').replace(/^@/, '').toLowerCase();
    const current = String(u?.username || u?.accountNumber || '').replace(/^@/, '').toLowerCase();
    const same = p.mine || (current && uname === current) || (u?.name && p.name === u.name);
    return same && u?.avatar ? u.avatar : (p.avatar || 'assets/default-avatar.svg');
  };
  const currentUser = async () => window.skylineGetSession?.() || (() => { try { return JSON.parse(localStorage.getItem('skylineUser') || 'null'); } catch (_) { return null; } })() || {name:'SkyLine User', username:'SkyLineUser'};

  async function render() {
    const u = await currentUser();
    const items = data[active].filter(p => !query || `${p.name} ${p.username} ${p.text}`.toLowerCase().includes(query));
    const labels = {trends:'Trending posts', mutuals:'Posts from your mutuals', explore:'World news and updates', marketplace:'Items available to trade'};
    if (feedLabel) feedLabel.textContent = labels[active];
    root.innerHTML = items.map(p => `
      <article class="sky-post ${active==='marketplace'?'market-post':''}">
        <div class="sky-post-head">
          <img src="${esc(userAvatarFor(p,u))}" alt="Profile photo" onerror="this.onerror=null;this.src='assets/default-avatar.svg'">
          <div><strong>${esc(p.name)}</strong><small>${esc(p.username)} · ${esc(p.time)}</small></div>
        </div>
        <p>${esc(p.text)}</p>
        ${p.mediaUrl ? (p.mediaType === 'video' ? `<video class="sky-post-media" src="${esc(p.mediaUrl)}" controls playsinline></video>` : `<img class="sky-post-media" src="${esc(p.mediaUrl)}" alt="Post media" onerror="this.style.display='none'">`) : ''}
        ${p.price ? `<div class="market-price">${esc(p.price)}</div>` : ''}
        <div class="sky-post-actions">
          <button type="button">♡ ${esc(p.likes)}</button>
          <button type="button">▢ ${esc(p.comments)}</button>
          <button type="button">↗ Share</button>
          ${active==='marketplace' ? `<button type="button" class="market-pay" data-name="${esc(p.name)}" data-price="${esc(p.price)}">Pay</button>` : ''}
        </div>
      </article>`).join('') || '<div class="section-empty">No posts match this section.</div>';
  }

  tabs.forEach(t => t.addEventListener('click', () => {
    active = t.dataset.section;
    tabs.forEach(x => { x.classList.toggle('active', x===t); x.setAttribute('aria-selected', String(x===t)); });
    render();
  }));

  const autoGrowPost = () => {
    if (!postText) return;
    postText.style.height = 'auto';
    const maxHeight = window.matchMedia('(max-width: 700px)').matches ? 150 : 170;
    postText.style.height = Math.min(postText.scrollHeight, maxHeight) + 'px';
    postText.style.overflowY = postText.scrollHeight > maxHeight ? 'auto' : 'hidden';
  };
  postText?.addEventListener('input', autoGrowPost);
  postText?.addEventListener('focus', () => postForm?.classList.add('composer-focused'));
  autoGrowPost();

  mediaButton?.addEventListener('click', () => mediaInput?.click());
  mediaInput?.addEventListener('change', () => {
    const f = mediaInput.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = e => { composerMedia = { url: e.target.result, type: f.type.startsWith('video/') ? 'video' : 'image' }; };
    r.readAsDataURL(f);
  });
  gifButton?.addEventListener('click', () => {
    const url = prompt('Paste a GIF URL');
    if (url?.trim()) composerMedia = { url: url.trim(), type: 'gif' };
  });
  locationButton?.addEventListener('click', () => {
    if (!navigator.geolocation) { alert('Location is not available on this device.'); return; }
    locationButton.disabled = true;
    navigator.geolocation.getCurrentPosition(pos => {
      const label = `📍 ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
      postText.value = `${postText.value}${postText.value ? '\n' : ''}${label}`;
      autoGrowPost(); locationButton.disabled = false; postText.focus();
    }, () => { alert('Unable to access your location.'); locationButton.disabled = false; }, {enableHighAccuracy:false,timeout:8000});
  });

  postForm?.addEventListener('submit', async e => {
    e.preventDefault();
    const text = postText?.value.trim();
    if (!text && !composerMedia) { postText?.focus(); return; }
    const u = await currentUser();
    const post = {
      name: u?.name || 'SkyLine User',
      username: '@' + String(u?.username || u?.accountNumber || 'SkyLineUser').replace(/^@/, ''),
      text: text || '', time:'Just now', likes:'0', comments:'0', avatar: u?.avatar || avatar(), mine:true,
      mediaUrl: composerMedia?.url || '', mediaType: composerMedia?.type || ''
    };
    data.trends.unshift(post);
    try { localStorage.setItem(DATA_KEY, JSON.stringify({trends:data.trends.filter(p=>p.mine).slice(0,20)})); } catch (_) {}
    postText.value = '';
    if (mediaInput) mediaInput.value = '';
    composerMedia = null;
    postText.style.height = '42px';
    postText.style.overflowY = 'hidden';
    postForm.classList.remove('composer-focused');
    active = 'trends';
    tabs.forEach(x => { x.classList.toggle('active', x.dataset.section==='trends'); x.setAttribute('aria-selected', String(x.dataset.section==='trends')); });
    render();
  });

  root.addEventListener('click', async e => {
    const b = e.target.closest('.market-pay');
    if (!b) return;
    payName.textContent = b.dataset.name;
    payAmount.value = b.dataset.price.replace(/[^0-9.]/g,'');
    payModal?.classList.add('show');
  });

  closePay?.addEventListener('click', () => payModal?.classList.remove('show'));
  payModal?.addEventListener('click', e => { if (e.target === payModal) payModal.classList.remove('show'); });
  payForm?.addEventListener('submit', e => { e.preventDefault(); alert('Payment is reserved for the secure SkyLine backend. No money was moved.'); payModal?.classList.remove('show'); });

  document.addEventListener('skyline-search', e => {
    query = String(e.detail?.query || '').trim().toLowerCase();
    render();
  });

  render();
})();
