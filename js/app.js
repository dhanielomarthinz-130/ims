/**
 * Main Application Orchestrator, Router & Auth Guard
 * Enterprise Sidebar Architecture with Role-Based Access Control
 */

import { Auth, ROLES } from './data/auth.js';
import { Storage } from './data/storage.js';
import { SupabaseClient } from './data/supabaseClient.js';
import { LoginView } from './components/loginView.js';
import { OperatorInbound } from './components/operatorInbound.js';
import { OperatorPutaway } from './components/operatorPutaway.js';
import { OperatorStock } from './components/operatorStock.js';
import { AdminDashboard } from './components/adminDashboard.js';
import { AdminStock } from './components/adminStock.js';
import { AdminInbound } from './components/adminInbound.js';
import { AdminMaster } from './components/adminMaster.js';
import { AdminUsers } from './components/adminUsers.js';
import { QRScanner } from './components/qrScanner.js';
import { SoundEngine } from './utils/soundEffects.js';

const STORAGE_KEY_SIDEBAR_COLLAPSED = 'wms_sidebar_collapsed_v1';

class WMSApp {
  constructor() {
    this.currentPortal = 'ADMIN';
    this.currentView = 'admin-dashboard';
    this.viewParams = {};
    this.isSidebarCollapsed = localStorage.getItem(STORAGE_KEY_SIDEBAR_COLLAPSED) === 'true';

    this.init();
  }

  init() {
    // Check authentication
    if (!Auth.isLoggedIn()) {
      this.renderLogin();
      this.attachGlobalEvents();
      return;
    }

    const user = Auth.getCurrentUser();
    
    // Auto route based on user role requirement
    this.currentPortal = Auth.getDefaultPortal();
    this.currentView = Auth.getDefaultView();

    this.applySidebarState();
    this.renderSidebar();
    this.renderTopbar();
    this.renderCurrentView();

    // Subscribe to database / storage updates
    Storage.subscribe((event) => {
      if (['PUTAWAY_COMPLETED', 'INBOUND_CREATED', 'RESET', 'SKU_UPDATED', 'LOCATION_UPDATED', 'PRODUCTS_IMPORTED'].includes(event)) {
        if (Auth.isLoggedIn()) {
          this.renderCurrentView();
          this.updatePendingBadges();
        }
      }
    });

    // Global navigation helper
    window.navigateTo = (viewId, params = {}) => {
      this.navigateTo(viewId, params);
    };

    // Attach global window events & shortcuts
    this.attachGlobalEvents();
  }

  attachGlobalEvents() {
    // Global Hotkey for Barcode Scanner (F2)
    window.addEventListener('keydown', (e) => {
      if (e.key === 'F2' && Auth.isLoggedIn()) {
        e.preventDefault();
        QRScanner.openScannerModal({
          title: 'Quick Handheld Barcode Scanner',
          hint: 'Scan barang di Staging atau Rak Gudang',
          onScan: (code) => {
            if (this.currentView === 'operator-putaway') {
              window.navigateTo('operator-putaway', { autoScanLP: code });
            } else {
              window.navigateTo('operator-stock');
            }
          }
        });
      }
    });

    // Sidebar collapse button
    const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
    if (btnToggleSidebar) {
      btnToggleSidebar.onclick = () => this.toggleSidebar();
    }

    // Mobile menu drawer buttons
    const btnMobileMenu = document.getElementById('btn-mobile-menu');
    const sidebarBackdrop = document.getElementById('sidebar-backdrop');

    if (btnMobileMenu) {
      btnMobileMenu.onclick = () => this.toggleMobileDrawer(true);
    }
    if (sidebarBackdrop) {
      sidebarBackdrop.onclick = () => this.toggleMobileDrawer(false);
    }

    // Supabase config modal button
    const btnSupabase = document.getElementById('btn-supabase-status');
    if (btnSupabase) {
      btnSupabase.onclick = () => {
        SupabaseClient.openConfigModal(() => {
          this.updateDatabaseStatus();
          this.renderCurrentView();
        });
      };
    }

    // Quick Scanner Topbar button
    const btnQuickScanner = document.getElementById('btn-quick-scanner');
    if (btnQuickScanner) {
      btnQuickScanner.onclick = () => {
        if (!Auth.isLoggedIn()) {
          alert('Silakan login terlebih dahulu untuk menggunakan scanner.');
          return;
        }
        QRScanner.openScannerModal({
          title: 'Universal Barcode / QR Scanner',
          hint: 'Scan barang di Staging atau Rak Gudang',
          onScan: (code) => {
            if (this.currentView === 'operator-putaway') {
              window.navigateTo('operator-putaway', { autoScanLP: code });
            } else {
              window.navigateTo('operator-stock');
            }
          }
        });
      };
    }

    // Reset database button
    const btnReset = document.getElementById('btn-reset-database');
    if (btnReset) {
      btnReset.onclick = () => {
        if (confirm('Apakah Anda yakin ingin mereset seluruh data inventori ke data demo awal?')) {
          Storage.resetToDefaults();
          SoundEngine.playScanSuccess();
          alert('Data inventori berhasil direset ke kondisi demo awal!');
          this.renderCurrentView();
        }
      };
    }
  }

