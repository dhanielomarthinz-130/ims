/**
 * Role-Based Access Control (RBAC) & Authentication Manager for WMS (PHP & MySQL Backend Integrated)
 * Pre-configured accounts for Daniel Imsula (Super Admin) and Division Roles.
 */

import { API } from './apiClient.js';

const STORAGE_KEY_AUTH = 'wms_auth_session_v1';
const STORAGE_KEY_USERS = 'wms_custom_users_v1';

export const ROLES = {
  SUPER_ADMIN: {
    id: 'SUPER_ADMIN',
    name: 'Super Administrator',
    badgeClass: 'badge-super-admin',
    color: '#8b5cf6',
    allowedPortals: ['ADMIN', 'OPERATOR'],
    allowedViews: [
      'operator-home',
      'operator-inbound',
      'operator-putaway',
      'operator-stock',
      'admin-dashboard',
      'admin-stock',
      'admin-inbound',
      'admin-master',
      'admin-users'
    ]
  },
  INBOUND: {
    id: 'INBOUND',
    name: 'Devisi Inbound (Staging)',
    badgeClass: 'badge-inbound',
    color: '#f59e0b',
    allowedPortals: ['OPERATOR'],
    allowedViews: ['operator-home', 'operator-inbound', 'operator-stock']
  },
  PUTAWAY: {
    id: 'PUTAWAY',
    name: 'Devisi Putaway (Rak Gudang)',
    badgeClass: 'badge-putaway',
    color: '#3b82f6',
    allowedPortals: ['OPERATOR'],
    allowedViews: ['operator-home', 'operator-putaway', 'operator-stock']
  },
  CHECKER: {
    id: 'CHECKER',
    name: 'Devisi Inventory Control (Checker)',
    badgeClass: 'badge-checker',
    color: '#10b981',
    allowedPortals: ['ADMIN', 'OPERATOR'],
    allowedViews: ['operator-home', 'admin-stock', 'operator-stock']
  },
  SUPERVISOR: {
    id: 'SUPERVISOR',
    name: 'Devisi Supervisor Gudang',
    badgeClass: 'badge-supervisor',
    color: '#06b6d4',
    allowedPortals: ['ADMIN', 'OPERATOR'],
    allowedViews: ['operator-home', 'admin-dashboard', 'admin-inbound', 'admin-stock', 'operator-stock']
  }
};

export const INITIAL_USERS = [
  {
    id: 'USR-001',
    username: 'daniel',
    password: 'Dh@niel0',
    name: 'Daniel Imsula',
    role: 'SUPER_ADMIN',
    division: 'Super Administrator',
    avatar: '👑',
    status: 'ACTIVE',
    createdAt: '2026-08-25T08:00:00Z'
  },
  {
    id: 'USR-002',
    username: 'inbound.op',
    password: 'inbound123',
    name: 'Budi Santoso (Inbound)',
    role: 'INBOUND',
    division: 'Inbound Staging Area',
    avatar: '📥',
    status: 'ACTIVE',
    createdAt: '2026-08-25T08:00:00Z'
  },
  {
    id: 'USR-003',
    username: 'putaway.op',
    password: 'putaway123',
    name: 'Rian Pratama (Putaway)',
    role: 'PUTAWAY',
    division: 'Warehouse Putaway & Rack Movement',
    avatar: '🚜',
    status: 'ACTIVE',
    createdAt: '2026-08-25T08:00:00Z'
  },
  {
    id: 'USR-004',
    username: 'checker.ic',
    password: 'checker123',
    name: 'Siti Rahma (IC Checker)',
    role: 'CHECKER',
    division: 'Inventory Control & Audit',
    avatar: '🔍',
    status: 'ACTIVE',
    createdAt: '2026-08-25T08:00:00Z'
  },
  {
    id: 'USR-005',
    username: 'supervisor',
    password: 'spv123',
    name: 'Hendro Wijaya (Supervisor)',
    role: 'SUPERVISOR',
    division: 'Warehouse Operations Supervisor',
    avatar: '👔',
    status: 'ACTIVE',
    createdAt: '2026-08-25T08:00:00Z'
  }
];

