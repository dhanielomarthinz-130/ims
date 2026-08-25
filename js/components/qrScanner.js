/**
 * QR Code & Barcode Scanner Engine
 * Supports:
 * 1. Hardware PDA / Wedge Barcode Scanner (Input listener & Enter key)
 * 2. Device Camera Live Scanner (HTML5 Video Stream + BarcodeDetector / Canvas Reader)
 * 3. Interactive Testing Simulator (Instant 1-Click barcode picker for Staging & Racks)
 */

import { SoundEngine } from '../utils/soundEffects.js';
import { Storage } from '../data/storage.js';

let activeCameraStream = null;
let scanAnimationId = null;

export const QRScanner = {
  /**
   * Opens the Scanner Modal with options for Camera, Manual Input, or Quick Demo Picker
   * @param {Object} options - { title: string, hint: string, filterType: 'ALL'|'STAGING'|'RACK'|'SKU', onScan: Function }
   */
  openScannerModal: function ({ title = 'Scan QR Code / Barcode', hint = 'Arahkan kamera ke QR Code atau gunakan scanner handheld', filterType = 'ALL', onScan }) {
    // Remove existing modal if any
    const existing = document.getElementById('qr-scanner-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'qr-scanner-modal';
    modal.className = 'scanner-modal-overlay';

    // Get suggestions for the simulator tab
    const stockItems = Storage.getStockItems();
    const locations = Storage.getLocations();
    const skus = Storage.getSKUs();

    let quickItems = [];
    if (filterType === 'STAGING') {
      quickItems = stockItems.filter((s) => s.status === 'STAGING').map((s) => ({
        code: s.lpId,
        label: `${s.lpId} - ${s.name} (${s.qty} ${s.unit})`,
        type: 'LP Staging'
      }));
    } else if (filterType === 'RACK') {
      quickItems = locations.filter((l) => l.type === 'RACK').map((l) => ({
        code: l.id,
        label: `Rak ${l.id} (${l.name})`,
        type: 'Lokasi Rak'
      }));
    } else {
      // Mixed
      quickItems = [
        ...stockItems.filter((s) => s.status === 'STAGING').map((s) => ({
          code: s.lpId,
          label: `${s.lpId} - ${s.name}`,
          type: 'Item Staging'
        })),
        ...locations.filter((l) => l.type === 'RACK').slice(0, 6).map((l) => ({
          code: l.id,
          label: `Rak ${l.id} (${l.name})`,
          type: 'Lokasi Rak'
        })),
        ...skus.slice(0, 4).map((s) => ({
          code: s.sku,
          label: `${s.sku} - ${s.name}`,
          type: 'SKU Item'
        }))
      ];
    }

    modal.innerHTML = `
      <div class="scanner-modal-content">
        <div class="scanner-header">
          <div class="scanner-title-group">
            <span class="scanner-icon-pulse"><i class="icon-camera"></i></span>
            <div>
              <h3>${title}</h3>
              <p class="scanner-hint">${hint}</p>
            </div>
          </div>
          <button class="btn-close-scanner" id="btn-close-scanner">✕</button>
        </div>

        <!-- Scanner Mode Tabs -->
        <div class="scanner-tabs">
          <button class="scanner-tab active" data-tab="simulator"><i class="icon-zap"></i> Quick Simulator / Test</button>
          <button class="scanner-tab" data-tab="manual"><i class="icon-keyboard"></i> Manual / HHT Key</button>
          <button class="scanner-tab" data-tab="camera"><i class="icon-video"></i> Live Camera</button>
        </div>

        <!-- Tab 1: Simulator / Quick Selection -->
        <div class="scanner-tab-body active" id="tab-simulator">
          <p class="section-subtext">Pilih salah satu barcode di bawah ini untuk mensimulasikan hasil scan instan:</p>
          <div class="quick-scan-list">
            ${
              quickItems.length > 0
                ? quickItems
                    .map(
                      (it) => `
                <button class="quick-scan-card btn-simulate-scan" data-code="${it.code}">
                  <div class="quick-scan-badge">${it.type}</div>
                  <div class="quick-scan-code">${it.code}</div>
                  <div class="quick-scan-name">${it.label}</div>
                  <span class="scan-arrow">Scan ➔</span>
                </button>
              `
                    )
                    .join('')
                : '<div class="empty-state-mini">Tidak ada item aktif untuk kategori ini.</div>'
            }
          </div>
        </div>

        <!-- Tab 2: Manual / HHT Input -->
        <div class="scanner-tab-body" id="tab-manual">
          <div class="manual-scan-box">
            <label>Masukkan / Scan Kode Barcode / QR:</label>
            <div class="input-with-action">
              <input type="text" id="manual-barcode-input" placeholder="Ketik LP-XXXX, SKU-XXXX, atau Rak A-01-01..." autofocus />
              <button class="btn btn-primary" id="btn-submit-manual-scan">Submit Scan</button>
            </div>
            <p class="input-tip"><i class="icon-info"></i> Jika Anda menggunakan scanner handheld fisik (Zebra/Honeywell), arahkan laser scan langsung ke input ini.</p>
          </div>
        </div>

        <!-- Tab 3: Camera Live Scanner -->
        <div class="scanner-tab-body" id="tab-camera">
          <div class="camera-viewport-wrapper">
            <video id="scanner-video" autoplay playsinline muted></video>
            <div class="laser-scanner-overlay">
              <div class="laser-line"></div>
              <div class="target-corners">
                <span class="c-tl"></span><span class="c-tr"></span>
                <span class="c-bl"></span><span class="c-br"></span>
              </div>
            </div>
          </div>
          <div class="camera-controls">
            <span id="camera-status" class="camera-status-text">Menginisialisasi kamera...</span>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Tab switching
    const tabButtons = modal.querySelectorAll('.scanner-tab');
    const tabBodies = modal.querySelectorAll('.scanner-tab-body');

    tabButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        tabButtons.forEach((b) => b.classList.remove('active'));
        tabBodies.forEach((tb) => tb.classList.remove('active'));
        btn.classList.add('active');

        const tabKey = btn.dataset.tab;
        const targetBody = modal.querySelector(`#tab-${tabKey}`);
        if (targetBody) targetBody.classList.add('active');

        if (tabKey === 'camera') {
          this.startCameraScanner(modal, onScan);
        } else {
          this.stopCameraScanner();
        }

        if (tabKey === 'manual') {
          setTimeout(() => {
            const inp = modal.querySelector('#manual-barcode-input');
            if (inp) inp.focus();
          }, 100);
        }
      });
    });

    // Close action
    const closeBtn = modal.querySelector('#btn-close-scanner');
    const closeModal = () => {
      this.stopCameraScanner();
      modal.remove();
    };
    closeBtn.addEventListener('click', closeModal);

    // Simulator quick scan clicks
    modal.querySelectorAll('.btn-simulate-scan').forEach((btn) => {
      btn.addEventListener('click', () => {
        const code = btn.dataset.code;
        SoundEngine.playScanSuccess();
        closeModal();
        if (onScan) onScan(code);
      });
    });

    // Manual input submit
    const manualInput = modal.querySelector('#manual-barcode-input');
    const submitManualBtn = modal.querySelector('#btn-submit-manual-scan');

    const handleManual = () => {
      const val = (manualInput.value || '').trim();
      if (!val) return;
      SoundEngine.playScanSuccess();
      closeModal();
      if (onScan) onScan(val);
    };

    submitManualBtn.addEventListener('click', handleManual);
    manualInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleManual();
      }
    });
  },

  startCameraScanner: function (modal, onScan) {
    const video = modal.querySelector('#scanner-video');
    const statusText = modal.querySelector('#camera-status');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      if (statusText) statusText.innerText = 'Kamera tidak didukung di browser ini. Gunakan tab Quick Simulator.';
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then((stream) => {
        activeCameraStream = stream;
        video.srcObject = stream;
        if (statusText) statusText.innerText = 'Kamera aktif. Arahkan pada QR Code...';

        // Check if Native BarcodeDetector API is available
        if ('BarcodeDetector' in window) {
          const barcodeDetector = new window.BarcodeDetector({
            formats: ['qr_code', 'code_128', 'ean_13', 'code_39']
          });

          const detectFrame = async () => {
            if (!activeCameraStream) return;
            try {
              const barcodes = await barcodeDetector.detect(video);
              if (barcodes.length > 0) {
                const detectedCode = barcodes[0].rawValue;
                SoundEngine.playScanSuccess();
                this.stopCameraScanner();
                modal.remove();
                if (onScan) onScan(detectedCode);
                return;
              }
            } catch (err) {
              // frame not ready yet
            }
            scanAnimationId = requestAnimationFrame(detectFrame);
          };
          scanAnimationId = requestAnimationFrame(detectFrame);
        } else {
          if (statusText) {
            statusText.innerText = 'Kamera aktif. (Klik tab Quick Simulator untuk testing cepat tanpa kamera).';
          }
        }
      })
      .catch((err) => {
        console.warn('Camera access failed:', err);
        if (statusText) {
          statusText.innerText = 'Izin kamera ditolak atau kamera tidak ditemukan. Gunakan tab Quick Simulator.';
        }
      });
  },

  stopCameraScanner: function () {
    if (activeCameraStream) {
      activeCameraStream.getTracks().forEach((t) => t.stop());
      activeCameraStream = null;
    }
    if (scanAnimationId) {
      cancelAnimationFrame(scanAnimationId);
      scanAnimationId = null;
    }
  }
};
