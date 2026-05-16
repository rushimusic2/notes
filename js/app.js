// ============================================
// js/app.js
// App ka main entry point — sab yahan se shuru hota hai
// ============================================

let supabase     = null; // Supabase client
let currentUser  = null; // logged in user

// ── App Start (page load hone par) ──
window.onload = async function () {

  // Supabase initialize karo
  const isConfigured = initSupabase();

  if (!isConfigured) {
    // Config nahi hai — Demo mode mein app dikhao
    showApp({ email: 'demo@example.com', id: 'demo' });
    loadDemoFiles();
    return;
  }

  // Check karo — koi pehle se login toh nahi hai?
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    // Pehle se login hai — seedha dashboard
    showApp(session.user);
    loadFiles();
  }
  // Nahi toh auth screen already visible hai (default)
};

// ── Supabase Initialize ──
function initSupabase() {
  // Check karo ki config.js mein URL dala hai ya nahi
  if (SUPABASE_URL === 'YOUR_SUPABASE_URL') {
    document.getElementById('config-banner').style.display = 'block'; // warning dikhao
    return false;
  }

  // Supabase client banao
  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  return true;
}

// ── Dashboard Dikhao ──
function showApp(user) {
  currentUser = user;

  // Auth screen hide karo
  document.getElementById('auth-screen').style.display = 'none';

  // Dashboard dikhao
  document.getElementById('app-screen').style.display = 'block';

  // Header mein email aur avatar set karo
  const shortName = user.email.split('@')[0];
  document.getElementById('user-email-label').textContent = user.email;
  document.getElementById('user-avatar').textContent      = shortName[0].toUpperCase();
}