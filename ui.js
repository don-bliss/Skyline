/* =========================================================
   SKYLINE UI / X-STYLE DRAWER + MOBILE BOTTOM NAV
   ========================================================= */
(() => {
  "use strict";
  const page = (location.pathname.split("/").pop() || "index.html").split(/[?#]/)[0];
  const protectedPages = ["home.html","timeline.html","profile.html","inbox.html","wallet.html","settings.html","notifications.html","community.html"];
  const icon = (name) => {
    const paths = {
      home:'<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10.5V20h14v-9.5"/><path d="M9 20v-5h6v5"/>',
      timeline:'<path d="M4 5h16M4 12h16M4 19h16"/><circle cx="7" cy="5" r="1"/><circle cx="7" cy="12" r="1"/><circle cx="7" cy="19" r="1"/>',
      profile:'<circle cx="12" cy="8" r="4"/><path d="M4 21c.8-4 3.4-6 8-6s7.2 2 8 6"/>',
      support:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.7 2.7 0 0 1 5.1 1.2c0 1.8-2.6 2-2.6 3.6"/><path d="M12 17h.01"/>',
      about:'<circle cx="12" cy="12" r="9"/><path d="M12 10v6"/><path d="M12 7h.01"/>',
      inbox:'<path d="M4 5h16v12H7l-3 3z"/><path d="M8 10h8M8 13h5"/>',
      wallet:'<path d="M4 6h15v13H4z"/><path d="M4 8h15"/><path d="M16 13h4v4h-4a2 2 0 0 1 0-4z"/>',
      notifications:'<path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
      settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.8 1.8 0 0 0 .3 2l.1.1-1.8 1.8-.1-.1a1.8 1.8 0 0 0-2-.3 1.8 1.8 0 0 0-1 1.7V20h-2.5v-.2a1.8 1.8 0 0 0-1-1.7 1.8 1.8 0 0 0-2 .3l-.1.1-1.8-1.8.1-.1a1.8 1.8 0 0 0 .3-2 1.8 1.8 0 0 0-1.7-1H6V11h.2a1.8 1.8 0 0 0 1.7-1 1.8 1.8 0 0 0-.3-2l-.1-.1 1.8-1.8.1.1a1.8 1.8 0 0 0 2 .3 1.8 1.8 0 0 0 1-1.7V4h2.5v.2a1.8 1.8 0 0 0 1 1.7 1.8 1.8 0 0 0 2-.3l.1-.1 1.8 1.8-.1.1a1.8 1.8 0 0 0-.3 2 1.8 1.8 0 0 0 1.7 1h.2v2.5h-.2a1.8 1.8 0 0 0-1.7 1Z"/>',
      logout:'<path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M13 4h7v16h-7"/>'
    };
    return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.about}</svg>`;
  };

  function drawerLinks() {
    if (protectedPages.includes(page)) return [
      ["timeline.html","Timeline","timeline"],
      ["profile.html","Profile","profile"],
      ["features.html","Features","timeline"],
      ["skyinfo.html","About","about"],
      ["support.html","Support","support"],
      ["settings.html","Settings","settings"],
      ["crypto.html","Exchange","wallet"]
    ];
    return [["index.html","Home","home"],["features.html","Features","timeline"],["skyinfo.html","About","about"],["support.html","Support","support"],["login.html","Login","login"],["signup.html","Create Account","signup"]];
  }

  function injectDrawer() {
    const header = document.querySelector("header");
    if (!header || document.querySelector(".skyline-menu-trigger")) return;
    const nav = header.querySelector("nav");
    if (nav) nav.classList.add("skyline-legacy-nav");
    if (page === "timeline.html") {
      const searchTrigger = document.createElement("button");
      searchTrigger.className = "skyline-search-trigger";
      searchTrigger.setAttribute("aria-label", "Search SkyLine");
      searchTrigger.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"></circle><path d="m16 16 5 5"></path></svg>';
      header.appendChild(searchTrigger);

      const searchModal = document.createElement("div");
      searchModal.className = "skyline-search-modal";
      searchModal.innerHTML = '<div class="skyline-search-card" role="dialog" aria-modal="true" aria-label="Search SkyLine"><textarea id="skylineGlobalSearch" rows="1" maxlength="300" placeholder="Search SkyLine" autocomplete="off"></textarea><button type="button" id="closeSkylineSearch">Close</button></div>';
      document.body.appendChild(searchModal);
      const searchInput = searchModal.querySelector("#skylineGlobalSearch");
      const closeSearch = searchModal.querySelector("#closeSkylineSearch");
      const autoGrow = (el, maxHeight=180) => {
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = Math.min(el.scrollHeight, maxHeight) + 'px';
        el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden';
      };
      const openSearch = () => { searchModal.classList.add("show"); setTimeout(() => { autoGrow(searchInput); searchInput?.focus(); }, 30); };
      const hideSearch = () => { searchModal.classList.remove("show"); };
      searchInput?.addEventListener("input", () => { autoGrow(searchInput); document.dispatchEvent(new CustomEvent("skyline-search", { detail: { query: searchInput.value } })); });
      searchTrigger.addEventListener("click", openSearch);
      closeSearch?.addEventListener("click", hideSearch);
      searchModal.addEventListener("click", e => { if (e.target === searchModal) hideSearch(); });
      document.addEventListener("keydown", e => { if (e.key === "Escape") hideSearch(); });
    }

    const trigger = document.createElement("button");
    trigger.className = "skyline-menu-trigger";
    trigger.setAttribute("aria-label","Open SkyLine menu");
    trigger.innerHTML = '<span></span><span></span><span></span>';
    header.appendChild(trigger);

    const overlay = document.createElement("div"); overlay.className = "skyline-drawer-overlay";
    const drawer = document.createElement("aside"); drawer.className = "skyline-drawer"; drawer.setAttribute("aria-label","SkyLine menu");
    drawer.innerHTML = `<div class="drawer-head"><button class="drawer-profile drawer-profile-link" type="button" data-profile-link aria-label="Open your profile"><div class="drawer-avatar"><img data-drawer-avatar src="assets/default-avatar.svg" alt="Profile"></div><div class="drawer-identity"><strong data-drawer-name>SkyLine User</strong><small data-drawer-username>@SkyLineUser</small></div></button><button class="drawer-close" aria-label="Close menu">×</button></div><div class="drawer-links">${drawerLinks().map(([href,label,ic])=>`<a href="${href}" class="${href===page?'active':''}">${icon(ic)}<span>${label}</span></a>`).join("")}<div class="drawer-theme-row"><span class="drawer-theme-icon">${icon('settings')}</span><span class="drawer-theme-label">Dark mode</span><button type="button" class="theme-switch" id="drawerThemeToggle" role="switch" aria-checked="true" aria-label="Toggle dark mode"><span></span></button></div></div>${protectedPages.includes(page)?'<button class="drawer-logout" data-logout>'+icon('logout')+'<span>Logout</span></button>':''}`;
    document.body.append(overlay, drawer);
    const renderDrawerUser = async () => {
      try {
        const u = await window.skylineGetSession?.() || (()=>{try{return JSON.parse(localStorage.getItem('skylineUser')||'null')}catch{return null}})();
        if (!u) return;
        const name = u.name || 'SkyLine User';
        const username = u.username || u.accountNumber || '';
        const n = drawer.querySelector('[data-drawer-name]');
        const h = drawer.querySelector('[data-drawer-username]');
        const img = drawer.querySelector('[data-drawer-avatar]');
        if (n) n.textContent = name;
        if (h) h.textContent = username ? '@' + String(username).replace(/^@/,'') : '@SkyLineUser';
        if (img && u.avatar) img.src = u.avatar;
      } catch (_) {}
    };
    renderDrawerUser();
    const open=()=>{drawer.classList.add('open');overlay.classList.add('show');document.body.classList.add('drawer-open');renderDrawerUser();syncThemeSwitch();};
    const close=()=>{drawer.classList.remove('open');overlay.classList.remove('show');document.body.classList.remove('drawer-open');};
    trigger.addEventListener('click',open); overlay.addEventListener('click',close); drawer.querySelector('.drawer-close').addEventListener('click',close);
    drawer.querySelectorAll('a').forEach(a=>a.addEventListener('click',close));
    drawer.querySelector('[data-profile-link]')?.addEventListener('click',()=>{location.href='profile.html';});
    const logout=drawer.querySelector('[data-logout]'); if(logout) logout.addEventListener('click',e=>{e.preventDefault();window.skylineLogout?.();});
    const themeSwitch=drawer.querySelector('#drawerThemeToggle');
    const syncThemeSwitch=()=>{const dark=document.body.classList.contains('dark-mode'); if(themeSwitch){themeSwitch.classList.toggle('on',dark);themeSwitch.setAttribute('aria-checked',String(dark));themeSwitch.title=dark?'Switch to light mode':'Switch to dark mode'; themeSwitch.setAttribute('aria-label',dark?'Switch to light mode':'Switch to dark mode');}};
    themeSwitch?.addEventListener('click',(e)=>{e.preventDefault();e.stopPropagation();const dark=document.body.classList.contains('dark-mode');const next=dark?'light':'dark';if(typeof window.skylineSetTheme==='function'){window.skylineSetTheme(next);}else{document.body.classList.toggle('dark-mode',next==='dark');localStorage.setItem('skylineTheme',next);}syncThemeSwitch();});
    syncThemeSwitch();
    document.addEventListener('click',e=>{const target=e.target.closest('[data-profile-link], .profile-card, [data-profile-icon]');if(!target || drawer.contains(target)) return;if(target.tagName==='A' && target.getAttribute('href')==='profile.html') return;e.preventDefault();location.href='profile.html';});
  }

  function injectBottomNav() {
    if (!protectedPages.includes(page) || document.querySelector('.skyline-bottom-nav')) return;
    const nav = document.createElement('nav');
    nav.className = 'skyline-bottom-nav';
    nav.setAttribute('aria-label','SkyLine quick navigation');
    const isTimeline = page === 'timeline.html';
    nav.innerHTML = `
      <a href="${isTimeline ? '#' : 'timeline.html'}" class="quick-home ${isTimeline ? 'active' : ''}" aria-label="Home">${icon('home')}<span>Home</span></a>
      <a href="inbox.html" class="${page==='inbox.html'?'active':''}" aria-label="Inbox">${icon('inbox')}<span>Inbox</span></a>
      <a href="notifications.html" class="${page==='notifications.html'?'active':''}" aria-label="Notifications">${icon('notifications')}<span>Notifications</span><i class="nav-dot" hidden></i></a>
      <a href="wallet.html" class="wallet-link ${page==='wallet.html'?'active':''}" aria-label="Wallet">${icon('wallet')}<span>Wallet</span></a>`;
    document.body.appendChild(nav);
    const home = nav.querySelector('.quick-home');
    home.addEventListener('click', (e) => {
      if (isTimeline) { e.preventDefault(); location.reload(); }
    });
  }

  function inject() {
    injectDrawer();
    injectBottomNav();
    document.body.classList.add('skyline-ui-ready');
  }
  document.addEventListener('DOMContentLoaded', inject);
})();
