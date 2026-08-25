/**
 * Main Application Orchestrator, Router & Auth Guard
 * Role-Based Access Control (Daniel Imsula Super Admin & Division Roles)
 */

import { Auth, ROLES } from './data/auth.js';
import { Storage } from './data/storage.js';
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

class WMSApp {
  constructor() {
    this.currentPortal = 'ADMIN';
    this.currentView = 'admin-dashboard';
    this.viewParams = {};

    this.init();
  }

  init() {
    // If not logged in, auto show login view
    if (!Auth.isLoggedIn()) {
      this.renderLogin();
      return;
    }

    const user = Auth.getCurrentUser();
    this.currentPortal = Auth.getDefaultPortal();
    this.currentView = Auth.getDefaultView();

    this.renderHeaderUserBar();
    this.renderNavigation();
    this.renderCurrentView();

    // Subscribe to state updates
    Storage.subscribe((event) => {
      if (['PUTAWAY_COMPLETED', 'INBOUND_CREATED', 'RESET', 'SKU_UPDATED', 'LOCATION_UPDATED', 'PRODUCTS_IMPORTED'].includes(event)) {
        if (Auth.isLoggedIn()) {
          this.renderCurrentView();
          this.updatePendingBadges();
        }
      }
    });

    // Global navigation handler
    window.navigateTo = (viewId, params = {}) => {
      this.navigateTo(viewId, params);
    };

    // Global Hotkey for Barcode Scanner (F2)
    window.addEventListener('keydown', (e) => {
      if (e.key === 'F2' && Auth.isLoggedIn()) {
        e.preventDefault();
        QRScanner.openScannerModal({
          title: 'Quick Handheld Scanner',
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
  }

  renderLogin() {
    const mainContainer = document.getElementById('app-main-content');
    const navContainer = document.getElementById('app-navigation');
    const headerUserBar = document.getElementById('header-user-profile-bar');
    const portalSwitch = document.querySelector('.portal-switch-wrapper');

    if (navContainer) navContainer.innerHTML = '';
    if (headerUserBar) headerUserBar.innerHTML = '';
    if (portalSwitch) portalSwitch.style.display = 'none';

    LoginView.render(mainContainer);
  }

  onLoginSuccess(user, defaultPortal, defaultView) {
    this.currentPortal = defaultPortal;
    this.currentView = defaultView;

    const portalSwitch = document.querySelector('.portal-switch-wrapper');
    if (portalSwitch) portalSwitch.style.display = 'flex';

    this.renderHeaderUserBar();
    this.renderNavigation();
    this.renderCurrentView();
  }

  renderHeaderUserBar() {
    const user = Auth.getCurrentUser();
    const container = document.getElementById('header-user-profile-bar');
    const portalSwitch = document.querySelector('.portal-switch-wrapper');
    if (!user || !container) return;

    const roleInfo = ROLES[user.role] || { name: user.role, color: '#94a3b8' };
    const isSuperAdmin = user.role === 'SUPER_ADMIN';

    // Show/hide portal toggle buttons according to allowed portals
    const adminBtn = document.querySelector('[data-portal="ADMIN"]');
    const opBtn = document.querySelector('[data-portal="OPERATOR"]');

    if (adminBtn) adminBtn.style.display = Auth.canAccessPortal('ADMIN') ? 'inline-flex' : 'none';
    if (opBtn) opBtn.style.display = Auth.canAccessPortal('OPERATOR') ? 'inline-flex' : 'none';

    container.innerHTML = `
      <div class="user-profile-badge" id="user-profile-dropdown-btn">
        <span class="user-avatar-icon">${user.avatar || '👤'}</span>
        <div class="user-meta-info">
          <strong class="user-display-name">${user.name}</strong>
          <span class="user-role-tag" style="color: ${roleInfo.color};">${roleInfo.name}</span>
        </div>
        <button class="btn-logout" id="btn-header-logout" title="Keluar / Logout">
          🚪 Logout
        </button>
      </div>
    `;

    container.querySelector('#btn-header-logout').addEventListener('click', () => {
      if (confirm(`Logout dari akun ${user.name}?`)) {
        Auth.logout();
        SoundEngine.playScanSuccess();
        this.renderLogin();
      }
    });

    // Attach portal switch handlers
    document.querySelectorAll('.portal-switch-btn').forEach((btn) => {
      btn.onclick = () => {
        const portal = btn.dataset.portal;
        this.switchPortal(portal);
      };
    });
  }

  switchPortal(portal) {
    if (!Auth.canAccessPortal(portal)) {
      alert(`Divisi Anda (${Auth.getCurrentUser().division}) tidak memiliki akses ke ${portal} Panel.`);
      return;
    }

    this.currentPortal = portal;

    const adminBtn = document.querySelector('[data-portal="ADMIN"]');
    const opBtn = document.querySelector('[data-portal="OPERATOR"]');

    if (portal === 'ADMIN') {
      if (adminBtn) adminBtn.className = 'portal-switch-btn active';
      if (opBtn) opBtn.className = 'portal-switch-btn';
      this.currentView = Auth.canAccessView('admin-dashboard') ? 'admin-dashboard' : 'admin-stock';
    } else {
      if (adminBtn) adminBtn.className = 'portal-switch-btn';
      if (opBtn) opBtn.className = 'portal-switch-btn active operator-active';
      this.currentView = Auth.canAccessView('operator-inbound') ? 'operator-inbound' : 'operator-stock';
    }

    this.renderNavigation();
    this.renderCurrentView();
  }

  renderNavigation() {
    const navContainer = document.getElementById('app-navigation');
    if (!navContainer || !Auth.isLoggedIn()) return;

    const user = Auth.getCurrentUser();
    const isSuperAdmin = user.role === 'SUPER_ADMIN';

    if (this.currentPortal === 'OPERATOR') {
      const stagingCount = Storage.getStockItems().filter((s) => s.status === 'STAGING').length;

      const navItems = [];
      if (Auth.canAccessView('operator-inbound')) {
        navItems.push(`
          <button class="nav-tab-btn hht-active ${this.currentView === 'operator-inbound' ? 'active' : ''}" data-view="operator-inbound">
            <i class="icon-inbound"></i> Inbound Staging
          </button>
        `);
      }
      if (Auth.canAccessView('operator-putaway')) {
        navItems.push(`
          <button class="nav-tab-btn hht-active ${this.currentView === 'operator-putaway' ? 'active' : ''}" data-view="operator-putaway">
            <i class="icon-arrow-right-circle"></i> Putaway ke Rak
            ${stagingCount > 0 ? `<span class="badge badge-warning">${stagingCount}</span>` : ''}
          </button>
        `);
      }
      if (Auth.canAccessView('operator-stock')) {
        navItems.push(`
          <button class="nav-tab-btn hht-active ${this.currentView === 'operator-stock' ? 'active' : ''}" data-view="operator-stock">
            <i class="icon-search"></i> Check Stock Gudang
          </button>
        `);
      }

      navContainer.innerHTML = navItems.join('');
    } else {
      // Admin Navigation
      const navItems = [];
      if (Auth.canAccessView('admin-dashboard')) {
        navItems.push(`
          <button class="nav-tab-btn ${this.currentView === 'admin-dashboard' ? 'active' : ''}" data-view="admin-dashboard">
            <i class="icon-layout"></i> Dashboard & Tata Letak
          </button>
        `);
      }
      if (Auth.canAccessView('admin-stock')) {
        navItems.push(`
          <button class="nav-tab-btn ${this.currentView === 'admin-stock' ? 'active' : ''}" data-view="admin-stock">
            <i class="icon-grid"></i> Check Stock Gudang Besar (12 Kolom)
          </button>
        `);
      }
      if (Auth.canAccessView('admin-inbound')) {
        navItems.push(`
          <button class="nav-tab-btn ${this.currentView === 'admin-inbound' ? 'active' : ''}" data-view="admin-inbound">
            <i class="icon-file-text"></i> Dokumen Inbound (GRN)
          </button>
        `);
      }
      if (Auth.canAccessView('admin-master')) {
        navItems.push(`
          <button class="nav-tab-btn ${this.currentView === 'admin-master' ? 'active' : ''}" data-view="admin-master">
            <i class="icon-database"></i> Master Produk & Lokasi Rak
          </button>
        `);
      }
      if (Auth.canAccessView('admin-users')) {
        navItems.push(`
          <button class="nav-tab-btn ${this.currentView === 'admin-users' ? 'active' : ''}" data-view="admin-users">
            <i class="icon-user"></i> Manajemen User Divisi
          </button>
        `);
      }

      navContainer.innerHTML = navItems.join('');
    }

    // Attach click events
    navContainer.querySelectorAll('.nav-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const viewId = btn.dataset.view;
        this.navigateTo(viewId);
      });
    });
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

    // Check portal sync
    if (viewId.startsWith('operator-') && this.currentPortal !== 'OPERATOR') {
      this.switchPortal('OPERATOR');
      return;
    } else if (viewId.startsWith('admin-') && this.currentPortal !== 'ADMIN') {
      this.switchPortal('ADMIN');
      return;
    }

    this.renderNavigation();
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
      // Operator Views
      case 'operator-inbound':
        OperatorInbound.render(mainContainer, this.viewParams);
        break;
      case 'operator-putaway':
        OperatorPutaway.render(mainContainer, this.viewParams);
        break;
      case 'operator-stock':
        OperatorStock.render(mainContainer, this.viewParams);
        break;

      // Admin Views
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
        mainContainer.innerHTML = `<div class="empty-state-card">Halaman tidak ditemukan atau tidak memiliki izin akses.</div>`;
    }
  }

  updatePendingBadges() {
    this.renderNavigation();
  }
}

// Boot application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.wmsApp = new WMSApp();
});
