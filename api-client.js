/* SkyLine API client v18
   Cross-device authentication uses a deployed HTTPS SkyLine API.
   The access/refresh tokens are stored only on the current device.
*/
(() => {
  'use strict';
  const cfg = window.SKYLINE_API || { baseUrl: '' };
  const TOKEN_KEY = 'skylineAccessToken';
  const REFRESH_KEY = 'skylineRefreshToken';
  const getToken = () => localStorage.getItem(TOKEN_KEY) || '';
  const request = async (path, options = {}, retry = true) => {
    if (!cfg.baseUrl) throw new Error('SkyLine backend is not connected yet.');
    const headers = { 'Content-Type':'application/json', ...(options.headers || {}) };
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${cfg.baseUrl.replace(/\/$/,'')}${path}`, { ...options, headers, credentials:'include' });
    if (res.status === 401 && retry && path !== '/api/v1/auth/login' && path !== '/api/v1/auth/refresh') {
      const refreshToken = localStorage.getItem(REFRESH_KEY);
      if (refreshToken) {
        try {
          const refreshed = await request('/api/v1/auth/refresh', { method:'POST', body:JSON.stringify({refreshToken}) }, false);
          setTokens(refreshed.accessToken, refreshed.refreshToken);
          return request(path, options, false);
        } catch (_) { clearTokens(); }
      }
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `SkyLine API error (${res.status})`);
    return data;
  };
  const setTokens = (accessToken, refreshToken) => {
    if (accessToken) localStorage.setItem(TOKEN_KEY, accessToken);
    if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
  };
  const clearTokens = () => { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(REFRESH_KEY); };
  window.SkyLineAPI = {
    isConfigured: () => Boolean(cfg.baseUrl),
    setTokens, clearTokens,
    health: () => request('/api/v1/health'),
    authSignup: body => request('/api/v1/auth/signup', {method:'POST', body:JSON.stringify(body)}),
    authLogin: body => request('/api/v1/auth/login', {method:'POST', body:JSON.stringify(body)}),
    authRefresh: refreshToken => request('/api/v1/auth/refresh', {method:'POST', body:JSON.stringify({refreshToken})}),
    authLogout: () => request('/api/v1/auth/logout', {method:'POST'}),
    me: () => request('/api/v1/me'),
    profile: () => request('/api/v1/profile'),
    updateProfile: body => request('/api/v1/profile', {method:'PATCH', body:JSON.stringify(body)}),
    timeline: () => request('/api/v1/timeline'),
    trends: () => request('/api/v1/feed/trends'),
    mutuals: () => request('/api/v1/feed/mutuals'),
    explore: () => request('/api/v1/feed/explore'),
    marketplace: () => request('/api/v1/marketplace'),
    createPost: body => request('/api/v1/timeline/posts', {method:'POST', body:JSON.stringify(body)}),
    notifications: () => request('/api/v1/notifications'),
    wallet: () => request('/api/v1/wallet'),
    walletAction: (action, body={}) => request(`/api/v1/wallet/${action}`, {method:'POST', body:JSON.stringify(body)}),
    cryptoMarkets: () => request('/api/v1/crypto/markets'),
    cryptoOrder: body => request('/api/v1/crypto/orders', {method:'POST', body:JSON.stringify(body)}),
    transferQuote: body => request('/api/v1/transfers/quote', {method:'POST', body:JSON.stringify(body)}),
    createTransfer: body => request('/api/v1/transfers', {method:'POST', body:JSON.stringify(body)}),
    transactions: () => request('/api/v1/transactions')
  };
})();
