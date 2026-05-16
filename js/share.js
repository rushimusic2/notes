// ============================================
// js/share.js
// Share page ka logic — token se file fetch karna
// ============================================

async function loadSharedFile() {
  const card = document.getElementById('card');

  // URL se token nikalo
  // Example: share.html?token=abc123xyz
  const urlParams = new URLSearchParams(window.location.search);
  const token     = urlParams.get('token');

  // Token nahi mila
  if (!token) {
    card.innerHTML = `
      <span class="logo">🔐 DocVault</span>
      <p class="error-text">❌ Invalid share link</p>`;
    return;
  }

  // Demo mode (Supabase configure nahi hai)
  if (SUPABASE_URL === 'YOUR_SUPABASE_URL') {
    card.innerHTML = `
      <span class="logo">🔐 DocVault</span>
      <span class="file-icon">📄</span>
      <div class="file-name">Demo_Document.pdf</div>
      <div class="file-meta">2.4 MB • Shared via DocVault</div>
      <div class="badge">🔒 Private Shared Link</div>
      <br/>
      <a class="btn-dl" href="#">⬇️ Download File</a>
      <p style="margin-top:20px; font-size:12px; color:#8888aa;">
        Supabase connect karo real downloads ke liye
      </p>`;
    return;
  }

  // Real mode — Supabase se file dhundho
  try {
    const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    // Token se file record dhundho
    const { data: file, error } = await sb
      .from('files')
      .select('*')
      .eq('share_token', token)
      .single();

    if (error || !file) throw new Error('File nahi mili ya link expire ho gaya');

    // File type ka icon
    const ext  = file.name.split('.').pop().toUpperCase();
    const icons = {
      PDF: '📄', DOC: '📝', DOCX: '📝',
      PPT: '📊', PPTX: '📊',
      XLS: '📈', XLSX: '📈',
      PNG: '🖼️', JPG: '🖼️', JPEG: '🖼️',
      ZIP: '🗜️', TXT: '📃',
    };
    const icon = icons[ext] || '📄';

    // Public download URL banao
    const { data: urlData } = sb.storage
      .from(BUCKET_NAME)
      .getPublicUrl(file.path);

    // File size format karo
    const sizeText = formatFileSize(file.size);

    // Card update karo
    card.innerHTML = `
      <span class="logo">🔐 DocVault</span>
      <span class="file-icon">${icon}</span>
      <div class="file-name">${escHtml(file.name)}</div>
      <div class="file-meta">${sizeText} • Shared via DocVault</div>
      <div class="badge">🔒 Private Shared Link</div>
      <br/>
      <a class="btn-dl" href="${urlData.publicUrl}" download="${escHtml(file.name)}">
        ⬇️ Download File
      </a>`;

  } catch (err) {
    card.innerHTML = `
      <span class="logo">🔐 DocVault</span>
      <span style="font-size:40px; display:block; margin-bottom:12px;">😕</span>
      <div class="file-name error-text">File Nahi Mili</div>
      <div class="file-meta" style="margin-top:8px;">${err.message}</div>`;
  }
}

// Helper: size format
function formatFileSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024)         return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

// Helper: HTML escape
function escHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Page load hone par run karo
window.onload = loadSharedFile;