/* SkyLine API client scaffold
   No private keys belong in this browser file. Set SKYLINE_API.baseUrl to your
   HTTPS backend when it is deployed. The methods below define the frontend/backend contract.
*/
(() => {
  'use strict';
  const cfg = window.SKYLINE_API || { baseUrl: '' };
  const request = async (path, options = {}) => {
    if (!cfg.baseUrl) throw new Error('SkyLine backend is not connected yet.');
    const res = await fetch(`${cfg.baseUrl.replace(/\/$/,'')}${path}`, {
      ...options,
      headers: { 'Content-Type':'application/json', ...(options.headers || {}) },
      credentials: 'include'
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `SkyLine API error (${res.status})`);
    return data;
  };
  window.SkyLineAPI = {
    health: () => request('/api/v1/health'),
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
