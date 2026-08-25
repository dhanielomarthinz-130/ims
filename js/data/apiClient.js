/**
 * API Client Adapter for PHP & MySQL Backend
 * Provides unified promise-based access to WMS REST endpoints with offline fallback.
 */

class ApiClient {
  constructor() {
    this.baseUrl = 'api';
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}/${endpoint}`;
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      const json = await response.json();
      return json;
    } catch (err) {
      console.warn(`API request to ${endpoint} failed:`, err);
      return { success: false, message: 'Gagal menghubungi server PHP API: ' + err.message };
    }
  }

  // --- Auth APIs ---
  async login(username, password) {
    return await this.request('auth.php?action=login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  }

  async getMe() {
    return await this.request('auth.php?action=me');
  }

  async logout() {
    return await this.request('auth.php?action=logout', { method: 'POST' });
  }

  async getUsers() {
    return await this.request('auth.php?action=users');
  }

  async addUser(userObj) {
    return await this.request('auth.php?action=add_user', {
      method: 'POST',
      body: JSON.stringify(userObj)
    });
  }

  async deleteUser(userId) {
    return await this.request(`auth.php?action=delete_user&id=${encodeURIComponent(userId)}`, {
      method: 'POST'
    });
  }

  // --- Stock & SAP Reconciliation APIs ---
  async getStockReconciliation() {
    return await this.request('stock.php?action=reconciliation');
  }

  async getStockItems(status = 'ALL', location = 'ALL') {
    return await this.request(`stock.php?action=items&status=${encodeURIComponent(status)}&location=${encodeURIComponent(location)}`);
  }

  async importProducts(products, mode = 'MERGE') {
    return await this.request('stock.php?action=import', {
      method: 'POST',
      body: JSON.stringify({ products, mode })
    });
  }

  // --- Inbound APIs ---
  async getInboundDocs() {
    return await this.request('inbound.php?action=list');
  }

  async createInbound(inboundData) {
    return await this.request('inbound.php?action=create', {
      method: 'POST',
      body: JSON.stringify(inboundData)
    });
  }

  // --- Putaway & Movement APIs ---
  async getStagingQueue() {
    return await this.request('putaway.php?action=staging_queue');
  }

  async suggestRack(sku = '', lpId = '') {
    return await this.request(`putaway.php?action=suggest_rack&sku=${encodeURIComponent(sku)}&lp_id=${encodeURIComponent(lpId)}`);
  }

  async confirmPutaway(lpId, targetLocation, operatorName, operatorId = '') {
    return await this.request('putaway.php?action=confirm_putaway', {
      method: 'POST',
      body: JSON.stringify({
        lpId,
        targetLocation,
        operatorName,
        operatorId
      })
    });
  }

  async getMovementLogs(limit = 20) {
    return await this.request(`putaway.php?action=logs&limit=${limit}`);
  }

  // --- Master Data APIs ---
  async getMasterData() {
    return await this.request('master.php?action=all');
  }

  async addSku(skuData) {
    return await this.request('master.php?action=add_sku', {
      method: 'POST',
      body: JSON.stringify(skuData)
    });
  }

  async addLocation(locData) {
    return await this.request('master.php?action=add_location', {
      method: 'POST',
      body: JSON.stringify(locData)
    });
  }

  // --- Dashboard & Metrics APIs ---
  async getDashboardMetrics() {
    return await this.request('dashboard.php');
  }

  // --- Reset Database API ---
  async resetDatabase() {
    return await this.request('reset.php', { method: 'POST' });
  }
}

export const API = new ApiClient();
