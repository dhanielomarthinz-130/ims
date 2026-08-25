/**
 * Admin Panel: Master Data (12-Column Products & Warehouse Rack Locations)
 * Includes Excel Template Download, Upload & Batch Printable Rack Barcode Stickers
 */

import { Storage } from '../data/storage.js';
import { ExcelParser } from '../utils/excelParser.js';
import { QRCodeGenerator } from '../utils/qrLib.js';
import { SoundEngine } from '../utils/soundEffects.js';
import { Formatters } from '../utils/formatters.js';

export const AdminMaster = {
  activeTab: 'skus', // 'skus' or 'locations'

  render: function (container) {
    container.innerHTML = `
      <div class="admin-view-container">
        <!-- Header -->
        <div class="admin-page-header">
          <div>
            <span class="admin-section-sub">PENGATURAN & MASTER DATA</span>
            <h1 class="admin-page-title">Master Data Produk (12 Kolom) & Lokasi Rak</h1>
          </div>
          <div class="admin-header-actions">
            <button class="btn btn-outline" id="btn-download-master-excel">
              <i class="icon-download"></i> Template Excel
            </button>
            <button class="btn btn-secondary" id="btn-batch-print-all-racks">
              <i class="icon-printer"></i> Cetak QR Semua Rak
            </button>
            <button class="btn btn-primary" id="btn-add-master-item">
              <i class="icon-plus"></i> Tambah Produk Baru
            </button>
          </div>
        </div>

        <!-- Master Data Tabs -->
        <div class="master-subtabs">
          <button class="master-tab-btn ${this.activeTab === 'skus' ? 'active' : ''}" data-tab="skus">
            <i class="icon-box"></i> Master Produk & SAP Code (${Storage.getSKUs().length})
          </button>
          <button class="master-tab-btn ${this.activeTab === 'locations' ? 'active' : ''}" data-tab="locations">
            <i class="icon-map-pin"></i> Master Lokasi Rak & Staging (${Storage.getLocations().length})
          </button>
        </div>

        <!-- Tab 1: SKUs -->
        <div id="master-skus-panel" class="master-tab-panel ${this.activeTab === 'skus' ? 'active' : ''}">
          <div class="admin-card">
            <div class="admin-card-header">
              <div>
                <h3><i class="icon-package"></i> Master Produk (12 Kolom SAP Schema)</h3>
                <p class="card-desc">Daftar produk terdaftar lengkap dengan SAP Code, status reserve, dan parameter kuantitas.</p>
              </div>
            </div>

            <div class="table-responsive">
              <table class="data-table stock-sap-table">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Sku Name</th>
                    <th>Sap Code</th>
                    <th>Category</th>
                    <th class="text-right">Qty Rack</th>
                    <th class="text-right">Qty Sap</th>
                    <th class="text-right">Qty On Hand</th>
                    <th class="text-right">Available Qty</th>
                    <th class="text-right">Reserve Qty</th>
                    <th class="text-center">Is Under Reserve</th>
                    <th class="text-center">Status</th>
                  </tr>
                </thead>
                <tbody id="master-skus-tbody">
                  ${Storage.getSKUs()
                    .map(
                      (s) => `
                    <tr>
                      <td><strong class="font-mono text-primary">${s.sku}</strong></td>
                      <td><strong>${s.skuName || s.name}</strong></td>
                      <td><code class="font-mono text-muted">${s.sapCode || '-'}</code></td>
                      <td><span class="badge badge-info">${s.category || 'General'}</span></td>
                      <td class="text-right font-mono">${Formatters.formatNumber(s.qtyRack)}</td>
                      <td class="text-right font-mono">${Formatters.formatNumber(s.qtySap)}</td>
                      <td class="text-right font-mono font-bold">${Formatters.formatNumber(s.qtyOnHand)}</td>
                      <td class="text-right font-mono text-teal">${Formatters.formatNumber(s.availableQty)}</td>
                      <td class="text-right font-mono text-amber">${Formatters.formatNumber(s.reserveQty)}</td>
                      <td class="text-center">
                        <span class="badge ${s.isUnderReserve === 'Yes' ? 'badge-warning' : 'badge-gray'}">${s.isUnderReserve || 'No'}</span>
                      </td>
                      <td class="text-center">
                        <span class="badge ${s.status === 'Near Expiry' ? 'badge-warning' : s.status === 'Out of Stock' ? 'badge-danger' : 'badge-success'}">
                          ${s.status || 'Active'}
                        </span>
                      </td>
                    </tr>
                  `
                    )
                    .join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Tab 2: Locations -->
        <div id="master-locations-panel" class="master-tab-panel ${this.activeTab === 'locations' ? 'active' : ''}">
          <div class="admin-card">
            <div class="admin-card-header">
              <div>
                <h3><i class="icon-layers"></i> Master Lokasi Rak & Staging Area</h3>
                <p class="card-desc">Konfigurasi zona, lorong (aisle), tingkat rak, dan kapasitas penyimpanan.</p>
              </div>
            </div>

            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Kode Lokasi</th>
                    <th>Nama Lokasi</th>
                    <th>Tipe</th>
                    <th>Zona</th>
                    <th>Lorong (Aisle)</th>
                    <th>Tingkat / Bin</th>
                    <th>Kapasitas</th>
                    <th class="text-center">Label Barcode</th>
                  </tr>
                </thead>
                <tbody id="master-locs-tbody">
                  ${Storage.getLocations()
                    .map(
                      (loc) => `
                    <tr>
                      <td><strong class="font-mono">${loc.id}</strong></td>
                      <td><strong>${loc.name}</strong></td>
                      <td>
                        <span class="badge ${loc.type === 'STAGING' ? 'badge-staging' : 'badge-rack'}">
                          ${loc.type}
                        </span>
                      </td>
                      <td>Zona ${loc.zone}</td>
                      <td>Aisle ${loc.aisle}</td>
                      <td>Shelf ${loc.shelf} - Bin ${loc.bin}</td>
                      <td>${loc.capacityPallet} Pallet / ${loc.maxKg} Kg</td>
                      <td class="text-center">
                        <button class="btn btn-xs btn-outline btn-print-single-rack-qr" data-locid="${loc.id}">
                          <i class="icon-printer"></i> QR Rak
                        </button>
                      </td>
                    </tr>
                  `
                    )
                    .join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachEvents(container);
  },

  attachEvents: function (container) {
    const tabButtons = container.querySelectorAll('.master-tab-btn');
    const skuPanel = container.querySelector('#master-skus-panel');
    const locPanel = container.querySelector('#master-locations-panel');

    tabButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        tabButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeTab = btn.dataset.tab;

        if (this.activeTab === 'skus') {
          skuPanel.classList.add('active');
          locPanel.classList.remove('active');
        } else {
          skuPanel.classList.remove('active');
          locPanel.classList.add('active');
        }
      });
    });

    // Template download
    container.querySelector('#btn-download-master-excel').addEventListener('click', () => {
      ExcelParser.downloadTemplate();
      SoundEngine.playScanSuccess();
    });

    // Add new modal trigger
    container.querySelector('#btn-add-master-item').addEventListener('click', () => {
      this.showAddMasterModal(container);
    });

    // Print all rack QR stickers
    container.querySelector('#btn-batch-print-all-racks').addEventListener('click', () => {
      this.showBatchRackQRModal();
    });

    // Single rack print
    container.querySelectorAll('.btn-print-single-rack-qr').forEach((btn) => {
      btn.addEventListener('click', () => {
        const locId = btn.dataset.locid;
        this.showBatchRackQRModal([locId]);
      });
    });
  },

  showAddMasterModal: function (container) {
    const existing = document.getElementById('add-master-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'add-master-modal';
    modal.className = 'modal-overlay active';

    modal.innerHTML = `
      <div class="modal-card modal-lg">
        <div class="modal-header">
          <div>
            <span class="badge badge-info">Tambah Master Produk</span>
            <h3>Tambah Master Produk (12 Kolom SAP Schema)</h3>
          </div>
          <button class="btn-close" id="btn-close-add-modal">✕</button>
        </div>

        <form id="form-add-sku">
          <div class="modal-body">
            <div class="form-group-grid">
              <div class="form-group">
                <label>Kode SKU (Unik)</label>
                <input type="text" id="new-sku-code" class="hht-input font-mono" placeholder="Contoh: SKU-MED-501" required />
              </div>

              <div class="form-group">
                <label>Kode SAP (ERP Code)</label>
                <input type="text" id="new-sku-sap" class="hht-input font-mono" placeholder="Contoh: SAP-100889" required />
              </div>
            </div>

            <div class="form-group">
              <label>Nama Produk / Sku Name</label>
              <input type="text" id="new-sku-name" class="hht-input" placeholder="Contoh: Vitamin C 500mg Effervescent (Box 10)" required />
            </div>

            <div class="form-group-grid">
              <div class="form-group">
                <label>Kategori Produk</label>
                <select id="new-sku-cat" class="hht-input hht-select">
                  <option value="Farmasi & Medis">Farmasi & Medis</option>
                  <option value="FMCG & Sembako" selected>FMCG & Sembako</option>
                  <option value="Dairy & Minuman">Dairy & Minuman</option>
                  <option value="Cold Storage">Cold Storage</option>
                  <option value="Hardware & Logistik">Hardware & Logistik</option>
                </select>
              </div>

              <div class="form-group">
                <label>Status Produk</label>
                <select id="new-sku-status" class="hht-input hht-select">
                  <option value="Active" selected>Active</option>
                  <option value="Near Expiry">Near Expiry</option>
                  <option value="Out of Stock">Out of Stock</option>
                  <option value="Discontinued">Discontinued</option>
                </select>
              </div>
            </div>

            <div class="form-group-grid">
              <div class="form-group">
                <label>Qty SAP Awal</label>
                <input type="number" id="new-sku-qtysap" class="hht-input" value="100" min="0" required />
              </div>

              <div class="form-group">
                <label>Qty On Order (PO Terbuka)</label>
                <input type="number" id="new-sku-qtyonorder" class="hht-input" value="0" min="0" />
              </div>
            </div>

            <div class="form-group-grid">
              <div class="form-group">
                <label>Reserve Qty (Alokasi)</label>
                <input type="number" id="new-sku-reserveqty" class="hht-input" value="0" min="0" />
              </div>

              <div class="form-group">
                <label>Is Under Reserve</label>
                <select id="new-sku-underreserve" class="hht-input hht-select">
                  <option value="No" selected>No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-outline" id="btn-cancel-add-modal">Batal</button>
            <button type="submit" class="btn btn-primary">Simpan Master Produk</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    const closeModal = () => modal.remove();
    modal.querySelector('#btn-close-add-modal').addEventListener('click', closeModal);
    modal.querySelector('#btn-cancel-add-modal').addEventListener('click', closeModal);

    const reserveQtyInp = modal.querySelector('#new-sku-reserveqty');
    const underReserveSelect = modal.querySelector('#new-sku-underreserve');

    reserveQtyInp.addEventListener('input', () => {
      const val = parseInt(reserveQtyInp.value, 10) || 0;
      underReserveSelect.value = val > 0 ? 'Yes' : 'No';
    });

    modal.querySelector('#form-add-sku').addEventListener('submit', (e) => {
      e.preventDefault();

      const skuCode = modal.querySelector('#new-sku-code').value.trim().toUpperCase();
      const sapCode = modal.querySelector('#new-sku-sap').value.trim().toUpperCase();
      const name = modal.querySelector('#new-sku-name').value.trim();
      const cat = modal.querySelector('#new-sku-cat').value;
      const status = modal.querySelector('#new-sku-status').value;
      const qtySap = parseInt(modal.querySelector('#new-sku-qtysap').value, 10) || 0;
      const qtyOnOrder = parseInt(modal.querySelector('#new-sku-qtyonorder').value, 10) || 0;
      const reserveQty = parseInt(modal.querySelector('#new-sku-reserveqty').value, 10) || 0;
      const isUnderReserve = underReserveSelect.value;

      const newSKU = {
        sku: skuCode,
        skuName: name,
        name: name,
        sapCode: sapCode,
        category: cat,
        status: status,
        qtyRack: 0,
        qtySap: qtySap,
        qtyOnHand: 0,
        qtyOnOrder: qtyOnOrder,
        availableQty: 0,
        reserveQty: reserveQty,
        isUnderReserve: isUnderReserve,
        unit: 'BOX',
        minStock: 30,
        preferredZone: cat.includes('Farmasi') ? 'A' : cat.includes('Cold') ? 'D' : cat.includes('FMCG') ? 'B' : 'C',
        barcode: `899${Math.floor(100000000 + Math.random() * 900000000)}`
      };

      Storage.saveSKU(newSKU);
      SoundEngine.playScanSuccess();
      closeModal();
      this.render(container);
    });
  },

  showBatchRackQRModal: function (filterIds = null) {
    const existing = document.getElementById('batch-rack-qr-modal');
    if (existing) existing.remove();

    let locs = Storage.getLocations();
    if (filterIds) {
      locs = locs.filter((l) => filterIds.includes(l.id));
    }

    const modal = document.createElement('div');
    modal.id = 'batch-rack-qr-modal';
    modal.className = 'modal-overlay active';

    modal.innerHTML = `
      <div class="modal-card modal-lg">
        <div class="modal-header">
          <div>
            <span class="badge badge-info">Stiker Label Lokasi</span>
            <h3>Cetak Label Barcode / QR Code Lokasi Rak</h3>
          </div>
          <button class="btn-close" id="btn-close-batch-modal">✕</button>
        </div>

        <div class="modal-body">
          <p class="section-subtext">Label ini dapat langsung dicetak pada kertas stiker / label dan ditempelkan pada tiang rak gudang untuk scan putaway.</p>

          <div class="rack-stickers-sheet" id="rack-stickers-sheet">
            ${locs
              .map((loc) => {
                const qrUrl = QRCodeGenerator.generateDataURL(loc.id, { size: 140 });
                const isStaging = loc.type === 'STAGING';
                return `
                <div class="rack-sticker-card ${isStaging ? 'sticker-staging' : ''}">
                  <div class="sticker-top">
                    <span class="sticker-brand">WMS LOCATION</span>
                    <span class="sticker-zone">ZONA ${loc.zone}</span>
                  </div>
                  <div class="sticker-center">
                    <img src="${qrUrl}" alt="QR ${loc.id}" class="sticker-qr-img" />
                    <div class="sticker-big-id">RAK ${loc.id}</div>
                    <div class="sticker-name">${loc.name}</div>
                  </div>
                  <div class="sticker-footer">
                    <span>Lorong ${loc.aisle} • Tingkat ${loc.shelf}</span>
                  </div>
                </div>
              `;
              })
              .join('')}
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-outline" id="btn-close-batch-modal-bottom">Tutup</button>
          <button class="btn btn-primary" id="btn-print-rack-stickers">
            <i class="icon-printer"></i> Cetak Label Stiker (Print)
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const closeModal = () => modal.remove();
    modal.querySelector('#btn-close-batch-modal').addEventListener('click', closeModal);
    modal.querySelector('#btn-close-batch-modal-bottom').addEventListener('click', closeModal);

    modal.querySelector('#btn-print-rack-stickers').addEventListener('click', () => {
      window.print();
    });
  }
};
