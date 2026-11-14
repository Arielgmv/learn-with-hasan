/**
 * PNG to WebP Converter
 * Pure Client-Side Vanilla JavaScript
 */

(function () {
  'use strict';

  // State
  let queue = [];
  let selectedId = null;
  let currentMode = 'lossy'; // 'lossy' | 'lossless'
  let currentQuality = 85;   // 5 to 100
  let isConverting = false;
  let reconvertDebounceTimer = null;

  // DOM Elements
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const modeLossyBtn = document.getElementById('modeLossyBtn');
  const modeLosslessBtn = document.getElementById('modeLosslessBtn');
  const qualitySlider = document.getElementById('qualitySlider');
  const qualityDisplay = document.getElementById('qualityDisplay');
  const qualitySettingItem = document.getElementById('qualitySettingItem');

  const progressBar = document.getElementById('conversionProgressBar');
  const progressText = document.getElementById('progressText');
  const progressPercent = document.getElementById('progressPercent');
  const progressFill = document.getElementById('progressFill');

  const comparisonSection = document.getElementById('comparisonSection');
  const comparisonStatsBadge = document.getElementById('comparisonStatsBadge');
  const originalFileSize = document.getElementById('originalFileSize');
  const convertedFileSize = document.getElementById('convertedFileSize');
  const originalPreviewImg = document.getElementById('originalPreviewImg');
  const convertedPreviewImg = document.getElementById('convertedPreviewImg');
  const originalDimensions = document.getElementById('originalDimensions');
  const convertedDimensions = document.getElementById('convertedDimensions');
  const singleDownloadBtn = document.getElementById('singleDownloadBtn');

  const queueSection = document.getElementById('queueSection');
  const queueCount = document.getElementById('queueCount');
  const queueList = document.getElementById('queueList');
  const totalSavingsBadge = document.getElementById('totalSavingsBadge');
  const downloadAllZipBtn = document.getElementById('downloadAllZipBtn');
  const clearAllBtn = document.getElementById('clearAllBtn');

  // =========================================================================
  // Theme Management
  // =========================================================================
  function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }

    themeToggleBtn.addEventListener('click', () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const nextTheme = isDark ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', nextTheme);
      localStorage.setItem('theme', nextTheme);
    });
  }

  // =========================================================================
  // Utilities
  // =========================================================================
  function formatBytes(bytes, decimals = 1) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  function getWebPFilename(pngName) {
    if (pngName.toLowerCase().endsWith('.png')) {
      return pngName.slice(0, -4) + '.webp';
    }
    return pngName + '.webp';
  }

  // =========================================================================
  // Core Image Conversion (PNG -> WebP via Canvas)
  // =========================================================================
  function convertPngToWebp(file, mode, quality) {
    return new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;

          // Preserve alpha channel for transparent PNGs
          const ctx = canvas.getContext('2d', { alpha: true });
          ctx.drawImage(img, 0, 0);

          // WebP quality parameter: 1.0 for lossless, or decimal (0.05 - 1.0) for lossy
          const qualityParam = mode === 'lossless' ? 1.0 : (quality / 100);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Canvas conversion to WebP returned empty blob.'));
                return;
              }

              const webpUrl = URL.createObjectURL(blob);
              resolve({
                objectUrl,
                width: img.naturalWidth,
                height: img.naturalHeight,
                webpBlob: blob,
                webpUrl,
                webpSize: blob.size,
              });
            },
            'image/webp',
            qualityParam
          );
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Failed to load image file.'));
      };

      img.src = objectUrl;
    });
  }

  // =========================================================================
  // Batch Processing
  // =========================================================================
  async function handleFiles(fileList) {
    const pngFiles = Array.from(fileList).filter((f) => {
      return f.type === 'image/png' || f.name.toLowerCase().endsWith('.png');
    });

    if (pngFiles.length === 0) {
      alert('Please select valid PNG image files.');
      return;
    }

    // Show progress bar
    progressBar.classList.remove('hidden');
    progressFill.style.width = '0%';
    progressText.textContent = `Converting ${pngFiles.length} image(s)...`;
    progressPercent.textContent = '0%';

    let processedCount = 0;

    for (const file of pngFiles) {
      try {
        const itemResult = await convertPngToWebp(file, currentMode, currentQuality);
        const savingsPercent = Math.round(((file.size - itemResult.webpSize) / file.size) * 100);

        const queueItem = {
          id: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
          file,
          name: file.name,
          webpName: getWebPFilename(file.name),
          originalUrl: itemResult.objectUrl,
          originalSize: file.size,
          width: itemResult.width,
          height: itemResult.height,
          webpBlob: itemResult.webpBlob,
          webpUrl: itemResult.webpUrl,
          webpSize: itemResult.webpSize,
          savingsPercent,
        };

        queue.push(queueItem);

        // Auto-select if first item or only item
        if (!selectedId) {
          selectedId = queueItem.id;
        }
      } catch (err) {
        console.error('Error converting file:', file.name, err);
      }

      processedCount++;
      const pct = Math.round((processedCount / pngFiles.length) * 100);
      progressFill.style.width = pct + '%';
      progressPercent.textContent = pct + '%';
    }

    // Hide progress bar after short delay
    setTimeout(() => {
      progressBar.classList.add('hidden');
    }, 400);

    renderQueue();
    renderComparison();
  }

  // =========================================================================
  // Re-convert All Items on Settings Change
  // =========================================================================
  async function reconvertQueue() {
    if (queue.length === 0 || isConverting) return;
    isConverting = true;

    progressBar.classList.remove('hidden');
    progressText.textContent = `Updating WebP with new settings...`;
    progressFill.style.width = '0%';
    progressPercent.textContent = '0%';

    let processedCount = 0;

    for (const item of queue) {
      try {
        // Revoke old WebP URL
        if (item.webpUrl) {
          URL.revokeObjectURL(item.webpUrl);
        }

        const res = await convertPngToWebp(item.file, currentMode, currentQuality);
        // Revoke the temporary extra objectUrl returned for original
        URL.revokeObjectURL(res.objectUrl);

        item.webpBlob = res.webpBlob;
        item.webpUrl = res.webpUrl;
        item.webpSize = res.webpSize;
        item.savingsPercent = Math.round(((item.originalSize - item.webpSize) / item.originalSize) * 100);
      } catch (e) {
        console.error('Re-conversion error for', item.name, e);
      }

      processedCount++;
      const pct = Math.round((processedCount / queue.length) * 100);
      progressFill.style.width = pct + '%';
      progressPercent.textContent = pct + '%';
    }

    setTimeout(() => {
      progressBar.classList.add('hidden');
    }, 300);

    isConverting = false;
    renderQueue();
    renderComparison();
  }

  function scheduleReconversion() {
    clearTimeout(reconvertDebounceTimer);
    reconvertDebounceTimer = setTimeout(() => {
      reconvertQueue();
    }, 250);
  }

  // =========================================================================
  // UI Rendering: Comparison Inspector & Queue
  // =========================================================================
  function renderComparison() {
    const selectedItem = queue.find((i) => i.id === selectedId) || queue[0];

    if (!selectedItem) {
      comparisonSection.classList.add('hidden');
      return;
    }

    comparisonSection.classList.remove('hidden');

    originalPreviewImg.src = selectedItem.originalUrl;
    convertedPreviewImg.src = selectedItem.webpUrl;

    originalFileSize.textContent = formatBytes(selectedItem.originalSize);
    convertedFileSize.textContent = formatBytes(selectedItem.webpSize);

    originalDimensions.textContent = `${selectedItem.width} × ${selectedItem.height} px`;
    convertedDimensions.textContent = `${selectedItem.width} × ${selectedItem.height} px`;

    singleDownloadBtn.href = selectedItem.webpUrl;
    singleDownloadBtn.download = selectedItem.webpName;

    // Badge styling for savings
    const pct = selectedItem.savingsPercent;
    let badgeClass = 'positive';
    let badgeText = `Reduced by ${pct}%`;

    if (pct > 0) {
      badgeClass = 'positive';
      badgeText = `Reduced by ${pct}% (${formatBytes(selectedItem.originalSize - selectedItem.webpSize)} saved)`;
    } else if (pct === 0) {
      badgeClass = 'neutral';
      badgeText = 'Identical size (0%)';
    } else {
      badgeClass = 'negative';
      badgeText = `Increased by ${Math.abs(pct)}%`;
    }

    comparisonStatsBadge.innerHTML = `
      <span class="badge-savings ${badgeClass}">
        ${pct > 0 ? '↓' : '↑'} ${badgeText}
      </span>
    `;
  }

  function renderQueue() {
    if (queue.length === 0) {
      queueSection.classList.add('hidden');
      return;
    }

    queueSection.classList.remove('hidden');
    queueCount.textContent = queue.length;

    // Calculate total savings
    let totalOriginal = 0;
    let totalWebp = 0;
    queue.forEach((item) => {
      totalOriginal += item.originalSize;
      totalWebp += item.webpSize;
    });

    if (totalOriginal > 0) {
      const overallSavedPct = Math.round(((totalOriginal - totalWebp) / totalOriginal) * 100);
      const totalSavedBytes = totalOriginal - totalWebp;
      totalSavingsBadge.classList.remove('hidden');
      totalSavingsBadge.textContent = overallSavedPct >= 0
        ? `Total Saved: ${overallSavedPct}% (${formatBytes(totalSavedBytes)})`
        : `Overall Size Change: +${Math.abs(overallSavedPct)}%`;
    } else {
      totalSavingsBadge.classList.add('hidden');
    }

    // Build queue item elements
    queueList.innerHTML = '';
    queue.forEach((item) => {
      const el = document.createElement('div');
      el.className = 'queue-item' + (item.id === selectedId ? ' active-inspect' : '');
      el.setAttribute('tabindex', '0');
      el.setAttribute('role', 'button');

      const pillClass = item.savingsPercent >= 0 ? 'saved' : 'increased';
      const pillText = item.savingsPercent >= 0 ? `-${item.savingsPercent}%` : `+${Math.abs(item.savingsPercent)}%`;

      el.innerHTML = `
        <div class="queue-item-left">
          <img src="${item.webpUrl}" alt="${item.name}" class="queue-thumbnail checkerboard-bg">
          <div class="queue-meta">
            <span class="queue-filename" title="${item.name}">${item.name}</span>
            <div class="queue-sizes">
              <span>${formatBytes(item.originalSize)}</span>
              <span class="queue-arrow">➔</span>
              <strong>${formatBytes(item.webpSize)} (.webp)</strong>
            </div>
          </div>
        </div>
        <div class="queue-item-right">
          <span class="queue-pill ${pillClass}">${pillText}</span>
          <a href="${item.webpUrl}" download="${item.webpName}" class="btn btn-secondary btn-sm" title="Download WebP" onclick="event.stopPropagation()">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Download
          </a>
          <button type="button" class="btn btn-icon-only remove-item-btn" title="Remove" onclick="event.stopPropagation()">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      `;

      // Select for comparison
      el.addEventListener('click', () => {
        selectedId = item.id;
        renderQueue();
        renderComparison();
      });

      // Remove single item
      const removeBtn = el.querySelector('.remove-item-btn');
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeItem(item.id);
      });

      queueList.appendChild(el);
    });
  }

  function removeItem(id) {
    const index = queue.findIndex((i) => i.id === id);
    if (index !== -1) {
      const [removed] = queue.splice(index, 1);
      URL.revokeObjectURL(removed.originalUrl);
      URL.revokeObjectURL(removed.webpUrl);

      if (selectedId === id) {
        selectedId = queue.length > 0 ? queue[0].id : null;
      }
      renderQueue();
      renderComparison();
    }
  }

  function clearAll() {
    queue.forEach((item) => {
      URL.revokeObjectURL(item.originalUrl);
      URL.revokeObjectURL(item.webpUrl);
    });
    queue = [];
    selectedId = null;
    fileInput.value = '';
    renderQueue();
    renderComparison();
  }

  // =========================================================================
  // Zero-Dependency Client-Side ZIP Generator
  // =========================================================================
  // Creates standard uncompressed (STORE) ZIP archives directly in browser memory
  const CRC32_TABLE = (() => {
    let c;
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      table[n] = c;
    }
    return table;
  })();

  function crc32(uint8Array) {
    let crc = 0 ^ -1;
    for (let i = 0; i < uint8Array.length; i++) {
      crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ uint8Array[i]) & 0xff];
    }
    return (crc ^ -1) >>> 0;
  }

  async function generateZipBlob(files) {
    const encoder = new TextEncoder();
    const localHeaders = [];
    const centralHeaders = [];
    let offset = 0;

    const now = new Date();
    const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (Math.floor(now.getSeconds() / 2));
    const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();

    for (const file of files) {
      const fileNameBytes = encoder.encode(file.name);
      const fileBuffer = await file.blob.arrayBuffer();
      const fileBytes = new Uint8Array(fileBuffer);
      const fileCrc = crc32(fileBytes);
      const size = fileBytes.length;

      // Local File Header (30 bytes + filename)
      const localHeader = new Uint8Array(30 + fileNameBytes.length);
      const lView = new DataView(localHeader.buffer);
      lView.setUint32(0, 0x04034b50, true); // Local header signature
      lView.setUint16(4, 10, true);         // Version needed
      lView.setUint16(6, 0, true);          // General flag
      lView.setUint16(8, 0, true);          // Compression method (0 = Store)
      lView.setUint16(10, dosTime, true);   // Last mod time
      lView.setUint16(12, dosDate, true);   // Last mod date
      lView.setUint32(14, fileCrc, true);   // CRC32
      lView.setUint32(18, size, true);      // Compressed size
      lView.setUint32(22, size, true);      // Uncompressed size
      lView.setUint16(26, fileNameBytes.length, true); // Name length
      lView.setUint16(28, 0, true);         // Extra field length
      localHeader.set(fileNameBytes, 30);

      // Central Directory Header (46 bytes + filename)
      const centralHeader = new Uint8Array(46 + fileNameBytes.length);
      const cView = new DataView(centralHeader.buffer);
      cView.setUint32(0, 0x02014b50, true); // Central header signature
      cView.setUint16(4, 20, true);         // Version made by
      cView.setUint16(6, 10, true);         // Version needed
      cView.setUint16(8, 0, true);          // General flag
      cView.setUint16(10, 0, true);         // Compression method (0 = Store)
      cView.setUint16(12, dosTime, true);   // Last mod time
      cView.setUint16(14, dosDate, true);   // Last mod date
      cView.setUint32(16, fileCrc, true);   // CRC32
      cView.setUint32(20, size, true);      // Compressed size
      cView.setUint32(24, size, true);      // Uncompressed size
      cView.setUint16(28, fileNameBytes.length, true); // Name length
      cView.setUint16(30, 0, true);         // Extra field length
      cView.setUint16(32, 0, true);         // File comment length
      cView.setUint16(34, 0, true);         // Disk number start
      cView.setUint16(36, 0, true);         // Internal attributes
      cView.setUint32(38, 0, true);         // External attributes
      cView.setUint32(42, offset, true);    // Offset of local header
      centralHeader.set(fileNameBytes, 46);

      localHeaders.push(localHeader, fileBytes);
      centralHeaders.push(centralHeader);

      offset += localHeader.length + size;
    }

    const centralStart = offset;
    let centralSize = 0;
    centralHeaders.forEach((h) => {
      centralSize += h.length;
    });

    // End of Central Directory Record (22 bytes)
    const eocd = new Uint8Array(22);
    const eView = new DataView(eocd.buffer);
    eView.setUint32(0, 0x06054b50, true); // EOCD signature
    eView.setUint16(4, 0, true);          // Disk number
    eView.setUint16(6, 0, true);          // Start disk
    eView.setUint16(8, files.length, true);  // Entries on disk
    eView.setUint16(10, files.length, true); // Total entries
    eView.setUint32(12, centralSize, true);  // Central dir size
    eView.setUint32(16, centralStart, true); // Central dir offset
    eView.setUint16(20, 0, true);          // Comment length

    const fullBlobParts = [...localHeaders, ...centralHeaders, eocd];
    return new Blob(fullBlobParts, { type: 'application/zip' });
  }

  async function downloadAllAsZip() {
    if (queue.length === 0) return;

    downloadAllZipBtn.disabled = true;
    const originalText = downloadAllZipBtn.innerHTML;
    downloadAllZipBtn.textContent = 'Creating ZIP...';

    try {
      const filesForZip = queue.map((item) => ({
        name: item.webpName,
        blob: item.webpBlob,
      }));

      const zipBlob = await generateZipBlob(filesForZip);
      const zipUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = zipUrl;
      a.download = `webp-converted-images.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setTimeout(() => URL.revokeObjectURL(zipUrl), 3000);
    } catch (err) {
      console.error('ZIP generation failed:', err);
      alert('Failed to package ZIP archive.');
    } finally {
      downloadAllZipBtn.disabled = false;
      downloadAllZipBtn.innerHTML = originalText;
    }
  }

  // =========================================================================
  // Event Listeners & Setup
  // =========================================================================
  function setupEventListeners() {
    // Mode Toggles
    modeLossyBtn.addEventListener('click', () => {
      if (currentMode === 'lossy') return;
      currentMode = 'lossy';
      modeLossyBtn.classList.add('active');
      modeLosslessBtn.classList.remove('active');
      qualitySettingItem.classList.remove('disabled');
      scheduleReconversion();
    });

    modeLosslessBtn.addEventListener('click', () => {
      if (currentMode === 'lossless') return;
      currentMode = 'lossless';
      modeLosslessBtn.classList.add('active');
      modeLossyBtn.classList.remove('active');
      qualitySettingItem.classList.add('disabled');
      scheduleReconversion();
    });

    // Quality Slider
    qualitySlider.addEventListener('input', (e) => {
      currentQuality = parseInt(e.target.value, 10);
      qualityDisplay.textContent = currentQuality + '%';
      scheduleReconversion();
    });

    // Dropzone Click
    dropZone.addEventListener('click', () => {
      fileInput.click();
    });

    dropZone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        fileInput.click();
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files);
      }
    });

    // Drag and Drop
    ['dragenter', 'dragover'].forEach((eventName) => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach((eventName) => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('dragover');
      });
    });

    dropZone.addEventListener('drop', (e) => {
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    });

    // Global Clipboard Paste Support (Ctrl+V / Cmd+V)
    window.addEventListener('paste', (e) => {
      const items = (e.clipboardData || e.originalEvent.clipboardData).items;
      const pastedFiles = [];

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            // Default file name if pasted from clipboard
            const fileName = `pasted-image-${Date.now()}.png`;
            const file = new File([blob], fileName, { type: 'image/png' });
            pastedFiles.push(file);
          }
        }
      }

      if (pastedFiles.length > 0) {
        handleFiles(pastedFiles);
      }
    });

    // Batch Actions
    downloadAllZipBtn.addEventListener('click', downloadAllAsZip);
    clearAllBtn.addEventListener('click', clearAll);
  }

  // =========================================================================
  // Initialize
  // =========================================================================
  initTheme();
  setupEventListeners();
})();