/**
 * Operator Handheld: Check Stock Gudang Component
 * Quick lookup on Handheld via Barcode / QR Scanner or keyword search
 */

import { Storage } from '../data/storage.js';
import { QRScanner } from './qrScanner.js';
import { Formatters } from '../utils/formatters.js';
import { SoundEngine } from '../utils/soundEffects.js';

export const OperatorStock = {
  activeQuery: '',
  activeZoneFilter: 'ALL',

  render: function (container) {
    this.activeQuery = '';
    this.activeZoneFilter = 'ALL';

    container.innerHTML = `
      <div class="hht-view-container">
        <!-- Top Header -->
        <div class="hht-card-header">
          <div class="d-flex align-items-center gap-2">
            <button class="btn btn-sm btn-outline" id="btn-stock-back-home" title="Kembali ke Menu Utama Handheld">
              ← Menu
            </button>
            <div>
              <span class="hht-badge-step"><i class="icon-search"></i> CEK STOK GUDANG</span>
              <h2 class="hht-title">Cari & Scan Stok Gudang</h2>
            </div>
          </div>
          <button class="btn btn-primary btn-sm" id="btn-scan-stock-search">
            <i class="icon-camera"></i> Scan Barcode
          </button>
        </div>

        <!-- Search Bar -->
        <div class="hht-search-box">
          <div class="search-input-wrapper">
            <i class="icon-search search-icon"></i>
            <input type="text" id="hht-stock-search-input" placeholder="Cari SKU, Nama, Batch, atau Lokasi Rak..." />
            <button class="btn-clear-search" id="btn-clear-stock-search" style="display:none;">✕</button>
          </div>
        </div>

        <!-- Zone Chips Filter -->
        <div class="zone-filter-scroll">
          <button class="zone-chip active" data-zone="ALL">Semua Lokasi</button>
          <button class="zone-chip" data-zone="STAGING">Staging Area</button>
          <button class="zone-chip" data-zone="A">Zona A (Farmasi)</button>
          <button class="zone-chip" data-zone="B">Zona B (FMCG)</button>
          <button class="zone-chip" data-zone="C">Zona C (Umum)</button>
          <button class="zone-chip" data-zone="D">Zona D (Cold)</button>
        </div>

        <!-- Stock Results Cards -->
        <div class="stock-results-header">
          <span id="stock-results-count">Menampilkan stok...</span>
          <span class="fefo-indicator"><i class="icon-clock"></i> Urutan FEFO Teratas</span>
        </div>

        <div id="hht-stock-cards-list" class="hht-stock-list"></div>
      </div>
    `;

    this.attachEvents(container);
    this.renderStockList(container);
  },

  attachEvents: function (container) {
    const searchInput = container.querySelector('#hht-stock-search-input');
    const clearBtn = container.querySelector('#btn-clear-stock-search');
    const scanBtn = container.querySelector('#btn-scan-stock-search');
    const zoneChips = container.querySelectorAll('.zone-chip');

    // Search input typing
    searchInput.addEventListener('input', () => {
      this.activeQuery = searchInput.value.trim().toLowerCase();
      clearBtn.style.display = this.activeQuery ? 'block' : 'none';
      this.renderStockList(container);
    });

    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      this.activeQuery = '';
      clearBtn.style.display = 'none';
      this.renderStockList(container);
    });

    // Scanner button
    scanBtn.addEventListener('click', () => {
      QRScanner.openScannerModal({
        title: 'Scan Barcode untuk Cek Stok',
        hint: 'Scan barcode SKU barang atau label lokasi rak untuk melihat stok real-time',
        filterType: 'ALL',
        onScan: (code) => {
          this.activeQuery = code.trim().toLowerCase();
          searchInput.value = code;
          clearBtn.style.display = 'block';
          SoundEngine.playScanSuccess();
          this.renderStockList(container);
        }
      });
    });

    const btnBackHome = container.querySelector('#btn-stock-back-home');
    if (btnBackHome) {
      btnBackHome.addEventListener('click', () => {
        window.navigateTo('operator-home');
      });
    }

    // Zone filters
    zoneChips.forEach((chip) => {
      chip.addEventListener('click', () => {
        zoneChips.forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        this.activeZoneFilter = chip.dataset.zone;
        this.renderStockList(container);
      });
    });
  },

  renderStockList: function (container) {
    const listContainer = container.querySelector('#hht-stock-cards-list');
    const countSpan = container.querySelector('#stock-results-count');
    if (!listContainer) return;

    let items = Storage.getStockItems();

    // Filter by Zone
    if (this.activeZoneFilter !== 'ALL') {
      if (this.activeZoneFilter === 'STAGING') {
        items = items.filter((it) => it.status === 'STAGING' || it.location.startsWith('STG'));
      } else {
        items = items.filter((it) => it.location.startsWith(this.activeZoneFilter));
      }
    }

    // Filter by Query (SKU, Name, Batch, Location, LP)
    if (this.activeQuery) {
      items = items.filter((it) => {
        return (
          it.sku.toLowerCase().includes(this.activeQuery) ||
          it.name.toLowerCase().includes(this.activeQuery) ||
          it.batchNo.toLowerCase().includes(this.activeQuery) ||
          it.location.toLowerCase().includes(this.activeQuery) ||
          (it.lpId && it.lpId.toLowerCase().includes(this.activeQuery))
        );
      });
    }

    // Sort by FEFO (First Expired First Out)
    items.sort((a, b) => new Date(a.expDate) - new Date(b.expDate));

    if (countSpan) {
      countSpan.innerText = `${items.length} Batch / Lot Ditemukan`;
    }

    if (items.length === 0) {
      listContainer.innerHTML = `
        <div class="empty-state-card">
          <i class="icon-inbox"></i>
          <h4>Stok Tidak Ditemukan</h4>
          <p>Tidak ada stok yang cocok dengan kriteria pencarian atau filter zona ini.</p>
        </div>
      `;
      return;
    }

    listContainer.innerHTML = items
      .map((it) => {
        const expStatus = Formatters.getExpiryStatus(it.expDate);
        const isStaging = it.status === 'STAGING';

        return `
        <div class="hht-stock-card ${isStaging ? 'border-staging' : ''}">
          <div class="hht-stock-header">
            <div class="hht-stock-loc-tag ${isStaging ? 'loc-staging' : 'loc-rack'}">
              <i class="${isStaging ? 'icon-clock' : 'icon-map-pin'}"></i>
              <strong>${isStaging ? 'Staging: ' + it.location : 'Rak: ' + it.location}</strong>
            </div>
            <span class="badge ${expStatus.colorClass}">${expStatus.label}</span>
          </div>

          <div class="hht-stock-main">
            <h4 class="hht-stock-name">${it.name}</h4>
            <div class="hht-stock-sku">SKU: <strong>${it.sku}</strong> | LP: <code>${it.lpId}</code></div>
          </div>

          <div class="hht-stock-details-grid">
            <div class="stock-detail-item">
              <span class="s-label">BATCH NO</span>
              <strong class="s-val">${it.batchNo}</strong>
            </div>
            <div class="stock-detail-item">
              <span class="s-label">EXP DATE</span>
              <strong class="s-val">${it.expDate}</strong>
            </div>
            <div class="stock-detail-item">
              <span class="s-label">JUMLAH STOK</span>
              <strong class="s-val s-qty ${isStaging ? 'text-warning' : 'text-success'}">
                ${it.qty} ${it.unit}
              </strong>
            </div>
          </div>

          ${
            isStaging
              ? `
            <div class="hht-stock-footer">
              <span class="staging-warn-text"><i class="icon-alert-triangle"></i> Belum di-putaway</span>
              <button class="btn btn-xs btn-primary btn-goto-putaway" data-lpid="${it.lpId}">
                Putaway Sekarang ➔
              </button>
            </div>
          `
              : ''
          }
        </div>
      `;
      })
      .join('');

    listContainer.querySelectorAll('.btn-goto-putaway').forEach((btn) => {
      btn.addEventListener('click', () => {
        window.navigateTo('operator-putaway', { autoScanLP: btn.dataset.lpid });
      });
    });
  }
};
