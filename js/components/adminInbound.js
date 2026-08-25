/**
 * Admin Panel: Inbound Documents & Receiving Reports Component
 * Inbound document listing, A4 Goods Receipt Note (GRN) printing, and batch QR code printing
 */

import { Storage } from '../data/storage.js';
import { Formatters } from '../utils/formatters.js';
import { OperatorInbound } from './operatorInbound.js';
import { QRCodeGenerator } from '../utils/qrLib.js';

export const AdminInbound = {
  render: function (container) {
    const docs = Storage.getInboundDocs();

    container.innerHTML = `
      <div class="admin-view-container">
        <!-- Header -->
        <div class="admin-page-header">
          <div>
            <span class="admin-section-sub">DOKUMEN & SURAT JALAN INBOUND</span>
            <h1 class="admin-page-title">Manajemen Dokumen Penerimaan Barang (GRN)</h1>
          </div>
          <div class="admin-header-actions">
            <button class="btn btn-primary" id="btn-admin-create-inbound">
              <i class="icon-plus"></i> Buat Penerimaan Inbound Baru
            </button>
          </div>
        </div>

        <!-- Inbound Documents List Card -->
        <div class="admin-card">
          <div class="admin-card-header">
            <div>
              <h3><i class="icon-file-text"></i> Daftar Dokumen Penerimaan Inbound</h3>
              <p class="card-desc">Semua dokumen barang masuk dari area Staging yang diproses via Handheld maupun Desktop.</p>
            </div>
            <div class="table-results-badge">${docs.length} Dokumen</div>
          </div>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>No. Dokumen</th>
                  <th>No. PO / Surat Jalan</th>
                  <th>Supplier / Pengirim</th>
                  <th>Waktu Penerimaan</th>
                  <th>Operator</th>
                  <th>Area Staging</th>
                  <th>Status Putaway</th>
                  <th class="text-center">Aksi</th>
                </tr>
              </thead>
              <tbody id="inbound-docs-tbody">
                ${
                  docs.length > 0
                    ? docs
                        .map((doc) => {
                          const isComplete = doc.status === 'COMPLETED';
                          const totalItems = doc.items.length;
                          const doneItems = doc.items.filter((i) => i.putawayStatus === 'DONE').length;

                          return `
                    <tr>
                      <td>
                        <strong class="font-mono">${doc.docNo}</strong>
                      </td>
                      <td>
                        <span class="font-mono text-muted">${doc.poNo}</span>
                      </td>
                      <td>
                        <strong>${doc.supplier}</strong>
                      </td>
                      <td>
                        ${Formatters.formatDateTime(doc.receivedAt)}
                      </td>
                      <td>
                        <i class="icon-user"></i> ${doc.operator}
                      </td>
                      <td>
                        <span class="badge badge-staging">${doc.stagingLocation || 'STG-01'}</span>
                      </td>
                      <td>
                        <span class="badge ${isComplete ? 'badge-success' : 'badge-warning'}">
                          ${isComplete ? 'Selesai Putaway' : `Pending (${doneItems}/${totalItems} Putaway)`}
                        </span>
                      </td>
                      <td class="text-center">
                        <div class="table-actions-group">
                          <button class="btn btn-xs btn-outline btn-view-inbound-doc" data-docno="${doc.docNo}">
                            <i class="icon-eye"></i> Detail & Cetak A4
                          </button>
                          <button class="btn btn-xs btn-secondary btn-batch-print-qr" data-docno="${doc.docNo}">
                            <i class="icon-printer"></i> Cetak QR
                          </button>
                        </div>
                      </td>
                    </tr>
                  `;
                        })
                        .join('')
                    : `<tr><td colspan="8" class="text-center py-4">Belum ada dokumen inbound.</td></tr>`
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    this.attachEvents(container);
  },

  attachEvents: function (container) {
    // View doc detail & A4 print
    container.querySelectorAll('.btn-view-inbound-doc').forEach((btn) => {
      btn.addEventListener('click', () => {
        const docNo = btn.dataset.docno;
        const doc = Storage.getInboundDoc(docNo);
        if (doc) this.showInboundDocDetailModal(doc);
      });
    });

    // Batch print QR
    container.querySelectorAll('.btn-batch-print-qr').forEach((btn) => {
      btn.addEventListener('click', () => {
        const docNo = btn.dataset.docno;
        const doc = Storage.getInboundDoc(docNo);
        if (doc && doc.items.length > 0) {
          OperatorInbound.showQRLabelModal(doc, doc.items[0]);
        }
      });
    });

    // Create inbound shortcut
    container.querySelector('#btn-admin-create-inbound').addEventListener('click', () => {
      window.navigateTo('operator-inbound');
    });
  },

  showInboundDocDetailModal: function (doc) {
    const existing = document.getElementById('inbound-detail-modal');
    if (existing) existing.remove();

    const qrDocUrl = QRCodeGenerator.generateDataURL(doc.docNo, { size: 120 });

    const modal = document.createElement('div');
    modal.id = 'inbound-detail-modal';
    modal.className = 'modal-overlay active';

    modal.innerHTML = `
      <div class="modal-card modal-lg">
        <div class="modal-header">
          <div>
            <span class="badge badge-info">Dokumen Penerimaan Barang</span>
            <h3>Surat Penerimaan Inbound: ${doc.docNo}</h3>
          </div>
          <button class="btn-close" id="btn-close-inb-modal">✕</button>
        </div>

        <div class="modal-body">
          <!-- Printable A4 Document Wrapper -->
          <div class="a4-document-paper" id="a4-inbound-paper">
            <div class="doc-header-block">
              <div class="doc-company-info">
                <h2>LOGISTIK GUDANG BESAR WMS</h2>
                <p>Kawasan Industri Distribusi Terpadu, Gedung Logistik Utama</p>
                <p>Telp: (021) 555-8899 | Email: warehouse@wms-system.local</p>
              </div>
              <div class="doc-qr-stamp">
                <img src="${qrDocUrl}" alt="Doc QR" class="doc-qr-img" />
                <span class="doc-stamp-label">${doc.docNo}</span>
              </div>
            </div>

            <div class="doc-divider"></div>

            <h3 class="doc-report-title">TANDA TERIMA BARANG MASUK (GOODS RECEIPT NOTE)</h3>

            <div class="doc-meta-grid">
              <div class="meta-column">
                <div class="meta-row"><span>Nomor Dokumen:</span> <strong>${doc.docNo}</strong></div>
                <div class="meta-row"><span>Nomor PO:</span> <strong>${doc.poNo}</strong></div>
                <div class="meta-row"><span>Area Staging:</span> <strong>${doc.stagingLocation || 'STG-01'}</strong></div>
              </div>
              <div class="meta-column">
                <div class="meta-row"><span>Supplier:</span> <strong>${doc.supplier}</strong></div>
                <div class="meta-row"><span>Waktu Diterima:</span> <strong>${Formatters.formatDateTime(doc.receivedAt)}</strong></div>
                <div class="meta-row"><span>Operator Penerima:</span> <strong>${doc.operator}</strong></div>
              </div>
            </div>

            <!-- Items Table in Document -->
            <table class="doc-items-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>License Plate (LP)</th>
                  <th>SKU</th>
                  <th>Nama Barang</th>
                  <th>Batch / Lot</th>
                  <th>Exp Date</th>
                  <th>Lokasi Rak</th>
                  <th class="text-right">Qty</th>
                  <th>Unit</th>
                </tr>
              </thead>
              <tbody>
                ${doc.items
                  .map(
                    (it, idx) => `
                  <tr>
                    <td>${idx + 1}</td>
                    <td class="font-mono"><strong>${it.lpId}</strong></td>
                    <td class="font-mono">${it.sku}</td>
                    <td><strong>${it.name}</strong></td>
                    <td><code>${it.batchNo}</code></td>
                    <td>${it.expDate}</td>
                    <td><strong>${it.location}</strong></td>
                    <td class="text-right font-bold">${it.qty}</td>
                    <td>${it.unit}</td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>

            <!-- Signature Lines -->
            <div class="doc-signatures-grid">
              <div class="sig-box">
                <p>Diserahkan Oleh (Driver/Supplier):</p>
                <div class="sig-line"></div>
                <span>( ........................................ )</span>
              </div>
              <div class="sig-box">
                <p>Diterima Oleh (Operator Staging):</p>
                <div class="sig-line"></div>
                <span>( ${doc.operator} )</span>
              </div>
              <div class="sig-box">
                <p>Disetujui Oleh (Supervisor Gudang):</p>
                <div class="sig-line"></div>
                <span>( ........................................ )</span>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-outline" id="btn-close-inb-modal-bottom">Tutup</button>
          <button class="btn btn-secondary" id="btn-print-a4-doc">
            <i class="icon-printer"></i> Cetak Dokumen A4 (Print)
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const closeModal = () => modal.remove();
    modal.querySelector('#btn-close-inb-modal').addEventListener('click', closeModal);
    modal.querySelector('#btn-close-inb-modal-bottom').addEventListener('click', closeModal);

    modal.querySelector('#btn-print-a4-doc').addEventListener('click', () => {
      window.print();
    });
  }
};
