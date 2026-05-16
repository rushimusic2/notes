
// ════════════════════════════════════════════
// CONFIG — Apna Supabase URL + Key yahan dalo
// ════════════════════════════════════════════
const SUPABASE_URL = 'jblcacdyiqjomisidwrc';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpibGNhY2R5aXFqb21pc2lkd3JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5MzIwMjMsImV4cCI6MjA5NDUwODAyM30.phCuo7WrpH57ppohoUJD27UNcivZw6dMmFAiobDOOkg';
const BUCKET_NAME  = 'documents';

// ════════════════════════════════════════════
// INIT
// ════════════════════════════════════════════
let supabase = null;
let currentUser = null;
let allFiles = [];
let currentSort = 'date-desc';
let shareCurrentUrl = '';

function initSupabase() {
  if (SUPABASE_URL === 'YOUR_SUPABASE_URL') {
    document.getElementById('config-banner').style.display = 'block';
    return false;
  }
  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  return true;
}

window.onload = async () => {
  const ok = initSupabase();
  if (!ok) {
    // Demo mode — show app with mock data
    showApp({ email: 'demo@example.com', id: 'demo' });
    loadMockFiles();
    return;
  }
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    showApp(session.user);
    loadFiles();
  }
};

// ════════════════════════════════════════════
// AUTH
// ════════════════════════════════════════════
let authMode = 'login';

function switchTab(mode) {
  authMode = mode;
  document.querySelectorAll('.tab-btn').forEach((b, i) => {
    b.classList.toggle('active', (i === 0 && mode === 'login') || (i === 1 && mode === 'signup'));
  });
  document.getElementById('auth-btn').textContent = mode === 'login' ? 'Login' : 'Create Account';
  document.getElementById('auth-msg').textContent = '';
}

async function handleAuth() {
  const email = document.getElementById('auth-email').value.trim();
  const pass  = document.getElementById('auth-password').value;
  const btn   = document.getElementById('auth-btn');
  const msg   = document.getElementById('auth-msg');

  if (!email || !pass) { showAuthMsg('Please fill in all fields', 'error'); return; }
  if (!supabase) { showAuthMsg('Configure Supabase first!', 'error'); return; }

  btn.disabled = true;
  btn.textContent = 'Please wait...';
  msg.textContent = '';

  try {
    let result;
    if (authMode === 'login') {
      result = await supabase.auth.signInWithPassword({ email, password: pass });
    } else {
      result = await supabase.auth.signUp({ email, password: pass });
    }

    if (result.error) throw result.error;

    if (authMode === 'signup') {
      showAuthMsg('Account created! Check email to confirm.', 'success');
    } else {
      showApp(result.data.user);
      loadFiles();
    }
  } catch (err) {
    showAuthMsg(err.message, 'error');
  }

  btn.disabled = false;
  btn.textContent = authMode === 'login' ? 'Login' : 'Create Account';
}

function showAuthMsg(text, type) {
  const el = document.getElementById('auth-msg');
  el.textContent = text;
  el.className = 'auth-msg ' + type;
}

async function logout() {
  if (supabase) await supabase.auth.signOut();
  currentUser = null;
  allFiles = [];
  document.getElementById('app-screen').style.display = 'none';
  document.getElementById('auth-screen').style.display = 'flex';
}

function showApp(user) {
  currentUser = user;
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('app-screen').style.display = 'block';
  const short = user.email.split('@')[0];
  document.getElementById('user-email-label').textContent = user.email;
  document.getElementById('user-avatar').textContent = short[0].toUpperCase();
}

// ════════════════════════════════════════════
// UPLOAD
// ════════════════════════════════════════════
function handleDragOver(e) {
  e.preventDefault();
  document.getElementById('upload-zone').classList.add('drag-over');
}
function handleDragLeave() {
  document.getElementById('upload-zone').classList.remove('drag-over');
}
function handleDrop(e) {
  e.preventDefault();
  document.getElementById('upload-zone').classList.remove('drag-over');
  uploadFiles(Array.from(e.dataTransfer.files));
}
function handleFileSelect(e) {
  uploadFiles(Array.from(e.target.files));
  e.target.value = '';
}

async function uploadFiles(files) {
  if (!files.length) return;

  for (const file of files) {
    if (file.size > 50 * 1024 * 1024) {
      showToast(`${file.name} is too large (max 50MB)`, 'error');
      continue;
    }
    await uploadSingleFile(file);
  }
}

