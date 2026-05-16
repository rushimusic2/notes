// ============================================
// js/files.js
// Files load karna, dikhana, download, delete, share
// ============================================

let allFiles = []; // saari files yahan store hongi

// ── Files Supabase se load karna ──
async function loadFiles() {
  if (!supabase) {
    loadDemoFiles(); // Supabase nahi hai toh demo files
    return;
  }

  try {
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .eq('user_id', currentUser.id)       // sirf meri files
      .order('created_at', { ascending: false }); // newest first

    if (error) throw error;

    allFiles = data || [];
    renderFiles(allFiles);
    updateStats();

  } catch (err) {
    showToast('Files load nahi huyi: ' + err.message, 'error');
  }
}

// ── Demo files (Supabase ke bina preview ke liye) ──
function loadDemoFiles() {
  allFiles = [
    { id: '1', name: 'Project_Report.pdf',  size: 2400000, created_at: new Date(Date.now() - 86400000).toISOString(),  share_token: 'abc123' },
    { id: '2', name: 'Resume_2024.docx',    size:  450000, created_at: new Date(Date.now() - 172800000).toISOString(), share_token: 'def456' },
    { id: '3', name: 'Budget_Q1.xlsx',      size:  980000, created_at: new Date(Date.now() - 259200000).toISOString(), share_token: 'ghi789' },
  ];
  renderFiles(allFiles);
  updateStats();
}

// ── File Cards HTML banao aur dikhao ──
function renderFiles(files) {
  const listEl = document.getElementById('file-list');

  if (!files.length) {
    listEl.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">📭</span>
        <div class="empty-title">Koi file nahi hai</div>
        <div>Upar se pehli file upload karo</div>
      </div>`;
    return;
  }

  listEl.innerHTML = files.map(file => `
    <div class="file-card" id="fc-${file.id}">

      <!-- File Type Icon (colored) -->
      <div class="file-type-icon" style="${getTypeStyle(file.name)}">
        ${getTypeLabel(file.name)}
      </div>

      <!-- File Info -->
      <div class="file-info">
        <div class="file-name">${escapeHtml(file.name)}</div>
        <div class="file-meta">
          <span>${formatSize(file.size)}</span>
          <span>${formatDate(file.created_at)}</span>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="file-actions">
        <button class="icon-btn" title="Download"
          onclick="downloadFile('${file.id}', '${escapeAttr(file.path)}', '${escapeAttr(file.name)}')">
          ⬇️
        </button>
        <button class="icon-btn" title="Share Link"
          onclick="shareFile('${file.share_token}')">
          🔗
        </button>
        <button class="icon-btn del" title="Delete"
          onclick="deleteFile('${file.id}', '${escapeAttr(file.path)}')">
          🗑️
        </button>
      </div>

    </div>
  `).join('');
}

// ── File Download ──
async function downloadFile(id, path, name) {
  if (!supabase) {
    showToast('Demo mode mein download nahi hoga — Supabase connect karo', 'info');
    return;
  }

  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .download(path);

    if (error) throw error;

    // Blob se download link banao
    const url     = URL.createObjectURL(data);
    const link    = document.createElement('a');
    link.href     = url;
    link.download = name;
    link.click();
    URL.revokeObjectURL(url);

    showToast('Download shuru ho gaya!', 'success');

  } catch (err) {
    showToast('Download fail: ' + err.message, 'error');
  }
}

// ── File Delete ──
async function deleteFile(id, path) {
  if (!confirm('Ye file hamesha ke liye delete ho jayegi. Sure ho?')) return;

  if (!supabase) {
    // Demo mode
    allFiles = allFiles.filter(f => f.id !== id);
    renderFiles(allFiles);
    updateStats();
    showToast('File delete ho gayi', 'success');
    return;
  }

  try {
    // Storage se file hatao
    await supabase.storage.from(BUCKET_NAME).remove([path]);

    // Database se record hatao
    await supabase.from('files').delete().eq('id', id);

    // Local list se bhi hatao
    allFiles = allFiles.filter(f => f.id !== id);
    renderFiles(allFiles);
    updateStats();
    showToast('File delete ho gayi', 'success');

  } catch (err) {
    showToast('Delete fail: ' + err.message, 'error');
  }
}

// ── Share Modal open karna ──
let currentShareUrl = '';

function shareFile(token) {
  const base = window.location.origin + window.location.pathname.replace('index.html', '');
  currentShareUrl = `${base}share.html?token=${token}`;

  document.getElementById('share-link-text').textContent = currentShareUrl;
  document.getElementById('share-modal').classList.add('show');
}

function closeShareModal() {
  document.getElementById('share-modal').classList.remove('show');
}

function copyShareLink() {
  navigator.clipboard.writeText(currentShareUrl).then(() => {
    showToast('Link copy ho gaya!', 'success');
    closeShareModal();
  });
}

// ── Search ──
function filterFiles(query) {
  const q      = query.toLowerCase();
  const result = allFiles.filter(f => f.name.toLowerCase().includes(q));
  renderFiles(result);
}

// ── Sort ──
function sortFiles(mode) {
  const sorted = [...allFiles];

  if (mode === 'date-desc') sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  if (mode === 'date-asc')  sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  if (mode === 'name-asc')  sorted.sort((a, b) => a.name.localeCompare(b.name));
  if (mode === 'size-desc') sorted.sort((a, b) => b.size - a.size);

  renderFiles(sorted);
}

// ── Stats Update ──
function updateStats() {
  document.getElementById('stat-count').textContent  = allFiles.length;

  const totalBytes = allFiles.reduce((sum, f) => sum + (f.size || 0), 0);
  document.getElementById('stat-size').textContent   = formatSize(totalBytes);

  const sharedCount = allFiles.filter(f => f.share_token).length;
  document.getElementById('stat-shared').textContent = sharedCount;
}