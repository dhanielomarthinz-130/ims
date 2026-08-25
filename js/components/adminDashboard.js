/**
 * Admin Panel: Dashboard & Warehouse Visualizer Component
 * Executive metrics, 2D Rack Occupancy Grid, and recent activity logs
 */

import { Storage } from '../data/storage.js';
import { Formatters } from '../utils/formatters.js';

export const AdminDashboard = {
  render: function (container) {
    const stock = Storage.getStockItems();
    const skus = Storage.getSKUs();
    const locations = Storage.getLocations();
    const inboundDocs = Storage.getInboundDocs();
    const movementLogs = Storage.getMovementLogs();

    // Calculate metrics
    const stagingItems = stock.filter((s) => s.status === 'STAGING');
    const storedItems = stock.filter((s) => s.status === 'STORED');
    const totalUnits = stock.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);

    const expiringSoonItems = stock.filter((s) => {
      const exp = Formatters.getExpiryStatus(s.expDate);
      return exp.status === 'CRITICAL' || exp.status === 'EXPIRED';
    });

    const rackLocations = locations.filter((l) => l.type === 'RACK');
    const occupiedRacks = rackLocations.filter((rack) => stock.some((s) => s.location === rack.id));
    const occupancyRate = Math.round((occupiedRacks.length / (rackLocations.length || 1)) * 100);

    container.innerHTML = `
      <div class="admin-view-container">
        <!-- Page Header -->
        <div class="admin-page-header">
          <div>
            <span class="admin-section-sub">OVERVIEW & MONITORING GUDANG BESAR</span>
            <h1 class="admin-page-title">Dashboard Manajemen Inventory (WMS)</h1>
          </div>
          <div class="admin-header-actions">
            <button class="btn btn-outline" id="btn-export-full-db">
              <i class="icon-download"></i> Backup Data (JSON)
            </button>
            <button class="btn btn-primary" id="btn-goto-admin-stock">
              <i class="icon-grid"></i> Check Stock Gudang Besar
            </button>
          </div>
        </div>

        <!-- 4 Key Metric Cards -->
        <div class="metrics-grid">
          <!-- Card 1: Total Stored Stock -->
          <div class="metric-card card-blue">
            <div class="metric-icon-box"><i class="icon-box"></i></div>
            <div class="metric-content">
              <span class="metric-label">Total Stok Tersimpan di Rak</span>
              <div class="metric-value">${Formatters.formatNumber(totalUnits)} <span class="metric-unit">Unit/Pcs</span></div>
              <span class="metric-sub">${storedItems.length} Batch aktif di Rak Gudang</span>
            </div>
          </div>

          <!-- Card 2: Inbound Staging (Pending Putaway) -->
          <div class="metric-card card-amber">
            <div class="metric-icon-box"><i class="icon-clock"></i></div>
            <div class="metric-content">
              <span class="metric-label">Barang di Staging (Menunggu Putaway)</span>
              <div class="metric-value text-amber">${stagingItems.length} <span class="metric-unit">Lot/Pallet</span></div>
              <span class="metric-sub">${stagingItems.reduce((acc, curr) => acc + curr.qty, 0)} Pcs siap di-putaway</span>
            </div>
          </div>

          <!-- Card 3: Rack Capacity & Occupancy -->
          <div class="metric-card card-teal">
            <div class="metric-icon-box"><i class="icon-layers"></i></div>
            <div class="metric-content">
              <span class="metric-label">Utilitas Kapasitas Rak</span>
              <div class="metric-value">${occupancyRate}%</div>
              <div class="progress-bar-wrap">
                <div class="progress-bar-fill" style="width: ${occupancyRate}%"></div>
              </div>
              <span class="metric-sub">${occupiedRacks.length} dari ${rackLocations.length} Rak terisi</span>
            </div>
          </div>

          <!-- Card 4: FEFO / Expiry Alerts -->
          <div class="metric-card card-rose">
            <div class="metric-icon-box"><i class="icon-alert-triangle"></i></div>
            <div class="metric-content">
              <span class="metric-label">Peringatan Expired (< 30 Hari)</span>
              <div class="metric-value text-rose">${expiringSoonItems.length} <span class="metric-unit">Batch</span></div>
              <span class="metric-sub">Perlu prioritas pengeluaran (FEFO)</span>
            </div>
          </div>
        </div>

        <!-- 2D Warehouse Rack Layout Visualizer -->
        <div class="admin-card mt-4">
          <div class="admin-card-header">
            <div>
              <h3><i class="icon-layout"></i> Peta Visual Tata Letak Rak Gudang Besar (2D Visual Layout)</h3>
              <p class="card-desc">Status keterisian rak realtime (Hijau: Terisi, Abu-abu: Kosong, Kuning: Staging Area).</p>
            </div>
            <div class="layout-legend">
              <span class="legend-item"><span class="legend-dot dot-staging"></span> Area Staging</span>
              <span class="legend-item"><span class="legend-dot dot-occupied"></span> Rak Terisi</span>
              <span class="legend-item"><span class="legend-dot dot-empty"></span> Rak Kosong</span>
            </div>
          </div>

          <div class="warehouse-layout-grid">
            <!-- Staging Dock Area -->
            <div class="layout-zone zone-staging-container">
              <div class="zone-label"><i class="icon-inbound"></i> PINTU INBOUND & STAGING AREA</div>
              <div class="staging-slots-grid">
                ${locations
                  .filter((l) => l.type === 'STAGING')
                  .map((stg) => {
                    const stgItems = stock.filter((s) => s.location === stg.id);
                    return `
                    <div class="staging-slot-card ${stgItems.length > 0 ? 'has-items' : ''}">
                      <div class="slot-title">${stg.name} (${stg.id})</div>
                      <div class="slot-count">${stgItems.length} Pallet Aktif</div>
                      <div class="slot-items-preview">
                        ${stgItems.slice(0, 2).map((it) => `<span class="slot-mini-item">${it.sku}: ${it.qty} ${it.unit}</span>`).join('')}
                      </div>
                    </div>
                  `;
                  })
                  .join('')}
              </div>
            </div>

            <!-- Warehouse Main Racks Zones A, B, C, D -->
            <div class="layout-racks-container">
              ${['A', 'B', 'C', 'D']
                .map((zoneLetter) => {
                  const zoneRacks = locations.filter((l) => l.zone === zoneLetter);
                  const zoneNames = {
                    A: 'Zona A - Farmasi & High-Care',
                    B: 'Zona B - FMCG & Sembako',
                    C: 'Zona C - General Goods & Tech',
                    D: 'Zona D - Cold Storage (4°C)'
                  };

                  return `
                  <div class="rack-zone-block">
                    <div class="zone-header-title">${zoneNames[zoneLetter]}</div>
                    <div class="rack-grid-cells">
                      ${zoneRacks
                        .map((rack) => {
                          const rackItems = stock.filter((s) => s.location === rack.id);
                          const isOccupied = rackItems.length > 0;
                          return `
                          <div class="rack-cell ${isOccupied ? 'occupied' : 'empty'}" title="Rak ${rack.id}: ${isOccupied ? rackItems.map((i) => i.name + ' (' + i.qty + ')').join(', ') : 'Kosong'}">
                            <span class="rack-id-label">${rack.id}</span>
                            <div class="rack-occupancy-info">
                              ${isOccupied ? `<strong>${rackItems.reduce((acc, c) => acc + c.qty, 0)}</strong><small>pcs</small>` : '<small>Kosong</small>'}
                            </div>
                          </div>
                        `;
                        })
                        .join('')}
                    </div>
                  </div>
                `;
                })
                .join('')}
            </div>
          </div>
        </div>

        <!-- Recent Inbound & Putaway Logs (2 Columns) -->
        <div class="dashboard-split-grid mt-4">
          <!-- Left: Recent Inbound Documents -->
          <div class="admin-card">
            <div class="admin-card-header">
              <h3><i class="icon-file-text"></i> Dokumen Inbound Penerimaan Terkini</h3>
              <button class="btn btn-xs btn-outline" id="btn-goto-inbound-docs">Lihat Semua ➔</button>
            </div>
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>No. Dokumen</th>
                    <th>Supplier</th>
                    <th>Status</th>
                    <th>Total Item</th>
                  </tr>
                </thead>
                <tbody>
                  ${inboundDocs.slice(0, 5).map((doc) => `
                    <tr>
                      <td><strong>${doc.docNo}</strong><br><small class="text-muted">${doc.poNo}</small></td>
                      <td>${doc.supplier}</td>
                      <td>
                        <span class="badge ${doc.status === 'COMPLETED' ? 'badge-success' : 'badge-warning'}">
                          ${doc.status === 'COMPLETED' ? 'Selesai Putaway' : 'Staging Pending'}
                        </span>
                      </td>
                      <td><strong>${doc.items.length} Item</strong></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Right: Recent Movement Audit Trail -->
          <div class="admin-card">
            <div class="admin-card-header">
              <h3><i class="icon-activity"></i> Riwayat Putaway & Movement Log</h3>
            </div>
            <div class="movement-feed">
              ${movementLogs.length > 0 ? movementLogs.slice(0, 5).map((log) => `
                <div class="feed-item">
                  <div class="feed-icon"><i class="icon-check"></i></div>
                  <div class="feed-content">
                    <div class="feed-header">
                      <strong>${log.sku} - ${log.name || 'Barang'}</strong>
                      <span class="feed-time">${Formatters.formatDateTime(log.timestamp)}</span>
                    </div>
                    <div class="feed-sub">
                      Putaway ${log.qty} ${log.unit || 'BOX'} dari <span class="badge badge-staging">${log.fromLocation}</span> ke <span class="badge badge-rack">Rak ${log.toLocation}</span>
                    </div>
                    <small class="feed-operator"><i class="icon-user"></i> ${log.operator}</small>
                  </div>
                </div>
              `).join('') : '<div class="empty-state-mini">Belum ada riwayat pergerakan.</div>'}
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachEvents(container);
  },

  attachEvents: function (container) {
    container.querySelector('#btn-goto-admin-stock').addEventListener('click', () => {
      window.navigateTo('admin-stock');
    });

    const btnInb = container.querySelector('#btn-goto-inbound-docs');
    if (btnInb) {
      btnInb.addEventListener('click', () => {
        window.navigateTo('admin-inbound');
      });
    }

    container.querySelector('#btn-export-full-db').addEventListener('click', () => {
      const fullData = {
        skus: Storage.getSKUs(),
        locations: Storage.getLocations(),
        inbound: Storage.getInboundDocs(),
        stock: Storage.getStockItems(),
        logs: Storage.getMovementLogs(),
        exportedAt: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(fullData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `WMS_Backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }
};
