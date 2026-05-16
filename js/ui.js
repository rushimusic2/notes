// ============================================
// js/ui.js
// UI helper functions — Toast, Format, Colors
// ============================================

// ── Toast Notification (pop-up message) ──
function showToast(message, type = 'info') {
  const icons = {
    success: '✅',
    error:   '❌',
    info:    'ℹ️',
  };

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;

  document.getElementById('toast-container').appendChild(toast);

  // 3 second baad auto-remove
  setTimeout(() => {
    toast.style.opacity   = '0';
    toast.style.transform = 'translateX(20px)';
    toast.style.transition = 'all 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ── File Size Format karna ──
// bytes → "2.4 MB" ya "450 KB"
function formatSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  if (bytes < 1024)              return bytes + ' B';
  if (bytes < 1024 * 1024)      return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

// ── Date Format karna ──
// ISO string → "15 Jan 2025"
function formatDate(isoString) {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-IN', {
    day:   '2-digit',
    month: 'short',
    year:  'numeric',
  });
}

// ── File Extension se Label banana ──
// "report.pdf" → "PDF"
function getTypeLabel(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const map = {
    pdf:  'PDF',
    doc:  'DOC', docx: 'DOC',
    ppt:  'PPT', pptx: 'PPT',
    xls:  'XLS', xlsx: 'XLS',
    png:  'IMG', jpg:  'IMG', jpeg: 'IMG', gif: 'IMG',
    txt:  'TXT',
    zip:  'ZIP',
  };
  return map[ext] || ext.toUpperCase().slice(0, 3);
}

// ── File Extension se Color Style banana ──
// "report.pdf" → red background style
function getTypeStyle(filename) {
  const ext = filename.split('.').pop().toLowerCase();
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
    zip:  'background:rgba(251,191,36,0.15);  color:#fbbf24;',
  };
  return map[ext] || 'background:rgba(124,92,252,0.15); color:#7c5cfc;';
}

// ── HTML Escape (security ke liye) ──
// XSS attack prevent karta hai
function escapeHtml(str) {
  return str
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;');
}

// ── Attribute Escape ──
function escapeAttr(str) {
  return str.replace(/'/g, "\\'");
}

// Modal background click pe close karna
document.getElementById('share-modal').addEventListener('click', function(e) {
  if (e.target === this) closeShareModal();
});