/**
 * Admin Panel: Check Stock Gudang Besar Component
 * Full 12-Column Product & SAP Schema:
 * [SKU, Sku Name, Sap Code, Category, Qty Rack, Qty Sap, Qty On Hand, Qty On Order, Available Qty, Reserve Qty, Is Under Reserve, Status]
 * Includes Excel / CSV Upload, Template Download, and Export.
 */

import { Storage } from '../data/storage.js';
import { ExcelParser } from '../utils/excelParser.js';
import { Formatters } from '../utils/formatters.js';
import { SoundEngine } from '../utils/soundEffects.js';

export const AdminStock = {
  filters: {
    query: '',
    category: 'ALL',
    underReserve: 'ALL',
    status: 'ALL'
  },

  render: function (container) {
    this.filters = {
      query: '',
      category: 'ALL',
      underReserve: 'ALL',
      status: 'ALL'
    };

    const skus = Storage.getSKUs();
    const categories = [...new Set(skus.map((s) => s.category || 'General'))];

    container.innerHTML = `
      <div class="admin-view-container">
        <!-- Header -->
        <div class="admin-page-header">
          <div>
            <span class="admin-section-sub">REKONSILIASI SAP & INVENTORY GUDANG</span>
            <h1 class="admin-page-title">Check Stock Gudang Besar</h1>
          </div>
          <div class="admin-header-actions">
            <button class="btn btn-outline" id="btn-download-excel-template">
              <i class="icon-download"></i> Download Template Excel
            </button>
            <button class="btn btn-secondary" id="btn-upload-excel-file">
              <i class="icon-file-text"></i> Upload Excel / CSV
            </button>
            <button class="btn btn-outline" id="btn-export-stock-csv">
              <i class="icon-download"></i> Export Excel
            </button>
            <button class="btn btn-primary" id="btn-refresh-stock">
              <i class="icon-refresh"></i> Refresh Data
            </button>
          </div>
        </div>

        <!-- Filter & Search Control Panel -->
        <div class="admin-card filter-control-card">
          <div class="filter-grid">
            <!-- Search Bar -->
            <div class="filter-item filter-search">
              <label>Pencarian SKU, Nama Produk, atau SAP Code</label>
              <div class="search-input-wrapper">
                <i class="icon-search search-icon"></i>
                <input type="text" id="admin-stock-search" placeholder="Ketik SKU (SKU-MED-...), Nama, atau SAP Code..." />
              </div>
            </div>

            <!-- Category Filter -->
            <div class="filter-item">
              <label>Kategori Produk</label>
              <select id="filter-category" class="filter-select">
                <option value="ALL">Semua Kategori</option>
                ${categories.map((c) => `<option value="${c}">${c}</option>`).join('')}
              </select>
            </div>

            <!-- Under Reserve Filter -->
            <div class="filter-item">
              <label>Status Under Reserve</label>
              <select id="filter-under-reserve" class="filter-select">
                <option value="ALL">Semua (Under Reserve & Free)</option>
                <option value="Yes">Hanya Is Under Reserve = Yes</option>
                <option value="No">Hanya Is Under Reserve = No</option>
              </select>
            </div>

            <!-- Product Status Filter -->
            <div class="filter-item">
              <label>Status Produk</label>
              <select id="filter-status" class="filter-select">
                <option value="ALL">Semua Status</option>
                <option value="Active">Active</option>
                <option value="Near Expiry">Near Expiry</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Stock Statistics Ribbon -->
        <div class="stock-stats-ribbon" id="stock-stats-ribbon"></div>

        <!-- 12-Column Main Table as per User Request Image -->
        <div class="admin-card mt-3">
          <div class="admin-card-header">
            <div>
              <h3><i class="icon-grid"></i> Database Produk & Monitoring Stok Realtime</h3>
              <p class="card-desc">Struktur data terintegrasi SAP (12 Kolom): Fisik di Rak, Stok On Hand, Alokasi Reserve, dan Stok SAP.</p>
            </div>
            <div class="table-results-badge" id="table-results-badge">0 Baris Produk</div>
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
                  <th class="text-right">Qty On Order</th>
                  <th class="text-right">Available Qty</th>
                  <th class="text-right">Reserve Qty</th>
                  <th class="text-center">Is Under Reserve</th>
                  <th class="text-center">Status</th>
                </tr>
              </thead>
              <tbody id="stock-table-tbody"></tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    this.attachEvents(container);
    this.renderTable(container);
  },

  attachEvents: function (container) {
    const searchInput = container.querySelector('#admin-stock-search');
    const catSelect = container.querySelector('#filter-category');
    const resSelect = container.querySelector('#filter-under-reserve');
    const statSelect = container.querySelector('#filter-status');

    searchInput.addEventListener('input', () => {
      this.filters.query = searchInput.value.trim().toLowerCase();
      this.renderTable(container);
    });

    catSelect.addEventListener('change', () => {
      this.filters.category = catSelect.value;
      this.renderTable(container);
    });

    resSelect.addEventListener('change', () => {
      this.filters.underReserve = resSelect.value;
      this.renderTable(container);
    });

    statSelect.addEventListener('change', () => {
      this.filters.status = statSelect.value;
      this.renderTable(container);
    });

    container.querySelector('#btn-refresh-stock').addEventListener('click', () => {
      this.renderTable(container);
    });

    // Template Download
    container.querySelector('#btn-download-excel-template').addEventListener('click', () => {
      ExcelParser.downloadTemplate();
      SoundEngine.playScanSuccess();
    });

    // Upload Excel Modal
    container.querySelector('#btn-upload-excel-file').addEventListener('click', () => {
      this.showUploadExcelModal(container);
    });

    // Export CSV
    container.querySelector('#btn-export-stock-csv').addEventListener('click', () => {
      const items = this.getFilteredItems();
      ExcelParser.exportProductsToCSV(items, `Stock_Gudang_Besar_${new Date().toISOString().slice(0, 10)}.csv`);
      SoundEngine.playScanSuccess();
    });
  },

  getFilteredItems: function () {
    let items = Storage.getSKUs();

    // Query filter
    if (this.filters.query) {
      items = items.filter((it) => {
        return (
          it.sku.toLowerCase().includes(this.filters.query) ||
          (it.skuName && it.skuName.toLowerCase().includes(this.filters.query)) ||
          (it.name && it.name.toLowerCase().includes(this.filters.query)) ||
          (it.sapCode && it.sapCode.toLowerCase().includes(this.filters.query)) ||
          (it.category && it.category.toLowerCase().includes(this.filters.query))
        );
      });
    }

    // Category filter
    if (this.filters.category !== 'ALL') {
      items = items.filter((it) => it.category === this.filters.category);
    }

    // Under reserve filter
    if (this.filters.underReserve !== 'ALL') {
      items = items.filter((it) => (it.isUnderReserve || 'No') === this.filters.underReserve);
    }

    // Status filter
    if (this.filters.status !== 'ALL') {
      items = items.filter((it) => (it.status || 'Active') === this.filters.status);
    }

    return items;
  },

  renderTable: function (container) {
    const tbody = container.querySelector('#stock-table-tbody');
    const badge = container.querySelector('#table-results-badge');
    const ribbon = container.querySelector('#stock-stats-ribbon');

    const items = this.getFilteredItems();
    const allItems = Storage.getSKUs();

    if (badge) badge.innerText = `${items.length} dari ${allItems.length} SKU`;

    // Calculate Ribbon Metrics
    const totalRack = items.reduce((acc, curr) => acc + (Number(curr.qtyRack) || 0), 0);
    const totalSap = items.reduce((acc, curr) => acc + (Number(curr.qtySap) || 0), 0);
    const totalOnHand = items.reduce((acc, curr) => acc + (Number(curr.qtyOnHand) || 0), 0);
    const totalAvailable = items.reduce((acc, curr) => acc + (Number(curr.availableQty) || 0), 0);
    const totalReserved = items.reduce((acc, curr) => acc + (Number(curr.reserveQty) || 0), 0);

    const discrepancyCount = items.filter((i) => (Number(i.qtyRack) || 0) !== (Number(i.qtySap) || 0)).length;

    if (ribbon) {
      ribbon.innerHTML = `
        <div class="ribbon-item">
          <span class="r-label">Total Qty Rack:</span>
          <strong class="r-val text-primary">${Formatters.formatNumber(totalRack)}</strong>
        </div>
        <div class="ribbon-item">
          <span class="r-label">Total Qty SAP:</span>
          <strong class="r-val">${Formatters.formatNumber(totalSap)}</strong>
        </div>
        <div class="ribbon-item">
          <span class="r-label">Total On Hand:</span>
          <strong class="r-val text-success">${Formatters.formatNumber(totalOnHand)}</strong>
        </div>
        <div class="ribbon-item">
          <span class="r-label">Available / Free:</span>
          <strong class="r-val text-teal">${Formatters.formatNumber(totalAvailable)}</strong>
        </div>
        <div class="ribbon-item">
          <span class="r-label">Total Reserved:</span>
          <strong class="r-val text-amber">${Formatters.formatNumber(totalReserved)}</strong>
        </div>
        ${
          discrepancyCount > 0
            ? `
          <div class="ribbon-item">
            <span class="r-label">Selisih Rack vs SAP:</span>
            <strong class="r-val text-rose"><i class="icon-alert-triangle"></i> ${discrepancyCount} SKU</strong>
          </div>
        `
            : ''
        }
      `;
    }

    if (items.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="12" class="text-center py-5">
            <div class="empty-state-table">
              <i class="icon-inbox"></i>
              <p>Tidak ada data produk yang cocok dengan kriteria pencarian / filter.</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = items
      .map((it) => {
        const isReserve = it.isUnderReserve === 'Yes' || (Number(it.reserveQty) || 0) > 0;
        const isDiscrepant = (Number(it.qtyRack) || 0) !== (Number(it.qtySap) || 0);

        let statusBadgeClass = 'badge-success';
        if (it.status === 'Near Expiry') statusBadgeClass = 'badge-warning';
        if (it.status === 'Out of Stock') statusBadgeClass = 'badge-danger';

        return `
        <tr>
          <td><strong class="font-mono text-primary">${it.sku}</strong></td>
          <td><strong>${it.skuName || it.name}</strong></td>
          <td><code class="font-mono text-muted">${it.sapCode || '-'}</code></td>
          <td><span class="badge badge-info">${it.category || 'General'}</span></td>
          
          <!-- Qty Rack -->
          <td class="text-right">
            <strong class="font-mono ${it.qtyRack > 0 ? 'text-success' : 'text-muted'}">
              ${Formatters.formatNumber(it.qtyRack)}
            </strong>
          </td>

          <!-- Qty Sap -->
          <td class="text-right">
            <span class="font-mono ${isDiscrepant ? 'text-amber' : ''}">
              ${Formatters.formatNumber(it.qtySap)}
            </span>
          </td>

          <!-- Qty On Hand -->
          <td class="text-right">
            <strong class="font-mono text-main">
              ${Formatters.formatNumber(it.qtyOnHand)}
            </strong>
          </td>

          <!-- Qty On Order -->
          <td class="text-right">
            <span class="font-mono text-muted">
              ${Formatters.formatNumber(it.qtyOnOrder)}
            </span>
          </td>

          <!-- Available Qty -->
          <td class="text-right">
            <strong class="font-mono text-teal">
              ${Formatters.formatNumber(it.availableQty)}
            </strong>
          </td>

          <!-- Reserve Qty -->
          <td class="text-right">
            <span class="font-mono ${isReserve ? 'text-amber font-bold' : 'text-muted'}">
              ${Formatters.formatNumber(it.reserveQty)}
            </span>
          </td>

          <!-- Is Under Reserve -->
          <td class="text-center">
            <span class="badge ${isReserve ? 'badge-warning' : 'badge-gray'}">
              ${isReserve ? 'Yes' : 'No'}
            </span>
          </td>

          <!-- Status -->
          <td class="text-center">
            <span class="badge ${statusBadgeClass}">
              ${it.status || 'Active'}
            </span>
          </td>
        </tr>
      `;
      })
      .join('');
  },

  showUploadExcelModal: function (container) {
    const existing = document.getElementById('upload-excel-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'upload-excel-modal';
    modal.className = 'modal-overlay active';

    modal.innerHTML = `
      <div class="modal-card">
        <div class="modal-header">
          <div>
            <span class="badge badge-info">Upload Database Produk</span>
            <h3>Upload File Excel / CSV Produk</h3>
          </div>
          <button class="btn-close" id="btn-close-upload-modal">✕</button>
        </div>

        <div class="modal-body">
          <p class="section-subtext">
            Upload file Excel (.xlsx, .xls) atau CSV (.csv) dengan header kolom:<br>
            <code>SKU, Sku Name, Sap Code, Category, Qty Rack, Qty Sap, Qty On Hand, Qty On Order, Available Qty, Reserve Qty, Is Under Reserve, Status</code>
          </p>

          <!-- Drag and Drop Dropzone -->
          <div class="upload-dropzone" id="excel-dropzone">
            <i class="icon-file-text upload-big-icon"></i>
            <h4>Pilih File Excel / CSV dari Komputer</h4>
            <p>Klik tombol di bawah ini atau seret file ke area ini</p>
            <input type="file" id="excel-file-input" accept=".csv, .xlsx, .xls" style="display: none;" />
            <button type="button" class="btn btn-secondary" id="btn-browse-file">
              📁 Pilih File Excel/CSV
            </button>
            <span id="selected-filename" class="selected-filename-tag">Belum ada file dipilih</span>
          </div>

          <div class="form-group mt-3">
            <label>Mode Import:</label>
            <div class="radio-options-row">
              <label class="radio-label">
                <input type="radio" name="import-mode" value="merge" checked />
                <span><strong>Merge / Update</strong> (Perbarui SKU yang cocok, tambahkan SKU baru)</span>
              </label>
              <label class="radio-label">
                <input type="radio" name="import-mode" value="replace" />
                <span><strong>Replace All</strong> (Gantikan seluruh master data produk yang ada)</span>
              </label>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-outline" id="btn-cancel-upload-modal">Batal</button>
          <button type="button" class="btn btn-primary" id="btn-process-upload" disabled>
            <i class="icon-check"></i> Proses Import Data Excel
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const closeModal = () => modal.remove();
    modal.querySelector('#btn-close-upload-modal').addEventListener('click', closeModal);
    modal.querySelector('#btn-cancel-upload-modal').addEventListener('click', closeModal);

    const fileInput = modal.querySelector('#excel-file-input');
    const browseBtn = modal.querySelector('#btn-browse-file');
    const filenameTag = modal.querySelector('#selected-filename');
    const processBtn = modal.querySelector('#btn-process-upload');
    let loadedFileContent = null;

    browseBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      filenameTag.innerText = `📄 ${file.name} (${Math.round(file.size / 1024)} KB)`;
      const reader = new FileReader();
      reader.onload = (evt) => {
        loadedFileContent = evt.target.result;
        processBtn.disabled = false;
      };
      reader.readAsText(file);
    });

    processBtn.addEventListener('click', () => {
      if (!loadedFileContent) return;

      const parsedProducts = ExcelParser.parseCSVText(loadedFileContent);
      if (parsedProducts.length === 0) {
        alert('File tidak berisi baris data yang valid atau format header tidak sesuai.');
        return;
      }

      const mode = modal.querySelector('input[name="import-mode"]:checked').value;
      const res = Storage.importProducts(parsedProducts, mode);

      SoundEngine.playScanSuccess();
      alert(`Berhasil mengimpor ${res.count} produk ke dalam Database WMS!`);
      closeModal();
      this.render(container);
    });
  }
};
