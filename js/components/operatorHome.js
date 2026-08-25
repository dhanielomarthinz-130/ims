/**
 * Operator Handheld: Native Mobile App Home Launcher Component
 * Exact UI implementation matching the IMS Mobile Design:
 * - Dynamic Greeting & Name ("Selamat Siang 👋 Dhanielo")
 * - Operator Division Pill Badge
 * - 4-Column Floating Stat Boxes (PUTAWAY, STAGING, STOCK OUT, TRANSFER)
 * - 9 Vibrant Squircle App Launcher Menu Icons (Req Stock Transfer, Staging, Putaway, Stock Out, Daily Count, Onhand, Measurements, Stock Storage, Barang Lebih)
 * - Elevated Circular Center Floating Action Bar (FAB) with Barcode Scanner & Bottom Navigation (Home & Logout)
 */

import { Auth, ROLES } from '../data/auth.js';
import { Storage } from '../data/storage.js';
import { QRScanner } from './qrScanner.js';
import { SoundEngine } from '../utils/soundEffects.js';

export const OperatorHome = {
  render: function (container) {
    const user = Auth.getCurrentUser();
    if (!user) return;

    const roleInfo = ROLES[user.role] || { name: user.role, color: '#6366f1' };
    const stockItems = Storage.getStockItems();
    const stagingItems = stockItems.filter((s) => s.status === 'STAGING');
    const storedItems = stockItems.filter((s) => s.status === 'STORED');
    
    const stagingCount = stagingItems.length;
    const putawayCount = storedItems.length;
    const stockOutCount = 0;
    const transferCount = 0;

    // Dynamic greeting based on time of day
    const hour = new Date().getHours();
    let greeting = 'Selamat Pagi';
    if (hour >= 11 && hour < 15) greeting = 'Selamat Siang';
    else if (hour >= 15 && hour < 18) greeting = 'Selamat Sore';
    else if (hour >= 18 || hour < 5) greeting = 'Selamat Malam';

    const userInitial = (user.name || user.username || 'D').charAt(0).toUpperCase();

    container.innerHTML = `
      <div class="ims-mobile-wrapper">
        
        <!-- Main Scrollable Screen Content -->
        <div class="ims-mobile-content">

          <!-- Topbar App Bar -->
          <div class="ims-topbar">
            <div class="ims-brand-pill">
              <span class="ims-logo-box">IMS</span>
              <span class="ims-brand-title">IMS MOBILE</span>
            </div>

            <div class="ims-topbar-actions">
              <button class="ims-icon-btn" id="btn-ims-notif" title="Notifikasi">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
              </button>

              <div class="ims-user-avatar-circle" id="ims-avatar-badge" title="Profil Pengguna">
                <span>${userInitial}</span>
              </div>
            </div>
          </div>

          <!-- Greeting & User Section -->
          <div class="ims-greeting-section">
            <div class="ims-greeting-sub">${greeting} 👋</div>
            <h1 class="ims-user-fullname">${user.name || 'Dhanielo'}</h1>
            <div class="ims-division-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
              <span>${user.division || 'OPERATOR INVENTORY BHI'}</span>
            </div>
          </div>

          <!-- Floating White 4-Column Summary Card -->
          <div class="ims-summary-card">
            
            <!-- Box 1: PUTAWAY -->
            <div class="ims-stat-box box-putaway" id="stat-box-putaway">
              <div class="stat-icon-wrapper">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </div>
              <div class="stat-number">${putawayCount}</div>
              <div class="stat-label">PUTAWAY</div>
            </div>

            <!-- Box 2: STAGING -->
            <div class="ims-stat-box box-staging" id="stat-box-staging">
              <div class="stat-icon-wrapper">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                  <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
              </div>
              <div class="stat-number">${stagingCount}</div>
              <div class="stat-label">STAGING</div>
            </div>

            <!-- Box 3: STOCK OUT -->
            <div class="ims-stat-box box-stockout" id="stat-box-stockout">
              <div class="stat-icon-wrapper">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </div>
              <div class="stat-number">${stockOutCount}</div>
              <div class="stat-label">STOCK OUT</div>
            </div>

            <!-- Box 4: TRANSFER -->
            <div class="ims-stat-box box-transfer" id="stat-box-transfer">
              <div class="stat-icon-wrapper">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="17 1 21 5 17 9"></polyline>
                  <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
                  <polyline points="7 23 3 19 7 15"></polyline>
                  <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
                </svg>
              </div>
              <div class="stat-number">${transferCount}</div>
              <div class="stat-label">TRANSFER</div>
            </div>

          </div>

          <!-- Section Heading -->
          <div class="ims-section-title">MENU UTAMA</div>

          <!-- 4-Column iOS / Android App Launcher Menu Grid -->
          <div class="ims-menu-grid">
            
            <!-- Item 1: Req Stock Transfer (Purple Gradient) -->
            <div class="ims-menu-item" id="ims-btn-transfer">
              <div class="ims-squircle-icon grad-purple">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
              </div>
              <span class="ims-menu-label">Req Stock Transfer</span>
            </div>

            <!-- Item 2: Staging (Orange Gradient) -->
            <div class="ims-menu-item" id="ims-btn-staging">
              <div class="ims-squircle-icon grad-orange">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="1" y="3" width="15" height="13"></rect>
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                  <circle cx="5.5" cy="18.5" r="2.5"></circle>
                  <circle cx="18.5" cy="18.5" r="2.5"></circle>
                </svg>
              </div>
              <span class="ims-menu-label">Staging</span>
            </div>

            <!-- Item 3: Putaway (Teal / Cyan Gradient) -->
            <div class="ims-menu-item" id="ims-btn-putaway">
              <div class="ims-squircle-icon grad-teal">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="23 4 23 10 17 10"></polyline>
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                </svg>
                ${stagingCount > 0 ? `<span class="ims-icon-badge">${stagingCount}</span>` : ''}
              </div>
              <span class="ims-menu-label">Putaway</span>
            </div>

            <!-- Item 4: Stock Out (Coral Red Gradient) -->
            <div class="ims-menu-item" id="ims-btn-stockout">
              <div class="ims-squircle-icon grad-coral">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              </div>
              <span class="ims-menu-label">Stock Out</span>
            </div>

            <!-- Item 5: Daily Count (Pink Magenta Gradient) -->
            <div class="ims-menu-item" id="ims-btn-dailycount">
              <div class="ims-squircle-icon grad-magenta">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                  <path d="m9 12 2 2 4-4"></path>
                </svg>
              </div>
              <span class="ims-menu-label">Daily Count</span>
            </div>

            <!-- Item 6: Onhand (Warm Orange Gradient) -->
            <div class="ims-menu-item" id="ims-btn-onhand">
              <div class="ims-squircle-icon grad-peach">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 2 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 20 16z"></path>
                </svg>
              </div>
              <span class="ims-menu-label">Onhand</span>
            </div>

            <!-- Item 7: Measurements (Cyan Blue Gradient) -->
            <div class="ims-menu-item" id="ims-btn-measurements">
              <div class="ims-squircle-icon grad-cyan">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4 7V4h3"></path>
                  <path d="M20 7V4h-3"></path>
                  <path d="M4 17v3h3"></path>
                  <path d="M20 17v3h-3"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </div>
              <span class="ims-menu-label">Measurements</span>
            </div>

            <!-- Item 8: Stock Storage (Emerald Green Gradient) -->
            <div class="ims-menu-item" id="ims-btn-storage">
              <div class="ims-squircle-icon grad-emerald">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                  <rect x="8" y="2" width="8" height="4" rx="1"></rect>
                  <path d="m9 14 2 2 4-4"></path>
                </svg>
              </div>
              <span class="ims-menu-label">Stock Storage</span>
            </div>

            <!-- Item 9: Barang Lebih (Coral Peach Gradient) -->
            <div class="ims-menu-item" id="ims-btn-overstock">
              <div class="ims-squircle-icon grad-coral-soft">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </div>
              <span class="ims-menu-label">Barang Lebih</span>
            </div>

          </div>

          <!-- Bottom Branding & Copyright -->
          <div class="ims-footer-section">
            <div class="ims-footer-version">
              <span class="ims-mini-logo">🏭</span>
              <span>IMS MOBILE V2.5</span>
            </div>
            <div class="ims-footer-copyright">
              © 2026 Dhanielo-Martinz, All Rights Reserved.
            </div>
          </div>

        </div>

        <!-- Floating iOS Bottom Navigation Bar with Elevated Center FAB -->
        <nav class="ims-bottom-navbar">
          <!-- Left Tab: Home -->
          <button class="ims-nav-item active" id="ims-nav-home" title="Halaman Utama">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <span>Home</span>
          </button>

          <!-- Center Floating Elevated FAB Button: Universal Scanner -->
          <div class="ims-fab-container">
            <button class="ims-fab-button" id="ims-center-scanner-btn" title="Buka Kamera Barcode Scanner (Hotkey F2)">
              <div class="ims-fab-inner">
                <span class="ims-fab-text">IMS</span>
              </div>
            </button>
          </div>

          <!-- Right Tab: Logout -->
          <button class="ims-nav-item" id="ims-nav-logout" title="Keluar / Logout">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            <span>Logout</span>
          </button>
        </nav>

      </div>
    `;

    // --- Attach Click Handlers ---

    // 1. Menu Buttons
    const btnStaging = container.querySelector('#ims-btn-staging');
    if (btnStaging) {
      btnStaging.onclick = () => {
        SoundEngine.playScanSuccess();
        window.navigateTo('operator-inbound');
      };
    }

    const btnPutaway = container.querySelector('#ims-btn-putaway');
    if (btnPutaway) {
      btnPutaway.onclick = () => {
        SoundEngine.playScanSuccess();
        window.navigateTo('operator-putaway');
      };
    }

    const btnOnhand = container.querySelector('#ims-btn-onhand');
    if (btnOnhand) {
      btnOnhand.onclick = () => {
        SoundEngine.playScanSuccess();
        window.navigateTo('operator-stock');
      };
    }

    const btnStorage = container.querySelector('#ims-btn-storage');
    if (btnStorage) {
      btnStorage.onclick = () => {
        SoundEngine.playScanSuccess();
        window.navigateTo('operator-stock');
      };
    }

    const btnTransfer = container.querySelector('#ims-btn-transfer');
    if (btnTransfer) {
      btnTransfer.onclick = () => {
        SoundEngine.playScanSuccess();
        alert('Fitur Request Stock Transfer: Silakan scan item untuk request pemindahan antar gudang.');
        QRScanner.openScannerModal({
          title: 'Request Stock Transfer',
          hint: 'Scan barcode pallet / item yang akan dipindahkan',
          onScan: (code) => window.navigateTo('operator-stock')
        });
      };
    }

    const btnStockOut = container.querySelector('#ims-btn-stockout');
    if (btnStockOut) {
      btnStockOut.onclick = () => {
        SoundEngine.playScanSuccess();
        alert('Fitur Stock Out: Silakan scan barcode pengeluaran barang (Picking / Dispatch).');
        QRScanner.openScannerModal({
          title: 'Stock Out Scanner',
          hint: 'Scan barcode pallet untuk pengeluaran barang',
          onScan: (code) => window.navigateTo('operator-stock')
        });
      };
    }

    const btnDailyCount = container.querySelector('#ims-btn-dailycount');
    if (btnDailyCount) {
      btnDailyCount.onclick = () => {
        SoundEngine.playScanSuccess();
        window.navigateTo('operator-stock');
      };
    }

    const btnMeasurements = container.querySelector('#ims-btn-measurements');
    if (btnMeasurements) {
      btnMeasurements.onclick = () => {
        SoundEngine.playScanSuccess();
        alert('Fitur Dimensi & Pengukuran SKU: Silakan scan barcode produk.');
        QRScanner.openScannerModal({
          title: 'Pengukuran Dimensi SKU',
          hint: 'Scan barcode produk',
          onScan: (code) => window.navigateTo('operator-stock')
        });
      };
    }

    const btnOverstock = container.querySelector('#ims-btn-overstock');
    if (btnOverstock) {
      btnOverstock.onclick = () => {
        SoundEngine.playScanSuccess();
        window.navigateTo('operator-inbound');
      };
    }

    // 2. Summary Boxes
    const boxPutaway = container.querySelector('#stat-box-putaway');
    if (boxPutaway) boxPutaway.onclick = () => window.navigateTo('operator-putaway');

    const boxStaging = container.querySelector('#stat-box-staging');
    if (boxStaging) boxStaging.onclick = () => window.navigateTo('operator-inbound');

    // 3. Center Scanner FAB
    const centerScannerBtn = container.querySelector('#ims-center-scanner-btn');
    if (centerScannerBtn) {
      centerScannerBtn.onclick = () => {
        QRScanner.openScannerModal({
          title: 'Universal Barcode / QR Scanner',
          hint: 'Scan barang di Staging atau Rak Gudang',
          onScan: (code) => window.navigateTo('operator-stock')
        });
      };
    }

    // 4. Avatar profile dropdown or click
    const avatarBadge = container.querySelector('#ims-avatar-badge');
    if (avatarBadge) {
      avatarBadge.onclick = () => {
        if (Auth.canAccessPortal('ADMIN')) {
          if (confirm(`Beralih ke Panel Admin Desktop?`)) {
            if (window.wmsApp) window.wmsApp.switchPortal('ADMIN');
          }
        } else {
          alert(`Akun: ${user.name}\nDivisi: ${user.division}\nRole: ${roleInfo.name}`);
        }
      };
    }

    // 5. Logout in Bottom Bar
    const navLogout = container.querySelector('#ims-nav-logout');
    if (navLogout) {
      navLogout.onclick = () => {
        if (confirm(`Logout dari akun ${user.name}?`)) {
          Auth.logout();
          SoundEngine.playScanSuccess();
          if (window.wmsApp) window.wmsApp.renderLogin();
        }
      };
    }

    // 6. Notification bell click
    const btnNotif = container.querySelector('#btn-ims-notif');
    if (btnNotif) {
      btnNotif.onclick = () => {
        alert(`Status Sistem:\n- Database MySQL Connected (127.0.0.1:3306)\n- ${stagingCount} Pallet menunggu di Staging\n- ${putawayCount} Batch tersimpan di Rak`);
      };
    }
  }
};
