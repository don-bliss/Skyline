/* SkyLine local demo mode for GitHub Pages.
   No backend or database is used in this mode. Accounts are stored only in this
   browser's localStorage; do not use real/reused passwords or real financial data.
   To reconnect a backend later, set baseUrl to the new HTTPS API URL and configure
   the server's CORS allowlist and database/JWT environment variables.
*/
window.SKYLINE_API = { baseUrl: "" };
window.SKYLINE_CLOUD = {
  enabled: false,
  supabaseUrl: "",
  supabaseAnonKey: "",
  verificationEndpoint: ""
};
