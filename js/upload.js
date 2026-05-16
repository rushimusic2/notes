// ============================================
// js/upload.js
// File upload ka sara code
// ============================================

// Drag & Drop — file drag karne par
function handleDragOver(event) {
  event.preventDefault();
  document.getElementById('upload-zone').classList.add('drag-over');
}

// Drag & Drop — file bahar le jane par
function handleDragLeave() {
  document.getElementById('upload-zone').classList.remove('drag-over');
}

// Drag & Drop — file drop karne par
function handleDrop(event) {
  event.preventDefault();
  document.getElementById('upload-zone').classList.remove('drag-over');

  const files = Array.from(event.dataTransfer.files);
  uploadFiles(files);
}

// File input se files choose karne par
function handleFileSelect(event) {
  const files = Array.from(event.target.files);
  uploadFiles(files);
  event.target.value = ''; // input reset karo
}

// Multiple files upload karna
async function uploadFiles(files) {
  if (!files.length) return;

  for (const file of files) {
    // 50MB se bada nahi hona chahiye
    if (file.size > 50 * 1024 * 1024) {
      showToast(`${file.name} bahut bada hai (max 50MB)`, 'error');
      continue;
    }
    await uploadSingleFile(file);
  }
}

// Ek file upload karna
async function uploadSingleFile(file) {
  // Progress bar elements
  const progressDiv = document.getElementById('upload-progress');
  const bar         = document.getElementById('progress-bar');
  const pct         = document.getElementById('progress-pct');
  const nameEl      = document.getElementById('progress-name');

  // Progress bar dikhao
  progressDiv.style.display = 'block';
  nameEl.textContent = file.name;
  bar.style.width    = '0%';
  pct.textContent    = '0%';

  // Fake progress animation (Supabase mein real progress nahi milta)
  let fakeProgress = 0;
  const progressInterval = setInterval(() => {
    fakeProgress = Math.min(fakeProgress + Math.random() * 15, 85);
    bar.style.width  = fakeProgress + '%';
    pct.textContent  = Math.round(fakeProgress) + '%';
  }, 200);

  try {

    if (!supabase) {
      // ─── DEMO MODE (Supabase nahi hai) ───
      await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5s wait

      clearInterval(progressInterval);
      bar.style.width  = '100%';
      pct.textContent  = '100%';

      // Mock file object banao
      const mockFile = {
        id:         Date.now().toString(),
        name:       file.name,
        size:       file.size,
        created_at: new Date().toISOString(),
        path:       'demo/' + file.name,
        share_token: Math.random().toString(36).slice(2, 12),
      };

      allFiles.unshift(mockFile); // list ke upar add karo
      renderFiles(allFiles);
      updateStats();
      showToast(`${file.name} upload ho gaya!`, 'success');

    } else {
      // ─── REAL MODE (Supabase connected) ───

      // File ka unique path banao: userID/timestamp_filename
      const filePath = `${currentUser.id}/${Date.now()}_${file.name}`;

      // 1. File ko Supabase Storage mein upload karo
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. File ki info database mein save karo
      const shareToken = Math.random().toString(36).slice(2, 12); // unique share link token

      const { error: dbError } = await supabase
        .from('files')
        .insert({
          user_id:     currentUser.id,
          name:        file.name,
          path:        filePath,
          size:        file.size,
          mime_type:   file.type,
          share_token: shareToken,
        });

      if (dbError) throw dbError;

      clearInterval(progressInterval);
      bar.style.width = '100%';
      pct.textContent = '100%';

      showToast(`${file.name} upload ho gaya!`, 'success');
      await loadFiles(); // file list refresh karo
    }

  } catch (err) {
    clearInterval(progressInterval);
    showToast('Upload fail ho gaya: ' + err.message, 'error');
  }

  // 0.8s baad progress bar hide karo
  setTimeout(() => {
    progressDiv.style.display = 'none';
  }, 800);
}