// ============================================
// js/auth.js
// Login, Signup, Logout ka sara code
// ============================================

let authMode = 'login'; // current tab: 'login' ya 'signup'

// Login ya Signup tab switch karna
function switchTab(mode) {
  authMode = mode;

  // Tab buttons update karo
  document.querySelectorAll('.tab-btn').forEach((btn, i) => {
    const isActive = (i === 0 && mode === 'login') || (i === 1 && mode === 'signup');
    btn.classList.toggle('active', isActive);
  });

  // Button ka text change karo
  document.getElementById('auth-btn').textContent =
    mode === 'login' ? 'Login' : 'Create Account';

  // Message clear karo
  document.getElementById('auth-msg').textContent = '';
}

// Login ya Signup button click hone par
async function handleAuth() {
  const email    = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;
  const btn      = document.getElementById('auth-btn');

  // Validation
  if (!email || !password) {
    showAuthMsg('Please fill in all fields', 'error');
    return;
  }

  if (!supabase) {
    showAuthMsg('Supabase configure karo pehle (config.js)', 'error');
    return;
  }

  // Button disable karo (loading state)
  btn.disabled = true;
  btn.textContent = 'Please wait...';

  try {
    let result;

    if (authMode === 'login') {
      // Login
      result = await supabase.auth.signInWithPassword({ email, password });
    } else {
      // Signup
      result = await supabase.auth.signUp({ email, password });
    }

    if (result.error) throw result.error;

    if (authMode === 'signup') {
      showAuthMsg('Account bana diya! Email check karo confirmation ke liye.', 'success');
    } else {
      // Login success — dashboard dikhao
      showApp(result.data.user);
      loadFiles();
    }

  } catch (err) {
    showAuthMsg(err.message, 'error');
  }

  // Button wapas enable karo
  btn.disabled = false;
  btn.textContent = authMode === 'login' ? 'Login' : 'Create Account';
}

// Logout
async function logout() {
  if (supabase) await supabase.auth.signOut();

  currentUser = null;
  allFiles    = [];

  // Auth screen wapas dikhao
  document.getElementById('app-screen').style.display = 'none';
  document.getElementById('auth-screen').style.display = 'flex';
}

// Auth message show karna
function showAuthMsg(text, type) {
  const el = document.getElementById('auth-msg');
  el.textContent = text;
  el.className   = 'auth-msg ' + type;
}