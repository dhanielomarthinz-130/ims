/**
 * Operator Handheld: Native Mobile App Home Launcher Component
 * iOS & Android Springboard Style Launcher with Large Touch-Friendly Menu Cards & Widgets
 */

import { Auth, ROLES } from '../data/auth.js';
import { Storage } from '../data/storage.js';
import { QRScanner } from './qrScanner.js';
import { SoundEngine } from '../utils/soundEffects.js';

export const OperatorHome = {
  render: function (container) {
    const user = Auth.getCurrentUser();
    if (!user) return;

    const roleInfo = ROLES[user.role] || { name: user.role, color: '#94a3b8' };
    const stockItems = Storage.getStockItems();
    const stagingItems = stockItems.filter((s) => s.status === 'STAGING');
    const storedItems = stockItems.filter((s) => s.status === 'STORED');
    const totalStoredUnits = storedItems.reduce((sum, it) => sum + (Number(it.qty) || 0), 0);
    const stagingCount = stagingItems.length;

    const canAccessAdmin = Auth.canAccessPortal('ADMIN');
    const canAccessInbound = Auth.canAccessView('operator-inbound');
    const canAccessPutaway = Auth.canAccessView('operator-putaway');
    const canAccessStock = Auth.canAccessView('operator-stock');

    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });

    container.innerHTML = `
      <div class="mobile-launcher-container">
        
        <!-- Mobile App Status & Hero Header (iOS / Android Style) -->
        <div class="mobile-hero-header">
          <div class="mobile-hero-top">
            <div class="mobile-brand-pill">
              <span class="mobile-live-dot"></span>
              <span class="mobile-brand-text">WMS SMART HANDHELD</span>
            </div>
            <div class="mobile-top-time">${timeStr}</div>
          </div>

          <div class="mobile-user-row">
            <div class="mobile-user-avatar">${user.avatar || '👷'}</div>
            <div class="mobile-user-details">
              <div class="mobile-greeting">Selamat Bertugas,</div>
              <h2 class="mobile-user-name">${user.name}</h2>
              <span class="mobile-division-chip" style="color: ${roleInfo.color}; border-color: ${roleInfo.color}40; background: ${roleInfo.color}15;">
                ${roleInfo.name}
              </span>
            </div>
          </div>

          <!-- Quick Top Action Buttons -->
          <div class="mobile-hero-actions">
            <button class="btn-mobile-action btn-scan-action" id="btn-hero-scan" title="Buka Kamera Barcode Scanner">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
              <span>Scan Barcode (F2)</span>
            </button>

            ${canAccessAdmin ? `
              <button class="btn-mobile-action btn-admin-switch" id="btn-hero-admin-switch" title="Buka Panel Admin Desktop">
                <span>🖥️ Panel Admin</span>
              </button>
            ` : ''}

            <button class="btn-mobile-action btn-logout-action" id="btn-hero-logout" title="Keluar dari Aplikasi">
              <span>🚪 Logout</span>
            </button>
          </div>
        </div>

        <!-- Operational Status Widgets (iOS Widget Style) -->
        <div class="mobile-widgets-grid">
          <div class="mobile-widget-card widget-amber">
            <div class="widget-icon">📥</div>
            <div class="widget-info">
              <div class="widget-value">${stagingCount}</div>
              <div class="widget-label">Pallet di Staging</div>
            </div>
          </div>

          <div class="mobile-widget-card widget-blue">
            <div class="widget-icon">🏗️</div>
            <div class="widget-info">
              <div class="widget-value">${totalStoredUnits.toLocaleString()}</div>
              <div class="widget-label">Unit di Rak Gudang</div>
            </div>
          </div>

          <div class="mobile-widget-card widget-emerald">
            <div class="widget-icon">⚡</div>
            <div class="widget-info">
              <div class="widget-value">MySQL</div>
              <div class="widget-label">Status Cloud Aktif</div>
            </div>
          </div>
        </div>

        <!-- Section Title -->
        <div class="mobile-section-heading">
          <h3>Menu Operasional Handheld</h3>
          <span class="section-subtitle">Pilih menu tugas lapangan Anda:</span>
        </div>

        <!-- iOS / Android Style App Launcher Menu Grid -->
        <div class="mobile-app-grid">
          
          <!-- 1. INBOUND STAGING APP CARD -->
          ${canAccessInbound ? `
            <div class="mobile-app-card card-inbound" id="menu-inbound-card">
              <div class="app-card-icon-box gradient-amber">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <polyline points="19 12 12 19 5 12"></polyline>
                </svg>
              </div>
              <div class="app-card-content">
                <div class="app-card-header-row">
                  <h4 class="app-card-title">Inbound Staging</h4>
                  <span class="app-card-arrow">➔</span>
                </div>
                <p class="app-card-desc">Penerimaan surat jalan (GRN), input barang masuk & cetak QR barcode pallet.</p>
              </div>
            </div>
          ` : ''}

          <!-- 2. PUTAWAY RAK APP CARD -->
          ${canAccessPutaway ? `
            <div class="mobile-app-card card-putaway" id="menu-putaway-card">
              <div class="app-card-icon-box gradient-blue">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 16 16 12 12 8"></polyline>
                  <line x1="8" y1="12" x2="16" y2="12"></line>
                </svg>
                ${stagingCount > 0 ? `<span class="app-card-badge">${stagingCount}</span>` : ''}
              </div>
              <div class="app-card-content">
                <div class="app-card-header-row">
                  <h4 class="app-card-title">Putaway ke Rak</h4>
                  <span class="app-card-arrow">➔</span>
                </div>
                <p class="app-card-desc">Scan QR pallet di staging, terima rekomendasi slotting AI & simpan ke rak gudang.</p>
                ${stagingCount > 0 ? `<div class="app-card-tag tag-warning">⚡ ${stagingCount} Pallet menunggu dipindahkan</div>` : `<div class="app-card-tag tag-success">✓ Antrean staging bersih</div>`}
              </div>
            </div>
          ` : ''}

          <!-- 3. CEK STOCK HANDHELD APP CARD -->
          ${canAccessStock ? `
            <div class="mobile-app-card card-stock" id="menu-stock-card">
              <div class="app-card-icon-box gradient-violet">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </div>
              <div class="app-card-content">
                <div class="app-card-header-row">
                  <h4 class="app-card-title">Cek Stock Handheld</h4>
                  <span class="app-card-arrow">➔</span>
                </div>
                <p class="app-card-desc">Pencarian cepat lokasi rak, cek sisa kuantiti fisik & riwayat pergerakan batch.</p>
              </div>
            </div>
          ` : ''}

          <!-- 4. UNIVERSAL SCANNER APP CARD -->
          <div class="mobile-app-card card-scanner" id="menu-scanner-card">
            <div class="app-card-icon-box gradient-cyan">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="13" r="4"></circle>
              </svg>
            </div>
            <div class="app-card-content">
              <div class="app-card-header-row">
                <h4 class="app-card-title">Scanner Kamera (F2)</h4>
                <span class="app-card-arrow">➔</span>
              </div>
              <p class="app-card-desc">Buka pemindai barcode / QR universal untuk identifikasi barang atau rak instan.</p>
            </div>
          </div>

        </div>

        <!-- Footer Info -->
        <div class="mobile-footer-info">
          <span>WMS Handheld v2.4 • Shift Operasional Aktif</span>
        </div>

      </div>
    `;

    // Attach Click Handlers to App Launcher Cards
    const cardInbound = container.querySelector('#menu-inbound-card');
    if (cardInbound) {
      cardInbound.onclick = () => {
        SoundEngine.playScanSuccess();
        window.navigateTo('operator-inbound');
      };
    }

    const cardPutaway = container.querySelector('#menu-putaway-card');
    if (cardPutaway) {
      cardPutaway.onclick = () => {
        SoundEngine.playScanSuccess();
        window.navigateTo('operator-putaway');
      };
    }

    const cardStock = container.querySelector('#menu-stock-card');
    if (cardStock) {
      cardStock.onclick = () => {
        SoundEngine.playScanSuccess();
        window.navigateTo('operator-stock');
      };
    }

    const cardScanner = container.querySelector('#menu-scanner-card');
    if (cardScanner) {
      cardScanner.onclick = () => {
        QRScanner.openScannerModal({
          title: 'Handheld Barcode / QR Scanner',
          hint: 'Scan barang di Staging atau Rak Gudang',
          onScan: (code) => {
            window.navigateTo('operator-stock');
          }
        });
      };
    }

    const btnHeroScan = container.querySelector('#btn-hero-scan');
    if (btnHeroScan) {
      btnHeroScan.onclick = () => {
        QRScanner.openScannerModal({
          title: 'Handheld Barcode / QR Scanner',
          hint: 'Scan barang di Staging atau Rak Gudang',
          onScan: (code) => {
            window.navigateTo('operator-stock');
          }
        });
      };
    }

    const btnAdminSwitch = container.querySelector('#btn-hero-admin-switch');
    if (btnAdminSwitch) {
      btnAdminSwitch.onclick = () => {
        if (window.wmsApp) {
          window.wmsApp.switchPortal('ADMIN');
        }
      };
    }

    const btnLogout = container.querySelector('#btn-hero-logout');
    if (btnLogout) {
      btnLogout.onclick = () => {
        if (confirm(`Logout dari akun ${user.name}?`)) {
          Auth.logout();
          SoundEngine.playScanSuccess();
          if (window.wmsApp) {
            window.wmsApp.renderLogin();
          }
        }
      };
    }
  }
};
