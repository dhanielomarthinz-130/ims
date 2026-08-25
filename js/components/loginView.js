/**
 * Login & Role Authentication View for WMS
 * Supports Daniel Imsula (Super Admin) and Division Role logins.
 */

import { Auth, INITIAL_USERS } from '../data/auth.js';
import { SoundEngine } from '../utils/soundEffects.js';

export const LoginView = {
  render: function (container) {
    container.innerHTML = `
      <div class="login-page-wrapper">
        <div class="login-card">
          <!-- Logo & Brand Header -->
          <div class="login-brand">
            <div class="login-logo-icon">📦</div>
            <h2>WMS SMART INVENTORY</h2>
            <p>Warehouse Management System • Multi-Division Access</p>
          </div>

          <!-- Login Form -->
          <form id="wms-login-form" class="login-form">
            <div class="form-group">
              <label for="login-username"><i class="icon-user"></i> Username atau Nama Lengkap</label>
              <input
                type="text"
                id="login-username"
                class="hht-input"
                placeholder="Contoh: daniel atau Daniel Imsula"
                value="daniel"
                required
                autofocus
              />
            </div>

            <div class="form-group">
              <label for="login-password"><i class="icon-keyboard"></i> Password</label>
              <div class="password-input-wrapper">
                <input
                  type="password"
                  id="login-password"
                  class="hht-input"
                  placeholder="Masukkan Password..."
                  value="Dh@niel0"
                  required
                />
                <button type="button" class="btn-toggle-pwd" id="btn-toggle-pwd" title="Tampilkan/Sembunyikan Password">
                  👁️
                </button>
              </div>
            </div>

            <div id="login-error-msg" class="login-error-alert" style="display: none;"></div>

            <button type="submit" class="btn btn-primary btn-lg btn-block" id="btn-submit-login">
              <i class="icon-check"></i> Masuk ke Sistem (Login)
            </button>
          </form>

          <!-- Quick Role Selector for Testing -->
          <div class="login-quick-roles">
            <div class="quick-roles-title">
              <span>Pilih Cepat Akun Divisi (Quick Switch)</span>
            </div>
            <div class="quick-role-buttons-grid">
              ${INITIAL_USERS.map((u) => {
                const isSuper = u.role === 'SUPER_ADMIN';
                return `
                <button
                  type="button"
                  class="btn-quick-user ${isSuper ? 'btn-quick-super' : ''}"
                  data-username="${u.username}"
                  data-password="${u.password}"
                >
                  <span class="q-avatar">${u.avatar}</span>
                  <div class="q-info">
                    <strong class="q-name">${u.name}</strong>
                    <span class="q-div">${u.division}</span>
                  </div>
                </button>
              `;
              }).join('')}
            </div>
          </div>

          <div class="login-footer-info">
            <small>Warehouse Management System • Hak Akses Terproteksi Role Base</small>
          </div>
        </div>
      </div>
    `;

    this.attachEvents(container);
  },

  attachEvents: function (container) {
    const form = container.querySelector('#wms-login-form');
    const userInput = container.querySelector('#login-username');
    const pwdInput = container.querySelector('#login-password');
    const errorAlert = container.querySelector('#login-error-msg');
    const togglePwdBtn = container.querySelector('#btn-toggle-pwd');

    // Toggle password visibility
    togglePwdBtn.addEventListener('click', () => {
      if (pwdInput.type === 'password') {
        pwdInput.type = 'text';
        togglePwdBtn.innerText = '🙈';
      } else {
        pwdInput.type = 'password';
        togglePwdBtn.innerText = '👁️';
      }
    });

    // Form Submit
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      errorAlert.style.display = 'none';

      const username = userInput.value;
      const password = pwdInput.value;

      const res = Auth.login(username, password);
      if (res.success) {
        SoundEngine.playScanSuccess();
        const defaultView = Auth.getDefaultView();
        const defaultPortal = Auth.getDefaultPortal();
        
        if (window.wmsApp) {
          window.wmsApp.onLoginSuccess(res.user, defaultPortal, defaultView);
        }
      } else {
        SoundEngine.playErrorBuzzer();
        errorAlert.innerText = res.message;
        errorAlert.style.display = 'block';
      }
    });

    // Quick role chips
    container.querySelectorAll('.btn-quick-user').forEach((btn) => {
      btn.addEventListener('click', () => {
        userInput.value = btn.dataset.username;
        pwdInput.value = btn.dataset.password;
        form.requestSubmit();
      });
    });
  }
};
