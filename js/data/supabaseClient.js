/**
 * Supabase Client Adapter & Cloud Synchronization for WMS
 * Handles PostgreSQL live connection with LocalStorage offline fallback.
 */

const STORAGE_KEY_SUPABASE = 'wms_supabase_config_v1';
const DEFAULT_SUPABASE_URL = 'https://iojseetkcyizshyrwlie.supabase.co';

class SupabaseManager {
  constructor() {
    this.client = null;
    this.config = this.loadConfig();
    this.init();
  }

  loadConfig() {
    const raw = localStorage.getItem(STORAGE_KEY_SUPABASE);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        return {
          url: parsed.url || DEFAULT_SUPABASE_URL,
          key: parsed.key || '',
          isEnabled: parsed.isEnabled || false
        };
      } catch (e) {
        return { url: DEFAULT_SUPABASE_URL, key: '', isEnabled: false };
      }
    }
    return {
      url: window.ENV_SUPABASE_URL || DEFAULT_SUPABASE_URL,
      key: window.ENV_SUPABASE_ANON_KEY || '',
      isEnabled: false
    };
  }

  saveConfig(url, key, isEnabled = true) {
    let cleanUrl = (url || DEFAULT_SUPABASE_URL).trim();
    // Remove trailing /rest/v1/ or / if present
    cleanUrl = cleanUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');

    this.config = {
      url: cleanUrl,
      key: (key || '').trim(),
      isEnabled: isEnabled && !!cleanUrl && !!key
    };
    localStorage.setItem(STORAGE_KEY_SUPABASE, JSON.stringify(this.config));
    this.init();
  }

  init() {
    if (this.config.isEnabled && this.config.url && this.config.key && window.supabase) {
      try {
        this.client = window.supabase.createClient(this.config.url, this.config.key);
      } catch (e) {
        console.warn('Failed to initialize Supabase client:', e);
        this.client = null;
      }
    } else {
      this.client = null;
    }
  }

  isConfigured() {
    return !!(this.client && this.config.isEnabled);
  }

  async testConnection() {
    if (!this.client) return { success: false, message: 'Klien Supabase belum diinisialisasi atau API Key belum diisi.' };
    try {
      const { data, error } = await this.client.from('products').select('sku').limit(1);
      if (error) throw error;
      return { success: true, message: 'Koneksi ke Supabase PostgreSQL Berhasil!' };
    } catch (err) {
      return { success: false, message: err.message || 'Gagal terhubung ke database Supabase.' };
    }
  }

  // --- Realtime / Cloud Fetchers ---
  async fetchProducts() {
    if (!this.isConfigured()) return null;
    try {
      const { data, error } = await this.client.from('products').select('*');
      if (error) throw error;
      return data;
    } catch (e) {
      console.warn('Supabase fetchProducts failed, using local storage fallback:', e);
      return null;
    }
  }

  async upsertProduct(product) {
    if (!this.isConfigured()) return false;
    try {
      const { error } = await this.client.from('products').upsert({
        sku: product.sku,
        sku_name: product.skuName || product.name,
        sap_code: product.sapCode,
        category: product.category,
        qty_rack: product.qtyRack,
        qty_sap: product.qtySap,
        qty_on_hand: product.qtyOnHand,
        qty_on_order: product.qtyOnOrder,
        available_qty: product.availableQty,
        reserve_qty: product.reserveQty,
        is_under_reserve: product.isUnderReserve,
        status: product.status,
        unit: product.unit || 'BOX',
        min_stock: product.minStock || 20
      });
      if (error) throw error;
      return true;
    } catch (e) {
      console.warn('Supabase upsertProduct failed:', e);
      return false;
    }
  }

  async logMovement(logObj) {
    if (!this.isConfigured()) return false;
    try {
      const { error } = await this.client.from('movement_logs').insert({
        id: logObj.id,
        timestamp: logObj.timestamp,
        lp_id: logObj.lpId,
        sku: logObj.sku,
        name: logObj.name,
        sap_code: logObj.sapCode,
        qty: logObj.qty,
        unit: logObj.unit,
        batch_no: logObj.batchNo,
        from_location: logObj.fromLocation,
        to_location: logObj.toLocation,
        operator: logObj.operator,
        action_type: logObj.actionType,
        notes: logObj.notes
      });
      if (error) throw error;
      return true;
    } catch (e) {
      console.warn('Supabase logMovement failed:', e);
      return false;
    }
  }

  /**
   * Opens Supabase Cloud Connection Settings Modal
   */
  openConfigModal(onSaved) {
    const existing = document.getElementById('supabase-config-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'supabase-config-modal';
    modal.className = 'modal-overlay active';

    modal.innerHTML = `
      <div class="modal-card">
        <div class="modal-header">
          <div>
            <span class="badge badge-info">Cloud Database</span>
            <h3>Konfigurasi Supabase PostgreSQL</h3>
          </div>
          <button class="btn-close" id="btn-close-supa-modal">✕</button>
        </div>

        <div class="modal-body">
          <p class="section-subtext">
            Project URL Supabase Anda telah disetel ke <code>https://iojseetkcyizshyrwlie.supabase.co</code>. Silakan masukkan <strong>Anon Public API Key</strong> Anda untuk menyelesaikan koneksi.
          </p>

          <div class="form-group">
            <label>Supabase Project URL</label>
            <input
              type="text"
              id="supa-url-input"
              class="hht-input font-mono"
              placeholder="https://iojseetkcyizshyrwlie.supabase.co"
              value="${this.config.url || DEFAULT_SUPABASE_URL}"
            />
          </div>

          <div class="form-group">
            <label>Supabase Anon Public API Key (anon public key)</label>
            <textarea
              id="supa-key-input"
              class="hht-input font-mono"
              rows="3"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            >${this.config.key || ''}</textarea>
          </div>

          <div class="form-group">
            <label class="radio-label">
              <input type="checkbox" id="supa-enable-toggle" ${this.config.isEnabled ? 'checked' : 'checked'} />
              <span>Aktifkan Sinkronisasi Cloud Supabase Realtime</span>
            </label>
          </div>

          <div id="supa-test-result" style="display: none; margin-top: 0.75rem;"></div>

          <div class="cloud-info-box mt-3" style="background: rgba(16,185,129,0.08); border: 1px solid #10b981; border-radius: 8px; padding: 10px; font-size: 0.8rem;">
            <strong>💡 Cara Mendapatkan Anon API Key:</strong>
            <ol style="margin-left: 1.25rem; margin-top: 4px;">
              <li>Di dashboard Supabase Anda, buka menu <strong>Project Settings</strong> (ikon gerigi ⚙️ di kiri bawah) $\rightarrow$ pilih <strong>Data API</strong>.</li>
              <li>Di bawah tulisan <strong>Project API keys</strong>, klik tombol <em>Copy</em> pada baris <strong>`anon` `public`</strong>.</li>
              <li>Tempelkan (Paste) key tersebut ke kotak di atas, lalu klik <strong>Test Koneksi</strong> $\rightarrow$ <strong>Simpan Konfigurasi</strong>.</li>
            </ol>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-outline" id="btn-test-supa-conn">
            ⚡ Test Koneksi
          </button>
          <button type="button" class="btn btn-primary" id="btn-save-supa-config">
            💾 Simpan Konfigurasi
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const closeModal = () => modal.remove();
    modal.querySelector('#btn-close-supa-modal').addEventListener('click', closeModal);

    const urlInp = modal.querySelector('#supa-url-input');
    const keyInp = modal.querySelector('#supa-key-input');
    const enableToggle = modal.querySelector('#supa-enable-toggle');
    const resultBox = modal.querySelector('#supa-test-result');

    // Test connection button
    modal.querySelector('#btn-test-supa-conn').addEventListener('click', async () => {
      let testUrl = urlInp.value.trim() || DEFAULT_SUPABASE_URL;
      testUrl = testUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
      const testKey = keyInp.value.trim();

      if (!testKey) {
        alert('Silakan masukkan Supabase Anon API Key terlebih dahulu.');
        return;
      }

      resultBox.style.display = 'block';
      resultBox.innerHTML = `<span class="text-amber">⏳ Menguji koneksi ke Supabase...</span>`;

      if (window.supabase) {
        try {
          const testClient = window.supabase.createClient(testUrl, testKey);
          const { data, error } = await testClient.from('products').select('sku').limit(1);
          if (error) throw error;

          resultBox.innerHTML = `<div class="badge badge-success" style="padding: 8px 12px; width: 100%;"><i class="icon-check"></i> Koneksi Berhasil! Database Supabase (iojseetkcyizshyrwlie) siap digunakan.</div>`;
        } catch (err) {
          resultBox.innerHTML = `<div class="badge badge-danger" style="padding: 8px 12px; width: 100%;"><i class="icon-x"></i> Koneksi Gagal: ${err.message}</div>`;
        }
      }
    });

    // Save config
    modal.querySelector('#btn-save-supa-config').addEventListener('click', () => {
      const url = urlInp.value.trim() || DEFAULT_SUPABASE_URL;
      const key = keyInp.value.trim();
      const isEnabled = enableToggle.checked;

      this.saveConfig(url, key, isEnabled);
      alert('Konfigurasi Supabase berhasil disimpan!');
      closeModal();
      if (onSaved) onSaved();
    });
  }
}

export const SupabaseClient = new SupabaseManager();