class AuthManager {
  constructor() {
    this.currentUser = null;
    this.init();
  }

  init() {
    // Check saved session
    const rawSession = localStorage.getItem(STORAGE_KEY_AUTH);
    if (rawSession) {
      try {
        this.currentUser = JSON.parse(rawSession);
      } catch (e) {
        this.currentUser = null;
      }
    }
  }

  getUsers() {
    const raw = localStorage.getItem(STORAGE_KEY_USERS);
    return raw ? JSON.parse(raw) : INITIAL_USERS;
  }

  saveUsers(users) {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  }

  addUser(userObj) {
    const users = this.getUsers();
    const existing = users.find((u) => u.username.toLowerCase() === userObj.username.toLowerCase());
    if (existing) {
      return { success: false, message: `Username "${userObj.username}" sudah digunakan.` };
    }
    const newUser = {
      ...userObj,
      id: `USR-${Date.now()}`,
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    this.saveUsers(users);

    // Sync to MySQL
    API.addUser(newUser).catch((e) => console.warn('Add user MySQL error:', e));

    return { success: true, user: newUser };
  }

  deleteUser(userId) {
    const users = this.getUsers().filter((u) => u.id !== userId);
    this.saveUsers(users);

    // Sync to MySQL
    API.deleteUser(userId).catch((e) => console.warn('Delete user MySQL error:', e));

    return { success: true };
  }

  login(username, password) {
    const users = this.getUsers();
    const cleanUser = (username || '').trim().toLowerCase();

    // Match username OR full name (e.g. "Daniel Imsula")
    const user = users.find(
      (u) =>
        (u.username.toLowerCase() === cleanUser || u.name.toLowerCase() === cleanUser) &&
        u.password === (password || '').trim()
    );

    if (!user) {
      return { success: false, message: 'Username atau Password salah. Silakan coba lagi.' };
    }

    if (user.status !== 'ACTIVE') {
      return { success: false, message: 'Akun Anda sedang dinonaktifkan oleh Administrator.' };
    }

    // Save session
    this.currentUser = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      division: user.division,
      avatar: user.avatar,
      loggedInAt: new Date().toISOString()
    };

    localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(this.currentUser));

    // Send async login to PHP backend
    API.login(username, password).catch((e) => console.warn('Backend login log error:', e));

    return { success: true, user: this.currentUser };
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem(STORAGE_KEY_AUTH);
    API.logout().catch((e) => console.warn('Backend logout error:', e));
  }

  getCurrentUser() {
    return this.currentUser;
  }

  isLoggedIn() {
    return this.currentUser !== null;
  }

  /**
   * Checks if current user can access a specific portal ('ADMIN' | 'OPERATOR')
   */
  canAccessPortal(portal) {
    if (!this.currentUser) return false;
    const roleDef = ROLES[this.currentUser.role];
    if (!roleDef) return false;
    return roleDef.allowedPortals.includes(portal);
  }

  /**
   * Checks if current user can access a specific view
   */
  canAccessView(viewId) {
    if (!this.currentUser) return false;
    const roleDef = ROLES[this.currentUser.role];
    if (!roleDef) return false;
    return roleDef.allowedViews.includes(viewId);
  }

  /**
   * Gets default landing view for the logged-in user
   */
  getDefaultView() {
    if (!this.currentUser) return 'login';
    switch (this.currentUser.role) {
      case 'SUPER_ADMIN':
      case 'SUPERVISOR':
        return 'admin-dashboard';
      case 'CHECKER':
        return 'admin-stock';
      case 'INBOUND':
      case 'PUTAWAY':
      default:
        return 'operator-home';
    }
  }

  /**
   * Gets default portal for the logged-in user
   */
  getDefaultPortal() {
    if (!this.currentUser) return 'OPERATOR';
    switch (this.currentUser.role) {
      case 'SUPER_ADMIN':
      case 'SUPERVISOR':
      case 'CHECKER':
        return 'ADMIN';
      default:
        return 'OPERATOR';
    }
  }
}

export const Auth = new AuthManager();