  applySidebarState() {
    const sidebar = document.getElementById('app-sidebar');
    if (sidebar) {
      if (this.isSidebarCollapsed) {
        sidebar.classList.add('sidebar-collapsed');
      } else {
        sidebar.classList.remove('sidebar-collapsed');
      }
    }
  }

  toggleSidebar() {
    const sidebar = document.getElementById('app-sidebar');
    if (!sidebar) return;

    this.isSidebarCollapsed = !this.isSidebarCollapsed;
    localStorage.setItem(STORAGE_KEY_SIDEBAR_COLLAPSED, this.isSidebarCollapsed ? 'true' : 'false');
    this.applySidebarState();
  }

  toggleMobileDrawer(open) {
    const sidebar = document.getElementById('app-sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    if (!sidebar || !backdrop) return;

    if (open) {
      sidebar.classList.add('mobile-open');
      backdrop.classList.add('active');
    } else {
      sidebar.classList.remove('mobile-open');
      backdrop.classList.remove('active');
    }
  }

  renderLogin() {
    const layout = document.getElementById('app-layout');
    const sidebar = document.getElementById('app-sidebar');
    const topbar = document.getElementById('app-topbar');
    const mainContainer = document.getElementById('app-main-content');

    if (sidebar) sidebar.style.display = 'none';
    if (topbar) topbar.style.display = 'none';
    if (layout) layout.style.display = 'block';

    LoginView.render(mainContainer);
  }

  onLoginSuccess(user, defaultPortal, defaultView) {
    const layout = document.getElementById('app-layout');
    const sidebar = document.getElementById('app-sidebar');
    const topbar = document.getElementById('app-topbar');

    if (sidebar) sidebar.style.display = 'flex';
    if (topbar) topbar.style.display = 'flex';
    if (layout) layout.style.display = 'flex';

    // Direct routing based on Operator vs Admin role
    this.currentPortal = defaultPortal;
    this.currentView = defaultView;

    this.renderSidebar();
    this.renderTopbar();
    this.renderCurrentView();
  }

  renderSidebar() {
    const sidebarNav = document.getElementById('app-sidebar-nav');
    const sidebarUserFooter = document.getElementById('sidebar-user-footer');
    const portalSection = document.getElementById('sidebar-portal-section');
    const user = Auth.getCurrentUser();

    if (!sidebarNav || !sidebarUserFooter || !user) return;

    const roleInfo = ROLES[user.role] || { name: user.role, color: '#94a3b8' };
    const canAccessAdmin = Auth.canAccessPortal('ADMIN');
    const canAccessOperator = Auth.canAccessPortal('OPERATOR');

    // Portal Switcher buttons
    const adminTab = document.getElementById('switch-admin');
    const opTab = document.getElementById('switch-operator');

    if (adminTab) adminTab.style.display = canAccessAdmin ? 'flex' : 'none';
    if (opTab) opTab.style.display = canAccessOperator ? 'flex' : 'none';

    if (this.currentPortal === 'ADMIN') {
      if (adminTab) adminTab.className = 'portal-tab-btn active';
      if (opTab) opTab.className = 'portal-tab-btn';
    } else {
      if (adminTab) adminTab.className = 'portal-tab-btn';
      if (opTab) opTab.className = 'portal-tab-btn active operator-active';
    }

    // Attach portal tab clicks
    if (adminTab) adminTab.onclick = () => this.switchPortal('ADMIN');
    if (opTab) opTab.onclick = () => this.switchPortal('OPERATOR');

    // Render Navigation Links according to Portal & Role
    const stagingCount = Storage.getStockItems().filter((s) => s.status === 'STAGING').length;

    let navHtml = '';

    if (this.currentPortal === 'OPERATOR') {
      navHtml += `<div class="nav-group-title">Operasional Handheld (HHT)</div>`;

      if (Auth.canAccessView('operator-inbound')) {
        navHtml += `
          <button class="sidebar-nav-item operator-style ${this.currentView === 'operator-inbound' ? 'active' : ''}" data-view="operator-inbound" title="Inbound Staging">
            <span class="nav-item-icon"><i class="icon-inbound"></i></span>
            <span class="nav-item-text">Inbound Staging</span>
          </button>
        `;
      }

      if (Auth.canAccessView('operator-putaway')) {
        navHtml += `
          <button class="sidebar-nav-item operator-style ${this.currentView === 'operator-putaway' ? 'active' : ''}" data-view="operator-putaway" title="Putaway ke Rak">
            <span class="nav-item-icon"><i class="icon-arrow-right-circle"></i></span>
            <span class="nav-item-text">Putaway ke Rak</span>
            ${stagingCount > 0 ? `<span class="nav-item-badge">${stagingCount}</span>` : ''}
          </button>
        `;
      }

      if (Auth.canAccessView('operator-stock')) {
        navHtml += `
          <button class="sidebar-nav-item operator-style ${this.currentView === 'operator-stock' ? 'active' : ''}" data-view="operator-stock" title="Cek Stock Gudang">
            <span class="nav-item-icon"><i class="icon-search"></i></span>
            <span class="nav-item-text">Cek Stock Gudang</span>
          </button>
        `;
      }
    } else {
      // Desktop Admin Panel Navigation
      navHtml += `<div class="nav-group-title">Menu Utama</div>`;

      if (Auth.canAccessView('admin-dashboard')) {
        navHtml += `
          <button class="sidebar-nav-item ${this.currentView === 'admin-dashboard' ? 'active' : ''}" data-view="admin-dashboard" title="Dashboard & Tata Letak">
            <span class="nav-item-icon"><i class="icon-layout"></i></span>
            <span class="nav-item-text">Dashboard & Tata Letak</span>
          </button>
        `;
      }

      if (Auth.canAccessView('admin-stock')) {
        navHtml += `
          <button class="sidebar-nav-item ${this.currentView === 'admin-stock' ? 'active' : ''}" data-view="admin-stock" title="Check Stock 12 Kolom SAP">
            <span class="nav-item-icon"><i class="icon-grid"></i></span>
            <span class="nav-item-text">Check Stock 12 Kolom SAP</span>
          </button>
        `;
      }

      if (Auth.canAccessView('admin-inbound')) {
        navHtml += `
          <button class="sidebar-nav-item ${this.currentView === 'admin-inbound' ? 'active' : ''}" data-view="admin-inbound" title="Dokumen Inbound (GRN)">
            <span class="nav-item-icon"><i class="icon-file-text"></i></span>
            <span class="nav-item-text">Dokumen Inbound (GRN)</span>
          </button>
        `;
      }

      const hasMaster = Auth.canAccessView('admin-master') || Auth.canAccessView('admin-users');
      if (hasMaster) {
        navHtml += `<div class="nav-group-title">Master Data & Pengaturan</div>`;

        if (Auth.canAccessView('admin-master')) {
          navHtml += `
            <button class="sidebar-nav-item ${this.currentView === 'admin-master' ? 'active' : ''}" data-view="admin-master" title="Master Produk & Lokasi Rak">
              <span class="nav-item-icon"><i class="icon-database"></i></span>
              <span class="nav-item-text">Master Produk & Rak</span>
            </button>
          `;
        }

        if (Auth.canAccessView('admin-users')) {
          navHtml += `
            <button class="sidebar-nav-item ${this.currentView === 'admin-users' ? 'active' : ''}" data-view="admin-users" title="Manajemen User Divisi">
              <span class="nav-item-icon"><i class="icon-user"></i></span>
              <span class="nav-item-text">Manajemen User</span>
            </button>
          `;
        }
      }
    }

    sidebarNav.innerHTML = navHtml;

    // Attach click events to nav buttons
    sidebarNav.querySelectorAll('.sidebar-nav-item').forEach((btn) => {
      btn.addEventListener('click', () => {
        const viewId = btn.dataset.view;
        this.navigateTo(viewId);
        this.toggleMobileDrawer(false);
      });
    });

    // Render User Profile Footer in Sidebar
    sidebarUserFooter.innerHTML = `
      <div class="sidebar-user-card">
        <div class="user-avatar-pill">${user.avatar || '👤'}</div>
        <div class="user-meta-info">
          <span class="user-name-text">${user.name}</span>
          <span class="user-role-pill" style="color: ${roleInfo.color};">${roleInfo.name}</span>
        </div>
      </div>
      <button class="btn-logout-sidebar" id="btn-sidebar-logout" title="Keluar / Logout">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          <polyline points="16 17 21 12 16 7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
      </button>
    `;

    sidebarUserFooter.querySelector('#btn-sidebar-logout').onclick = () => {
      if (confirm(`Logout dari akun ${user.name}?`)) {
        Auth.logout();
        SoundEngine.playScanSuccess();
        this.renderLogin();
      }
    };
  }

  renderTopbar() {
    const pageTitleElem = document.getElementById('topbar-current-page');
    if (pageTitleElem) {
      const viewNames = {
        'admin-dashboard': 'Dashboard & Tata Letak',
        'admin-stock': 'Check Stock Gudang Besar (12 Kolom SAP)',
        'admin-inbound': 'Dokumen Inbound (GRN)',
        'admin-master': 'Master Produk & Lokasi Rak',
        'admin-users': 'Manajemen User & Hak Akses Divisi',
        'operator-inbound': 'Inbound Penerimaan Staging',
        'operator-putaway': 'Putaway ke Rak Gudang',
        'operator-stock': 'Check Stock Handheld'
      };
      pageTitleElem.innerText = viewNames[this.currentView] || 'Overview';
    }

    this.updateDatabaseStatus();
  }

  updateDatabaseStatus() {
    const statusDot = document.querySelector('.status-indicator-dot');
    const statusLabel = document.getElementById('lbl-supabase-status');
    const isConfigured = SupabaseClient.isConfigured();

    if (statusDot && statusLabel) {
      if (isConfigured) {
        statusDot.className = 'status-indicator-dot dot-active';
        statusLabel.innerText = 'Supabase Cloud: Terhubung';
      } else {
        statusDot.className = 'status-indicator-dot dot-local';
        statusLabel.innerText = 'Database: Local Storage';
      }
    }
  }

  switchPortal(portal) {
    if (!Auth.canAccessPortal(portal)) {
      alert(`Divisi Anda (${Auth.getCurrentUser().division}) tidak memiliki akses ke ${portal} Panel.`);
      return;
    }

    this.currentPortal = portal;

    if (portal === 'ADMIN') {
      this.currentView = Auth.canAccessView('admin-dashboard') ? 'admin-dashboard' : 'admin-stock';
    } else {
      this.currentView = Auth.canAccessView('operator-inbound') ? 'operator-inbound' : 'operator-stock';
    }

    this.renderSidebar();
    this.renderTopbar();
    this.renderCurrentView();
  }

  navigateTo(viewId, params = {}) {
    if (!Auth.isLoggedIn()) {
      this.renderLogin();
      return;
    }

    if (!Auth.canAccessView(viewId)) {
      alert(`Akses Ditolak: Divisi Anda tidak memiliki hak akses ke menu ini.`);
      return;
    }

    this.currentView = viewId;
    this.viewParams = params;

    // Synchronize portal if view starts with different prefix
    if (viewId.startsWith('operator-') && this.currentPortal !== 'OPERATOR') {
      this.currentPortal = 'OPERATOR';
    } else if (viewId.startsWith('admin-') && this.currentPortal !== 'ADMIN') {
      this.currentPortal = 'ADMIN';
    }

    this.renderSidebar();
    this.renderTopbar();
    this.renderCurrentView();
  }

  renderCurrentView() {
    const mainContainer = document.getElementById('app-main-content');
    if (!mainContainer) return;

    if (!Auth.isLoggedIn()) {
      this.renderLogin();
      return;
    }

    switch (this.currentView) {
      // Operator Handheld Views
      case 'operator-inbound':
        OperatorInbound.render(mainContainer, this.viewParams);
        break;
      case 'operator-putaway':
        OperatorPutaway.render(mainContainer, this.viewParams);
        break;
      case 'operator-stock':
        OperatorStock.render(mainContainer, this.viewParams);
        break;

      // Desktop Admin Views
      case 'admin-dashboard':
        AdminDashboard.render(mainContainer, this.viewParams);
        break;
      case 'admin-stock':
        AdminStock.render(mainContainer, this.viewParams);
        break;
      case 'admin-inbound':
        AdminInbound.render(mainContainer, this.viewParams);
        break;
      case 'admin-master':
        AdminMaster.render(mainContainer, this.viewParams);
        break;
      case 'admin-users':
        AdminUsers.render(mainContainer, this.viewParams);
        break;

      default:
        mainContainer.innerHTML = `
          <div class="admin-card text-center py-5">
            <h3 style="color: #ef4444; margin-bottom: 0.5rem;">Halaman Tidak Ditemukan</h3>
            <p class="text-muted">Menu ini tidak tersedia atau akun Anda tidak memiliki hak akses.</p>
          </div>
        `;
    }
  }

  updatePendingBadges() {
    this.renderSidebar();
  }
}

// Robust bootstrap initialization
function bootWMS() {
  if (!window.wmsApp) {
    try {
      window.wmsApp = new WMSApp();
    } catch (err) {
      console.error('Error booting WMS Application:', err);
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootWMS);
} else {
  bootWMS();
}