async function uploadSingleFile(file) {
  const prog = document.getElementById('upload-progress');
  const bar  = document.getElementById('progress-bar');
  const pct  = document.getElementById('progress-pct');
  const name = document.getElementById('progress-name');

  prog.style.display = 'block';
  name.textContent = file.name;
  bar.style.width = '0%';
  pct.textContent = '0%';

  // Simulate progress for UI (Supabase JS doesn't have native upload progress)
  let fakeProgress = 0;
  const interval = setInterval(() => {
    fakeProgress = Math.min(fakeProgress + Math.random() * 15, 85);
    bar.style.width = fakeProgress + '%';
    pct.textContent = Math.round(fakeProgress) + '%';
  }, 200);

  try {
    if (!supabase) {
      // Demo mode — add mock file
      await new Promise(r => setTimeout(r, 1500));
      clearInterval(interval);
      bar.style.width = '100%'; pct.textContent = '100%';
      const mock = {
        id: Date.now().toString(),
        name: file.name,
        size: file.size,
        created_at: new Date().toISOString(),
        path: 'demo/' + file.name,
        share_token: Math.random().toString(36).slice(2, 12),
        url: null
      };
      allFiles.unshift(mock);
      renderFiles(allFiles);
      updateStats();
      showToast(`${file.name} uploaded!`, 'success');
    } else {
      const path = `${currentUser.id}/${Date.now()}_${file.name}`;
      const { error: upErr } = await supabase.storage.from(BUCKET_NAME).upload(path, file);
      if (upErr) throw upErr;

      // Save metadata
      const shareToken = Math.random().toString(36).slice(2, 12);
      const { error: dbErr } = await supabase.from('files').insert({
        user_id: currentUser.id,
        name: file.name,
        path,
        size: file.size,
        share_token: shareToken,
        mime_type: file.type,
      });
      if (dbErr) throw dbErr;

      clearInterval(interval);
      bar.style.width = '100%'; pct.textContent = '100%';
      showToast(`${file.name} uploaded!`, 'success');
      await loadFiles();
    }
  } catch (err) {
    clearInterval(interval);
    showToast('Upload failed: ' + err.message, 'error');
  }

  setTimeout(() => { prog.style.display = 'none'; }, 800);
}

// ════════════════════════════════════════════
// LOAD FILES
// ════════════════════════════════════════════
async function loadFiles() {
  if (!supabase) { loadMockFiles(); return; }

  try {
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    allFiles = data || [];
    renderFiles(allFiles);
    updateStats();
  } catch (err) {
    showToast('Could not load files: ' + err.message, 'error');
  }
}

function loadMockFiles() {
  allFiles = [
    { id: '1', name: 'Project_Report.pdf',  size: 2400000, created_at: new Date(Date.now()-86400000).toISOString(), share_token: 'abc123xyz', path: 'demo/1' },
    { id: '2', name: 'Resume_2024.docx',     size: 450000,  created_at: new Date(Date.now()-172800000).toISOString(), share_token: 'def456uvw', path: 'demo/2' },
    { id: '3', name: 'Budget_Q1.xlsx',       size: 980000,  created_at: new Date(Date.now()-259200000).toISOString(), share_token: 'ghi789rst', path: 'demo/3' },
  ];
  renderFiles(allFiles);
  updateStats();
}

// ════════════════════════════════════════════
// RENDER
// ════════════════════════════════════════════
function renderFiles(files) {
  const list = document.getElementById('file-list');

  if (!files.length) {
    list.innerHTML = `<div class="empty-state">
      <span class="empty-icon">📭</span>
      <div class="empty-title">No documents yet</div>
      <div>Upload your first file above</div>
    </div>`;
    return;
  }

  list.innerHTML = files.map(f => `
    <div class="file-card" id="fc-${f.id}">
      <div class="file-type-icon" style="${typeStyle(f.name)}">${typeLabel(f.name)}</div>
      <div class="file-info">
        <div class="file-name">${escHtml(f.name)}</div>
        <div class="file-meta">
          <span>${formatSize(f.size)}</span>
          <span>${formatDate(f.created_at)}</span>
        </div>
      </div>
      <div class="file-actions">
        <button class="icon-btn" title="Download" onclick="downloadFile('${f.id}', '${escAttr(f.path)}', '${escAttr(f.name)}')">⬇️</button>
        <button class="icon-btn" title="Share" onclick="shareFile('${f.id}', '${f.share_token}')">🔗</button>
        <button class="icon-btn del" title="Delete" onclick="deleteFile('${f.id}', '${escAttr(f.path)}')">🗑️</button>
      </div>
    </div>
  `).join('');
}

// ════════════════════════════════════════════
// ACTIONS
// ════════════════════════════════════════════
async function downloadFile(id, path, name) {
  if (!supabase) { showToast('Demo mode — connect Supabase to download', 'info'); return; }
  try {
    const { data, error } = await supabase.storage.from(BUCKET_NAME).download(path);
    if (error) throw error;
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
    showToast('Download started!', 'success');
  } catch (err) {
    showToast('Download failed: ' + err.message, 'error');
  }
}

