/**
 * Admin Panel: User & Division Accounts Management Component
 * Exclusively accessible by Super Admin (Daniel Imsula) to manage staff and role permissions.
 */

import { Auth, ROLES } from '../data/auth.js';
import { Formatters } from '../utils/formatters.js';
import { SoundEngine } from '../utils/soundEffects.js';

export const AdminUsers = {
  render: function (container) {
    const users = Auth.getUsers();

    container.innerHTML = `
      <div class="admin-view-container">
        <!-- Header -->
        <div class="admin-page-header">
          <div>
            <span class="admin-section-sub">MANAJEMEN PENGGUNA & HAK AKSES</span>
            <h1 class="admin-page-title">Manajemen Akun & Divisi Gudang</h1>
          </div>
          <div class="admin-header-actions">
            <button class="btn btn-primary" id="btn-open-add-user-modal">
              <i class="icon-plus"></i> Tambah Pengguna Baru
            </button>
          </div>
        </div>

        <!-- Role Descriptions Cards -->
        <div class="roles-overview-grid">
          ${Object.values(ROLES)
            .map((r) => `
            <div class="role-overview-card" style="border-left: 4px solid ${r.color};">
              <div class="role-card-top">
                <strong style="color: ${r.color};">${r.name}</strong>
              </div>
              <p class="role-desc-text">Akses Portal: <strong>${r.allowedPortals.join(' & ')}</strong></p>
              <div class="role-views-list">
                ${r.allowedViews.map((v) => `<span class="view-tag">${v}</span>`).join('')}
              </div>
            </div>
          `).join('')}
        </div>

        <!-- User Accounts Table -->
        <div class="admin-card mt-4">
          <div class="admin-card-header">
            <div>
              <h3><i class="icon-user"></i> Daftar Akun Pengguna Aktif</h3>
              <p class="card-desc">Semua staf gudang dengan hak akses masing-masing divisi.</p>
            </div>
            <div class="table-results-badge">${users.length} Akun</div>
          </div>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Pengguna</th>
                  <th>Username</th>
                  <th>Role / Hak Akses</th>
                  <th>Divisi</th>
                  <th>Status</th>
                  <th>Waktu Dibuat</th>
                  <th class="text-center">Aksi</th>
                </tr>
              </thead>
              <tbody id="users-table-tbody">
                ${users
                  .map((u) => {
                    const roleInfo = ROLES[u.role] || { name: u.role, color: '#94a3b8' };
                    const isSuper = u.role === 'SUPER_ADMIN';

                    return `
                    <tr>
                      <td>
                        <div class="user-cell-meta">
                          <span class="user-avatar-small">${u.avatar || '👤'}</span>
                          <div>
                            <strong>${u.name}</strong>
                            ${isSuper ? '<span class="badge badge-super-admin">Super Admin</span>' : ''}
                          </div>
                        </div>
                      </td>
                      <td><code class="font-mono">${u.username}</code></td>
                      <td>
                        <span class="badge" style="background: rgba(255,255,255,0.08); border: 1px solid ${roleInfo.color}; color: ${roleInfo.color};">
                          ${roleInfo.name}
                        </span>
                      </td>
                      <td>${u.division}</td>
                      <td><span class="badge badge-success">Aktif</span></td>
                      <td><small class="text-muted">${Formatters.formatDate(u.createdAt)}</small></td>
                      <td class="text-center">
                        ${
                          !isSuper
                            ? `
                          <button class="btn btn-xs btn-outline btn-delete-user text-rose" data-userid="${u.id}" data-username="${u.username}">
                            <i class="icon-x"></i> Hapus
                          </button>
                        `
                            : '<small class="text-muted">Protected</small>'
                        }
                      </td>
                    </tr>
                  `;
                  })
                  .join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    this.attachEvents(container);
  },

  attachEvents: function (container) {
    // Add user button
    container.querySelector('#btn-open-add-user-modal').addEventListener('click', () => {
      this.showAddUserModal(container);
    });

    // Delete user button
    container.querySelectorAll('.btn-delete-user').forEach((btn) => {
      btn.addEventListener('click', () => {
        const username = btn.dataset.username;
        const userId = btn.dataset.userid;
        if (confirm(`Apakah Anda yakin ingin menghapus akun "${username}"?`)) {
          Auth.deleteUser(userId);
          SoundEngine.playScanSuccess();
          this.render(container);
        }
      });
    });
  },

  showAddUserModal: function (container) {
    const existing = document.getElementById('add-user-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'add-user-modal';
    modal.className = 'modal-overlay active';

    modal.innerHTML = `
      <div class="modal-card">
        <div class="modal-header">
          <div>
            <span class="badge badge-info">Tambah Akun</span>
            <h3>Tambah Pengguna & Divisi Baru</h3>
          </div>
          <button class="btn-close" id="btn-close-user-modal">✕</button>
        </div>

        <form id="form-add-user">
          <div class="modal-body">
            <div class="form-group">
              <label>Nama Lengkap Staf</label>
              <input type="text" id="new-user-name" class="hht-input" placeholder="Contoh: Ahmad Fauzi" required />
            </div>

            <div class="form-group-grid">
              <div class="form-group">
                <label>Username (Login)</label>
                <input type="text" id="new-user-username" class="hht-input" placeholder="Contoh: ahmad.inbound" required />
              </div>

              <div class="form-group">
                <label>Password</label>
                <input type="text" id="new-user-password" class="hht-input" value="gudang123" required />
              </div>
            </div>

            <div class="form-group">
              <label>Role / Divisi</label>
              <select id="new-user-role" class="hht-input hht-select" required>
                <option value="INBOUND">Devisi Inbound (Staging)</option>
                <option value="PUTAWAY">Devisi Putaway (Rak Gudang)</option>
                <option value="CHECKER">Devisi Inventory Control (Checker)</option>
                <option value="SUPERVISOR">Devisi Supervisor Gudang</option>
                <option value="SUPER_ADMIN">Super Administrator</option>
              </select>
            </div>

            <div class="form-group">
              <label>Nama Divisi / Penempatan</label>
              <input type="text" id="new-user-division" class="hht-input" value="Inbound Staging Area" required />
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-outline" id="btn-cancel-user-modal">Batal</button>
            <button type="submit" class="btn btn-primary">Simpan Akun Pengguna</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    const closeModal = () => modal.remove();
    modal.querySelector('#btn-close-user-modal').addEventListener('click', closeModal);
    modal.querySelector('#btn-cancel-user-modal').addEventListener('click', closeModal);

    const roleSelect = modal.querySelector('#new-user-role');
    const divInput = modal.querySelector('#new-user-division');

    roleSelect.addEventListener('change', () => {
      const val = roleSelect.value;
      if (val === 'INBOUND') divInput.value = 'Inbound Staging Area';
      else if (val === 'PUTAWAY') divInput.value = 'Warehouse Putaway & Rak';
      else if (val === 'CHECKER') divInput.value = 'Inventory Control & Audit';
      else if (val === 'SUPERVISOR') divInput.value = 'Warehouse Operations Supervisor';
      else if (val === 'SUPER_ADMIN') divInput.value = 'Super Administrator';
    });

    modal.querySelector('#form-add-user').addEventListener('submit', (e) => {
      e.preventDefault();

      const userObj = {
        name: modal.querySelector('#new-user-name').value.trim(),
        username: modal.querySelector('#new-user-username').value.trim().toLowerCase(),
        password: modal.querySelector('#new-user-password').value.trim(),
        role: roleSelect.value,
        division: divInput.value.trim(),
        avatar: roleSelect.value === 'SUPER_ADMIN' ? '👑' : roleSelect.value === 'INBOUND' ? '📥' : roleSelect.value === 'PUTAWAY' ? '🚜' : roleSelect.value === 'CHECKER' ? '🔍' : '👔'
      };

      const res = Auth.addUser(userObj);
      if (res.success) {
        SoundEngine.playScanSuccess();
        closeModal();
        this.render(container);
      } else {
        alert(res.message);
      }
    });
  }
};
