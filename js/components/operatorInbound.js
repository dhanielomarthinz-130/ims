/**
 * Operator Handheld: Inbound Staging Component
 * Form input penerimaan barang dari Handheld -> Generate Dokumen Inbound & Cetak Label QR Code
 */

import { Storage } from '../data/storage.js';
import { QRCodeGenerator } from '../utils/qrLib.js';
import { SoundEngine } from '../utils/soundEffects.js';
import { Formatters } from '../utils/formatters.js';

export const OperatorInbound = {
  render: function (container) {
    const skus = Storage.getSKUs();
    const locations = Storage.getLocations().filter((l) => l.type === 'STAGING');

    const todayStr = new Date().toISOString().slice(0, 10);
    const defaultBatch = `BATCH-${todayStr.replace(/-/g, '')}-A`;

    // Default Exp Date 1 year from now
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const defaultExp = nextYear.toISOString().slice(0, 10);

    container.innerHTML = `
      <div class="hht-view-container">
        <!-- HHT Header / Topbar -->
        <div class="hht-card-header">
          <div>
            <span class="hht-badge-step">PINTU PENERIMAAN / STAGING</span>
            <h2 class="hht-title">Inbound Staging Baru</h2>
          </div>
          <button class="btn btn-sm btn-ghost" id="btn-reset-inbound-form" title="Bersihkan Form">
            <i class="icon-refresh"></i> Reset
          </button>
        </div>

        <form id="hht-inbound-form" class="hht-form">
          <!-- Step 1: Informasi Penerimaan -->
          <div class="hht-section">
            <div class="hht-section-title"><i class="icon-file-text"></i> 1. Info Dokumen & Supplier</div>
            
            <div class="form-group-grid">
              <div class="form-group">
                <label>Nomor PO / Surat Jalan</label>
                <input type="text" id="inb-po-no" class="hht-input" placeholder="PO-2026-..." value="PO-${todayStr.replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}" required />
              </div>

              <div class="form-group">
                <label>Nama Supplier / Pengirim</label>
                <input type="text" id="inb-supplier" class="hht-input" placeholder="Nama PT / Distributor..." value="PT Mitra Sejahtera Utama" required />
              </div>
            </div>

            <div class="form-group">
              <label>Lokasi Area Staging Penerimaan</label>
              <select id="inb-staging-loc" class="hht-input hht-select">
                ${locations.map((loc) => `<option value="${loc.id}">${loc.id} - ${loc.name}</option>`).join('')}
              </select>
            </div>
          </div>

          <!-- Step 2: Rincian Barang & Batch -->
          <div class="hht-section">
            <div class="hht-section-title"><i class="icon-box"></i> 2. Rincian Barang & Batch (SKU)</div>

            <div class="form-group">
              <label>Pilih SKU Barang</label>
              <select id="inb-sku-select" class="hht-input hht-select" required>
                <option value="">-- Pilih SKU Barang --</option>
                ${skus.map((s) => `<option value="${s.sku}" data-unit="${s.unit}" data-name="${s.name}" data-cat="${s.category}">${s.sku} | ${s.name}</option>`).join('')}
              </select>
            </div>

            <div class="form-group">
              <label>Nama Barang</label>
              <input type="text" id="inb-item-name" class="hht-input" readonly placeholder="Terisi otomatis dari SKU..." />
            </div>

            <div class="form-group-grid">
              <div class="form-group">
                <label>Nomor Batch / Lot</label>
                <input type="text" id="inb-batch-no" class="hht-input" value="${defaultBatch}" required />
              </div>

              <div class="form-group">
                <label>Tanggal Kedaluwarsa (Exp Date)</label>
                <input type="date" id="inb-exp-date" class="hht-input" value="${defaultExp}" required />
                <div class="exp-preset-chips">
                  <button type="button" class="chip-btn" data-months="6">+6 Bln</button>
                  <button type="button" class="chip-btn" data-months="12">+1 Thn</button>
                  <button type="button" class="chip-btn" data-months="24">+2 Thn</button>
                </div>
              </div>
            </div>

            <div class="form-group-grid">
              <div class="form-group">
                <label>Jumlah Diterima (Qty)</label>
                <input type="number" id="inb-qty" class="hht-input hht-qty-input" min="1" max="99999" value="50" required />
              </div>

              <div class="form-group">
                <label>Satuan Unit</label>
                <input type="text" id="inb-unit" class="hht-input" value="BOX" readonly />
              </div>
            </div>
          </div>

          <!-- Operator Info -->
          <div class="hht-section-compact">
            <div class="operator-meta">
              <span><i class="icon-user"></i> Operator: <strong>Budi Handheld (HHT-01)</strong></span>
              <span><i class="icon-calendar"></i> Waktu: <strong>${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</strong></span>
            </div>
          </div>

          <!-- Submit Button -->
          <div class="hht-action-bar">
            <button type="submit" class="btn btn-primary btn-lg btn-block" id="btn-save-inbound">
              <i class="icon-printer"></i> Simpan & Buat Label QR Code
            </button>
          </div>
        </form>

        <!-- Quick Summary of Today's Staging Items -->
        <div class="hht-staging-summary">
          <div class="summary-header">
            <h4><i class="icon-layers"></i> Barang Menunggu Putaway di Staging</h4>
            <span class="badge badge-warning" id="staging-count-badge">0 Item</span>
          </div>
          <div id="staging-items-mini-list" class="mini-staging-list"></div>
        </div>
      </div>
    `;

    this.attachEvents(container);
    this.renderStagingMiniList(container);
  },

  attachEvents: function (container) {
    const skuSelect = container.querySelector('#inb-sku-select');
    const nameInput = container.querySelector('#inb-item-name');
    const unitInput = container.querySelector('#inb-unit');
    const form = container.querySelector('#hht-inbound-form');

    // Auto fill SKU info
    skuSelect.addEventListener('change', () => {
      const selected = skuSelect.options[skuSelect.selectedIndex];
      if (selected && selected.value) {
        nameInput.value = selected.dataset.name || '';
        unitInput.value = selected.dataset.unit || 'BOX';
      } else {
        nameInput.value = '';
        unitInput.value = 'BOX';
      }
    });

    // Preset Exp date chips
    container.querySelectorAll('.chip-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const months = parseInt(btn.dataset.months, 10);
        const d = new Date();
        d.setMonth(d.getMonth() + months);
        container.querySelector('#inb-exp-date').value = d.toISOString().slice(0, 10);
      });
    });

    // Form submit
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const skuCode = skuSelect.value;
      if (!skuCode) {
        alert('Silakan pilih SKU barang terlebih dahulu.');
        return;
      }

      const selectedOpt = skuSelect.options[skuSelect.selectedIndex];
      const poNo = container.querySelector('#inb-po-no').value;
      const supplier = container.querySelector('#inb-supplier').value;
      const stagingLoc = container.querySelector('#inb-staging-loc').value;
      const batchNo = container.querySelector('#inb-batch-no').value;
      const expDate = container.querySelector('#inb-exp-date').value;
      const qty = parseInt(container.querySelector('#inb-qty').value, 10);
      const unit = container.querySelector('#inb-unit').value;
      const name = selectedOpt.dataset.name;
      const category = selectedOpt.dataset.cat;

      const docData = {
        poNo,
        supplier,
        stagingLocation: stagingLoc,
        operator: 'Operator Handheld (HHT-01)',
        items: [
          {
            sku: skuCode,
            name: name,
            category: category,
            batchNo: batchNo,
            expDate: expDate,
            qty: qty,
            unit: unit
          }
        ]
      };

      const createdDoc = Storage.createInboundDocument(docData);
      SoundEngine.playScanSuccess();

      // Show Print QR Label Modal
      const createdItem = createdDoc.items[0];
      this.showQRLabelModal(createdDoc, createdItem);

      // Re-render mini list
      this.renderStagingMiniList(container);

      // Reset SKU specific fields
      skuSelect.value = '';
      nameInput.value = '';
      container.querySelector('#inb-qty').value = '50';
    });

    // Reset button
    container.querySelector('#btn-reset-inbound-form').addEventListener('click', () => {
      form.reset();
    });
  },

  renderStagingMiniList: function (container) {
    const stock = Storage.getStockItems();
    const stagingItems = stock.filter((s) => s.status === 'STAGING');
    const badge = container.querySelector('#staging-count-badge');
    const listContainer = container.querySelector('#staging-items-mini-list');

    if (badge) badge.innerText = `${stagingItems.length} Pallet / Lot`;
    if (!listContainer) return;

    if (stagingItems.length === 0) {
      listContainer.innerHTML = `<div class="empty-state-mini">Tidak ada barang di staging. Semua sudah di-putaway ke rak!</div>`;
      return;
    }

    listContainer.innerHTML = stagingItems
      .map((it) => {
        const expStatus = Formatters.getExpiryStatus(it.expDate);
        return `
        <div class="staging-mini-card">
          <div class="staging-mini-header">
            <span class="lp-tag"><i class="icon-tag"></i> ${it.lpId}</span>
            <span class="badge ${expStatus.colorClass}">${expStatus.label}</span>
          </div>
          <div class="staging-mini-body">
            <div class="staging-mini-title">${it.name}</div>
            <div class="staging-mini-meta">
              <span>SKU: <strong>${it.sku}</strong></span>
              <span>Batch: <strong>${it.batchNo}</strong></span>
              <span>Qty: <strong>${it.qty} ${it.unit}</strong></span>
              <span>Lokasi: <strong>${it.location}</strong></span>
            </div>
          </div>
          <div class="staging-mini-footer">
            <button class="btn btn-xs btn-outline btn-print-mini-qr" data-lpid="${it.lpId}">
              <i class="icon-printer"></i> Cetak QR
            </button>
            <button class="btn btn-xs btn-primary btn-putaway-shortcut" data-lpid="${it.lpId}">
              Putaway Sekarang ➔
            </button>
          </div>
        </div>
      `;
      })
      .join('');

    // Print QR on mini card
    listContainer.querySelectorAll('.btn-print-mini-qr').forEach((btn) => {
      btn.addEventListener('click', () => {
        const lpId = btn.dataset.lpid;
        const item = stock.find((s) => s.lpId === lpId);
        if (item) {
          const doc = Storage.getInboundDoc(item.inboundDocNo) || { docNo: 'INB-CURRENT', supplier: 'Inbound Supplier', poNo: 'PO-DEMO' };
          this.showQRLabelModal(doc, item);
        }
      });
    });

    // Shortcut to Putaway
    listContainer.querySelectorAll('.btn-putaway-shortcut').forEach((btn) => {
      btn.addEventListener('click', () => {
        const lpId = btn.dataset.lpid;
        window.navigateTo('operator-putaway', { autoScanLP: lpId });
      });
    });
  },

  /**
   * Shows the QR Code Label Modal ready for thermal printing or A4 printing
   */
  showQRLabelModal: function (doc, item) {
    const existing = document.getElementById('qr-label-modal');
    if (existing) existing.remove();

    const qrDataUrl = QRCodeGenerator.generateDataURL(item.lpId, { size: 240 });
    const barcodeDataUrl = QRCodeGenerator.generateBarcodeDataURL(item.sku, { width: 280, height: 50 });
    const expStatus = Formatters.getExpiryStatus(item.expDate);

    const modal = document.createElement('div');
    modal.id = 'qr-label-modal';
    modal.className = 'modal-overlay active';

    modal.innerHTML = `
      <div class="modal-card print-preview-modal">
        <div class="modal-header">
          <div>
            <span class="badge badge-success"><i class="icon-check"></i> Dokumen & Label Terbentuk</span>
            <h3>Label QR Code Pallet / Inbound</h3>
          </div>
          <button class="btn-close" id="btn-close-label-modal">✕</button>
        </div>

        <div class="modal-body">
          <!-- The Physical Printable Thermal Label (100x75mm or 50x30mm) -->
          <div class="printable-label-wrapper" id="printable-label-card">
            <div class="thermal-label">
              <div class="label-brand">
                <span class="brand-title">WMS INBOUND LABEL</span>
                <span class="label-doc">${doc.docNo || 'INB-2026'}</span>
              </div>

              <div class="label-main-grid">
                <div class="label-qr-box">
                  <img src="${qrDataUrl}" alt="QR Code ${item.lpId}" class="label-qr-img" />
                  <span class="label-lpid">${item.lpId}</span>
                </div>

                <div class="label-info-box">
                  <div class="label-item-name">${item.name}</div>
                  <div class="label-sku">SKU: <strong>${item.sku}</strong></div>
                  
                  <div class="label-details-row">
                    <div>
                      <span class="lbl-small">BATCH NO:</span>
                      <strong class="lbl-val">${item.batchNo}</strong>
                    </div>
                    <div>
                      <span class="lbl-small">EXP DATE:</span>
                      <strong class="lbl-val">${item.expDate}</strong>
                    </div>
                  </div>

                  <div class="label-qty-row">
                    <span class="lbl-small">QTY:</span>
                    <strong class="lbl-qty">${item.qty} ${item.unit}</strong>
                  </div>

                  <div class="label-loc-row">
                    <span>AREA: <strong>${item.location || 'STG-01'}</strong></span>
                    <span>PO: <strong>${doc.poNo || '-'}</strong></span>
                  </div>
                </div>
              </div>

              <div class="label-barcode-footer">
                <img src="${barcodeDataUrl}" alt="SKU Barcode" class="label-barcode-img" />
              </div>
            </div>
          </div>

          <div class="print-instruction-box">
            <i class="icon-info"></i> Label ini ditempelkan pada Pallet / Kardus di Area Staging untuk di-scan saat proses <strong>Putaway</strong> ke Rak Gudang.
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-outline" id="btn-close-label-modal-bottom">Tutup</button>
          <button class="btn btn-secondary" id="btn-trigger-print">
            <i class="icon-printer"></i> Cetak Label (Print)
          </button>
          <button class="btn btn-primary" id="btn-proceed-putaway" data-lpid="${item.lpId}">
            Lanjut Putaway ke Rak ➔
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const closeModal = () => modal.remove();
    modal.querySelector('#btn-close-label-modal').addEventListener('click', closeModal);
    modal.querySelector('#btn-close-label-modal-bottom').addEventListener('click', closeModal);

    // Trigger Print
    modal.querySelector('#btn-trigger-print').addEventListener('click', () => {
      window.print();
    });

    // Proceed to Putaway
    modal.querySelector('#btn-proceed-putaway').addEventListener('click', () => {
      closeModal();
      window.navigateTo('operator-putaway', { autoScanLP: item.lpId });
    });
  }
};