async function deleteFile(id, path) {
  if (!confirm('Delete this file permanently?')) return;

  if (!supabase) {
    allFiles = allFiles.filter(f => f.id !== id);
    renderFiles(allFiles);
    updateStats();
    showToast('File deleted', 'success');
    return;
  }

  try {
    await supabase.storage.from(BUCKET_NAME).remove([path]);
    await supabase.from('files').delete().eq('id', id);
    allFiles = allFiles.filter(f => f.id !== id);
    renderFiles(allFiles);
    updateStats();
    showToast('File deleted', 'success');
  } catch (err) {
    showToast('Delete failed: ' + err.message, 'error');
  }
}

function shareFile(id, token) {
  const base = window.location.origin + window.location.pathname.replace('index.html','');
  shareCurrentUrl = `${base}share.html?token=${token}`;
  document.getElementById('share-link-text').textContent = shareCurrentUrl;
  document.getElementById('share-modal').classList.add('show');
}

function closeShareModal() {
  document.getElementById('share-modal').classList.remove('show');
}

function copyShareLink() {
  navigator.clipboard.writeText(shareCurrentUrl).then(() => {
    showToast('Link copied to clipboard!', 'success');
    closeShareModal();
  });
}

// ════════════════════════════════════════════
// SEARCH + SORT
// ════════════════════════════════════════════
function filterFiles(query) {
  const q = query.toLowerCase();
  const filtered = allFiles.filter(f => f.name.toLowerCase().includes(q));
  renderFiles(filtered);
}

function sortFiles(mode) {
  currentSort = mode;
  const sorted = [...allFiles];
  if (mode === 'date-desc') sorted.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
  if (mode === 'date-asc')  sorted.sort((a,b) => new Date(a.created_at) - new Date(b.created_at));
  if (mode === 'name-asc')  sorted.sort((a,b) => a.name.localeCompare(b.name));
  if (mode === 'size-desc') sorted.sort((a,b) => b.size - a.size);
  renderFiles(sorted);
}

// ════════════════════════════════════════════
// STATS
// ════════════════════════════════════════════
function updateStats() {
  document.getElementById('stat-count').textContent = allFiles.length;
  const totalBytes = allFiles.reduce((s, f) => s + (f.size || 0), 0);
  document.getElementById('stat-size').textContent = formatSize(totalBytes);
  document.getElementById('stat-shared').textContent = allFiles.filter(f => f.share_token).length;
}

// ════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════
function formatSize(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024*1024) return (bytes/1024).toFixed(1) + ' KB';
  return (bytes/1024/1024).toFixed(1) + ' MB';
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
}

function typeLabel(name) {
  const ext = name.split('.').pop().toLowerCase();
  const map = { pdf:'PDF', doc:'DOC', docx:'DOC', ppt:'PPT', pptx:'PPT', xls:'XLS', xlsx:'XLS',
                png:'IMG', jpg:'IMG', jpeg:'IMG', gif:'IMG', txt:'TXT', zip:'ZIP' };
  return map[ext] || ext.toUpperCase().slice(0,3);
}

function typeStyle(name) {
  const ext = name.split('.').pop().toLowerCase();
  const map = {
    pdf:  'background:rgba(248,113,113,0.15); color:#f87171;',
    doc:  'background:rgba(96,165,250,0.15);  color:#60a5fa;',
    docx: 'background:rgba(96,165,250,0.15);  color:#60a5fa;',
    ppt:  'background:rgba(251,146,60,0.15);  color:#fb923c;',
    pptx: 'background:rgba(251,146,60,0.15);  color:#fb923c;',
    xls:  'background:rgba(52,211,153,0.15);  color:#34d399;',
    xlsx: 'background:rgba(52,211,153,0.15);  color:#34d399;',
    png:  'background:rgba(192,132,252,0.15); color:#c084fc;',
    jpg:  'background:rgba(192,132,252,0.15); color:#c084fc;',
    jpeg: 'background:rgba(192,132,252,0.15); color:#c084fc;',
    txt:  'background:rgba(163,163,163,0.15); color:#a3a3a3;',
  };
  return map[ext] || 'background:rgba(124,92,252,0.15); color:#7c5cfc;';
}

function escHtml(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function escAttr(s) { return s.replace(/'/g,"\\'"); }

function showToast(msg, type='info') {
  const icons = { success:'✅', error:'❌', info:'ℹ️' };
  const div = document.createElement('div');
  div.className = `toast ${type}`;
  div.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`;
  document.getElementById('toast-container').appendChild(div);
  setTimeout(() => { div.style.opacity='0'; div.style.transform='translateX(20px)'; div.style.transition='all 0.3s'; setTimeout(()=>div.remove(),300); }, 3000);
}

// Close modal on overlay click
document.getElementById('share-modal').addEventListener('click', function(e) {
  if (e.target === this) closeShareModal();
});
