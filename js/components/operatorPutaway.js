/**
 * Operator Handheld: Putaway Component
 * Workflow: Scan QR Item di Staging -> Rekomendasi Rak -> Scan QR Rak Gudang -> Konfirmasi Perpindahan Stok
 */

import { Storage } from '../data/storage.js';
import { QRScanner } from './qrScanner.js';
import { SoundEngine } from '../utils/soundEffects.js';
import { Formatters } from '../utils/formatters.js';
import { QRCodeGenerator } from '../utils/qrLib.js';

export const OperatorPutaway = {
  activeItem: null,
  suggestedRack: null,
  targetRack: null,

  render: function (container, params = {}) {
    this.activeItem = null;
    this.suggestedRack = null;
    this.targetRack = null;

    const stagingCount = Storage.getStockItems().filter((s) => s.status === 'STAGING').length;

    container.innerHTML = `
      <div class="hht-view-container">
        <!-- Top Header -->
        <div class="hht-card-header">
          <div>
            <span class="hht-badge-step"><i class="icon-arrow-right-circle"></i> WORKFLOW PUTAWAY</span>
            <h2 class="hht-title">Putaway Barang ke Rak</h2>
          </div>
          <span class="badge badge-warning" id="putaway-pending-count">${stagingCount} Menunggu</span>
        </div>

        <!-- Interactive 2-Step Stepper -->
        <div class="putaway-stepper">
          <div class="step-badge active" id="step-badge-1">
            <span class="step-num">1</span>
            <span class="step-text">Scan QR Pallet / Item</span>
          </div>
          <div class="step-divider">➔</div>
          <div class="step-badge" id="step-badge-2">
            <span class="step-num">2</span>
            <span class="step-text">Scan QR Rak Tujuan</span>
          </div>
        </div>

        <!-- Dynamic Putaway Content Area -->
        <div id="putaway-workflow-body">
          ${this.renderStep1InitialHTML()}
        </div>

        <!-- Quick List of Staging Items to Pick / Putaway -->
        <div class="hht-staging-summary mt-4">
          <div class="summary-header">
            <h4><i class="icon-package"></i> Antrian Barang di Staging (Siap Dipindahkan)</h4>
          </div>
          <div id="putaway-queue-list" class="mini-staging-list"></div>
        </div>
      </div>
    `;

    this.attachInitialEvents(container);
    this.renderQueueList(container);

    // Auto-scan if navigated from Inbound
    if (params && params.autoScanLP) {
      setTimeout(() => {
        this.processScannedLP(params.autoScanLP, container);
      }, 100);
    }
  },

  renderStep1InitialHTML: function () {
    return `
      <div class="putaway-scan-card">
        <div class="scan-prompt-box">
          <div class="scan-visual-pulse">
            <i class="icon-qr-code"></i>
          </div>
          <h3>Langkah 1: Scan QR Code Barang / Pallet</h3>
          <p class="scan-desc">Arahkan scanner handheld atau kamera ke label QR Code License Plate (LP-XXXX) barang di Staging.</p>
          
          <div class="scan-action-buttons">
            <button class="btn btn-primary btn-lg btn-block" id="btn-start-scan-item">
              <i class="icon-camera"></i> Buka Scanner / Pilih Item
            </button>
          </div>
        </div>
      </div>
    `;
  },

  attachInitialEvents: function (container) {
    const btnScan = container.querySelector('#btn-start-scan-item');
    if (btnScan) {
      btnScan.addEventListener('click', () => {
        QRScanner.openScannerModal({
          title: 'Scan QR Code Item di Staging',
          hint: 'Pilih atau scan barcode License Plate (LP-XXXX) barang yang baru masuk',
          filterType: 'STAGING',
          onScan: (code) => {
            this.processScannedLP(code, container);
          }
        });
      });
    }
  },

  processScannedLP: function (code, container) {
    // Look up in stock database
    const stock = Storage.getStockItems();
    const cleanCode = (code || '').trim();

    const item = stock.find(
      (s) => s.lpId.toLowerCase() === cleanCode.toLowerCase() || s.sku.toLowerCase() === cleanCode.toLowerCase()
    );

    if (!item) {
      SoundEngine.playErrorBuzzer();
      alert(`Kode "${cleanCode}" tidak ditemukan dalam daftar inventori.`);
      return;
    }

    if (item.status !== 'STAGING') {
      SoundEngine.playErrorBuzzer();
      alert(`Barang ${item.lpId} (${item.name}) sudah berada di Rak ${item.location}. Gunakan menu Check Stock atau Relokasi.`);
      return;
    }

    // Found valid staging item!
    this.activeItem = item;
    this.suggestedRack = Storage.calculateSuggestedRack(item.sku);
    this.targetRack = null;

    SoundEngine.playScanSuccess();
    this.renderStep2RackScan(container);
  },

  renderStep2RackScan: function (container) {
    const workflowBody = container.querySelector('#putaway-workflow-body');
    const step1Badge = container.querySelector('#step-badge-1');
    const step2Badge = container.querySelector('#step-badge-2');

    if (step1Badge) {
      step1Badge.className = 'step-badge completed';
      step1Badge.innerHTML = `<span class="step-num">✓</span> <span class="step-text">${this.activeItem.lpId}</span>`;
    }
    if (step2Badge) {
      step2Badge.className = 'step-badge active';
    }

    const expStatus = Formatters.getExpiryStatus(this.activeItem.expDate);
    const suggestedLocInfo = Storage.getLocation(this.suggestedRack) || { name: 'Rak Standar' };

    workflowBody.innerHTML = `
      <div class="putaway-active-card">
        <!-- Item Scanned Summary -->
        <div class="scanned-item-banner">
          <div class="banner-top">
            <span class="badge badge-staging"><i class="icon-map-pin"></i> Asal: ${this.activeItem.location}</span>
            <span class="badge ${expStatus.colorClass}">${expStatus.label}</span>
          </div>
          <h3 class="banner-item-title">${this.activeItem.name}</h3>
          
          <div class="item-detail-grid">
            <div class="detail-cell">
              <span class="detail-label">LICENSE PLATE</span>
              <strong class="detail-val highlight-blue">${this.activeItem.lpId}</strong>
            </div>
            <div class="detail-cell">
              <span class="detail-label">SKU CODE</span>
              <strong class="detail-val">${this.activeItem.sku}</strong>
            </div>
            <div class="detail-cell">
              <span class="detail-label">BATCH / LOT</span>
              <strong class="detail-val">${this.activeItem.batchNo}</strong>
            </div>
            <div class="detail-cell">
              <span class="detail-label">EXP DATE</span>
              <strong class="detail-val">${this.activeItem.expDate}</strong>
            </div>
            <div class="detail-cell">
              <span class="detail-label">JUMLAH (QTY)</span>
              <strong class="detail-val text-success">${this.activeItem.qty} ${this.activeItem.unit}</strong>
            </div>
          </div>
        </div>

        <!-- Suggested Rack Card -->
        <div class="suggested-rack-box">
          <div class="suggestion-header">
            <span class="icon-sparkles"><i class="icon-compass"></i></span>
            <div>
              <span class="suggestion-title">Rekomendasi Rak Penyimpanan Sistem:</span>
              <div class="suggested-rack-name">
                <strong>Rak ${this.suggestedRack}</strong> (${suggestedLocInfo.name})
              </div>
            </div>
          </div>
          <div class="suggestion-sub">Ditentukan otomatis berdasarkan kategori barang (${this.activeItem.category}) dan ketersediaan kapasitas rak.</div>
        </div>

        <!-- Target Rack Input & Scan Area -->
        <div class="target-rack-section">
          <label class="rack-input-label">
            <i class="icon-target"></i> Scan / Pilih Barcode Lokasi Rak Tujuan:
          </label>

          <div class="rack-scan-interactive-box" id="rack-scan-container">
            ${
              this.targetRack
                ? `
                <div class="rack-confirmed-pill ${this.targetRack === this.suggestedRack ? 'match' : 'alternative'}">
                  <span class="pill-icon"><i class="icon-check"></i></span>
                  <div>
                    <span class="pill-label">${this.targetRack === this.suggestedRack ? 'Rak Sesuai Rekomendasi' : 'Rak Alternatif Pilihan Operator'}</span>
                    <strong class="pill-code">Rak ${this.targetRack}</strong>
                  </div>
                  <button class="btn btn-xs btn-ghost" id="btn-change-rack">Ubah</button>
                </div>
              `
                : `
                <button class="btn btn-secondary btn-lg btn-block" id="btn-scan-rack-loc">
                  <i class="icon-camera"></i> Scan Barcode QR Lokasi Rak
                </button>
              `
            }
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="putaway-action-footer">
          <button class="btn btn-outline" id="btn-cancel-putaway">
            <i class="icon-x"></i> Batalkan
          </button>
          <button class="btn btn-primary btn-lg" id="btn-confirm-putaway" ${!this.targetRack ? 'disabled' : ''}>
            <i class="icon-check-circle"></i> Konfirmasi Putaway & Simpan
          </button>
        </div>
      </div>
    `;

    this.attachStep2Events(container);
  },

  attachStep2Events: function (container) {
    const btnScanRack = container.querySelector('#btn-scan-rack-loc');
    const btnChangeRack = container.querySelector('#btn-change-rack');
    const btnCancel = container.querySelector('#btn-cancel-putaway');
    const btnConfirm = container.querySelector('#btn-confirm-putaway');

    const handleRackScanTrigger = () => {
      QRScanner.openScannerModal({
        title: 'Scan Barcode QR Lokasi Rak',
        hint: `Arahkan ke label barcode pada tiang Rak Gudang (Contoh: Rak ${this.suggestedRack})`,
        filterType: 'RACK',
        onScan: (code) => {
          this.processScannedRack(code, container);
        }
      });
    };

    if (btnScanRack) btnScanRack.addEventListener('click', handleRackScanTrigger);
    if (btnChangeRack) btnChangeRack.addEventListener('click', handleRackScanTrigger);

    if (btnCancel) {
      btnCancel.addEventListener('click', () => {
        this.activeItem = null;
        this.render(container);
      });
    }

    if (btnConfirm) {
      btnConfirm.addEventListener('click', () => {
        if (!this.targetRack) {
          alert('Silakan scan lokasi rak tujuan terlebih dahulu.');
          return;
        }
        this.executePutawayMovement(container);
      });
    }
  },

  processScannedRack: function (code, container) {
    // Validate rack
    let cleanCode = (code || '').trim().toUpperCase();
    if (cleanCode.startsWith('LOC-')) {
      cleanCode = cleanCode.replace('LOC-', '');
    }

    const loc = Storage.getLocation(cleanCode);
    if (!loc) {
      SoundEngine.playErrorBuzzer();
      alert(`Lokasi Rak "${cleanCode}" tidak ditemukan dalam Master Data Gudang.`);
      return;
    }

    if (loc.type === 'STAGING') {
      SoundEngine.playErrorBuzzer();
      alert(`Lokasi ${loc.id} adalah area Staging. Putaway harus ditujukan ke Rak Gudang (Zone A, B, C, atau D).`);
      return;
    }

    this.targetRack = loc.id;
    SoundEngine.playScanSuccess();
    this.renderStep2RackScan(container);
  },

  executePutawayMovement: function (container) {
    const res = Storage.executePutaway({
      lpId: this.activeItem.lpId,
      targetLocationId: this.targetRack,
      operator: 'Budi Santoso (HHT-01)',
      notes: `Putaway via Barcode Scan ke ${this.targetRack}`
    });

    if (!res.success) {
      SoundEngine.playErrorBuzzer();
      alert(res.message);
      return;
    }

    SoundEngine.playPutawayComplete();
    this.renderSuccessScreen(container, res);
  },

  renderSuccessScreen: function (container, result) {
    const workflowBody = container.querySelector('#putaway-workflow-body');
    const { stockItem, log } = result;

    workflowBody.innerHTML = `
      <div class="putaway-success-card">
        <div class="success-animation-icon">
          <i class="icon-check"></i>
        </div>
        <h2 class="success-title">Putaway Selesai & Sukses!</h2>
        <p class="success-msg">Stok barang telah resmi dipindahkan dari Staging ke Rak Gudang.</p>

        <div class="movement-receipt-box">
          <div class="receipt-row">
            <span>Nomor Movement / Audit:</span>
            <strong>${log.id}</strong>
          </div>
          <div class="receipt-row">
            <span>Barang:</span>
            <strong>${stockItem.name}</strong>
          </div>
          <div class="receipt-row">
            <span>SKU / LP:</span>
            <strong>${stockItem.sku} | ${stockItem.lpId}</strong>
          </div>
          <div class="receipt-row">
            <span>Batch / Exp Date:</span>
            <strong>${stockItem.batchNo} | ${stockItem.expDate}</strong>
          </div>
          <div class="receipt-row">
            <span>Kuantitas:</span>
            <strong class="text-success">${stockItem.qty} ${stockItem.unit}</strong>
          </div>
          <div class="receipt-row-highlight">
            <div class="transfer-from">
              <span class="tf-label">DARI</span>
              <span class="tf-val">${log.fromLocation}</span>
            </div>
            <span class="tf-arrow">➔</span>
            <div class="transfer-to">
              <span class="tf-label">KE LOKASI RAK</span>
              <span class="tf-val text-primary">Rak ${log.toLocation}</span>
            </div>
          </div>
        </div>

        <div class="success-actions">
          <button class="btn btn-primary btn-lg btn-block" id="btn-next-putaway">
            <i class="icon-refresh"></i> Putaway Barang Berikutnya
          </button>
        </div>
      </div>
    `;

    container.querySelector('#btn-next-putaway').addEventListener('click', () => {
      this.render(container);
    });

    this.renderQueueList(container);
  },

  renderQueueList: function (container) {
    const stock = Storage.getStockItems();
    const stagingItems = stock.filter((s) => s.status === 'STAGING');
    const queueList = container.querySelector('#putaway-queue-list');
    const pendingBadge = container.querySelector('#putaway-pending-count');

    if (pendingBadge) pendingBadge.innerText = `${stagingItems.length} Menunggu`;
    if (!queueList) return;

    if (stagingItems.length === 0) {
      queueList.innerHTML = `<div class="empty-state-mini"><i class="icon-check-circle"></i> Semua barang di staging sudah selesai di-putaway ke rak!</div>`;
      return;
    }

    queueList.innerHTML = stagingItems
      .map((it) => {
        const suggested = Storage.calculateSuggestedRack(it.sku);
        return `
        <div class="queue-item-card">
          <div class="queue-left">
            <span class="lp-tag">${it.lpId}</span>
            <div class="queue-name">${it.name}</div>
            <div class="queue-meta">
              <span>SKU: ${it.sku}</span> | <span>Batch: ${it.batchNo}</span> | <strong>${it.qty} ${it.unit}</strong>
            </div>
          </div>
          <div class="queue-right">
            <span class="sugg-badge">Saran: Rak ${suggested}</span>
            <button class="btn btn-sm btn-primary btn-pick-putaway" data-lpid="${it.lpId}">
              Pilih ➔
            </button>
          </div>
        </div>
      `;
      })
      .join('');

    queueList.querySelectorAll('.btn-pick-putaway').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.processScannedLP(btn.dataset.lpid, container);
      });
    });
  }
};
