/* SkyLine Cloud Authentication / Email Verification
   Add Supabase values for cross-device accounts.
   verificationEndpoint is the future secure server endpoint that sends the
   one-time email code. Never put private service-role keys in this file.
*/
window.SKYLINE_API = { baseUrl: "" };

window.SKYLINE_CLOUD = {
  enabled: false,
  supabaseUrl: "",
  supabaseAnonKey: "",
  verificationEndpoint: ""
};
