/**
 * Reactive Storage & State Manager for WMS (PHP & MySQL Backend Integrated)
 * Handles 12-column product schema, dynamic quantities, Excel import, and RBAC logs.
 */

import {
  INITIAL_SKUS,
  INITIAL_LOCATIONS,
  INITIAL_INBOUND_DOCS,
  INITIAL_STOCK_ITEMS,
  INITIAL_MOVEMENT_LOGS
} from './mockDatabase.js';

import { API } from './apiClient.js';

const STORAGE_KEYS = {
  SKUS: 'wms_skus_v2',
  LOCATIONS: 'wms_locations_v2',
  INBOUND: 'wms_inbound_docs_v2',
  STOCK: 'wms_stock_items_v2',
  LOGS: 'wms_movement_logs_v2'
};

class StorageManager {
  constructor() {
    this.listeners = [];
    this.init();
  }

  init() {
    if (!localStorage.getItem(STORAGE_KEYS.SKUS)) {
      this.resetToDefaults();
    }
    // Background sync from MySQL database
    this.syncFromBackend();
  }

  async syncFromBackend() {
    try {
      const res = await API.getDashboardMetrics();
      if (res && res.success) {
        if (res.skus && res.skus.length > 0) {
          localStorage.setItem(STORAGE_KEYS.SKUS, JSON.stringify(res.skus.map((s) => ({
            ...s,
            skuName: s.name,
            sapCode: s.sap_code,
            qtySap: Number(s.qty_sap) || 0,
            qtyOnOrder: Number(s.qty_on_order) || 0,
            reserveQty: Number(s.reserve_qty) || 0,
            minStock: Number(s.min_stock) || 10,
            maxStock: Number(s.max_stock) || 500
          }))));
        }

        if (res.locations && res.locations.length > 0) {
          localStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(res.locations));
        }

        if (res.stockItems && res.stockItems.length > 0) {
          localStorage.setItem(STORAGE_KEYS.STOCK, JSON.stringify(res.stockItems.map((st) => ({
            ...st,
            lpId: st.lp_id,
            location: st.location_id,
            inboundDocNo: st.inbound_doc_no,
            inboundDate: st.inbounded_at,
            lastMovedAt: st.putaway_at || st.inbounded_at
          }))));
        }

        if (res.inboundDocs && res.inboundDocs.length > 0) {
          localStorage.setItem(STORAGE_KEYS.INBOUND, JSON.stringify(res.inboundDocs.map((d) => ({
            ...d,
            docNo: d.doc_no,
            poNo: d.po_no,
            receivedAt: d.created_at,
            operator: d.received_by,
            stagingLocation: d.staging_location,
            items: []
          }))));
        }

        if (res.movementLogs && res.movementLogs.length > 0) {
          localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(res.movementLogs.map((l) => ({
            ...l,
            timestamp: l.created_at,
            operator: l.user_name,
            fromLocation: l.from_location,
            toLocation: l.to_location,
            actionType: l.type,
            notes: `Putaway ke Rak ${l.to_location}`
          }))));
        }

        this.notify('BACKEND_SYNCED');
      }
    } catch (e) {
      console.warn('Background sync error:', e);
    }
  }

  resetToDefaults() {
    localStorage.setItem(STORAGE_KEYS.SKUS, JSON.stringify(INITIAL_SKUS));
    localStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(INITIAL_LOCATIONS));
    localStorage.setItem(STORAGE_KEYS.INBOUND, JSON.stringify(INITIAL_INBOUND_DOCS));
    localStorage.setItem(STORAGE_KEYS.STOCK, JSON.stringify(INITIAL_STOCK_ITEMS));
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(INITIAL_MOVEMENT_LOGS));
    this.notify('RESET');

    // Async reset MySQL
    API.resetDatabase().catch((e) => console.warn('Reset MySQL error:', e));
  }

  // --- Reactive Subscription ---
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  notify(event, data) {
    this.listeners.forEach((callback) => {
      try {
        callback(event, data);
      } catch (err) {
        console.error('Listener callback error:', err);
      }
    });
  }

  // --- SKUs / Products (12 Columns Schema) ---
  getSKUs() {
    const raw = localStorage.getItem(STORAGE_KEYS.SKUS);
    const skus = raw ? JSON.parse(raw) : INITIAL_SKUS;
    const stock = this.getStockItems();

    // Dynamically calculate Qty Rack & Qty On Hand from actual physical batches
    return skus.map((sku) => {
      const skuStock = stock.filter((s) => (s.sku || '').toLowerCase() === (sku.sku || '').toLowerCase());
      const rackQty = skuStock
        .filter((s) => s.status === 'STORED' && !((s.location || s.location_id || '').startsWith('STG')))
        .reduce((sum, it) => sum + (Number(it.qty) || 0), 0);
      const stagingQty = skuStock
        .filter((s) => s.status === 'STAGING' || ((s.location || s.location_id || '').startsWith('STG')))
        .reduce((sum, it) => sum + (Number(it.qty) || 0), 0);

      const qtyOnHand = rackQty + stagingQty;
      const reserveQty = sku.reserveQty !== undefined ? Number(sku.reserveQty) : (Number(sku.reserve_qty) || 0);
      const availableQty = Math.max(0, qtyOnHand - reserveQty);
      const isUnderReserve = reserveQty > 0 || sku.is_under_reserve === 'Yes' || sku.isUnderReserve === 'Yes' ? 'Yes' : 'No';

      return {
        ...sku,
        sku: sku.sku,
        skuName: sku.skuName || sku.name,
        name: sku.skuName || sku.name,
        sapCode: sku.sapCode || sku.sap_code || `SAP-${sku.sku}`,
        category: sku.category || 'General Goods',
        unit: sku.unit || 'Pcs',
        qtyRack: rackQty,
        qtyOnHand: qtyOnHand,
        availableQty: availableQty,
        reserveQty: reserveQty,
        isUnderReserve: isUnderReserve,
        qtySap: sku.qtySap !== undefined ? Number(sku.qtySap) : (Number(sku.qty_sap) || qtyOnHand),
        qtyOnOrder: sku.qtyOnOrder !== undefined ? Number(sku.qtyOnOrder) : (Number(sku.qty_on_order) || 0),
        status: sku.status || 'Active'
      };
    });
  }

  getSKU(skuCode) {
    const skus = this.getSKUs();
    return skus.find((s) => (s.sku || '').toLowerCase() === (skuCode || '').toLowerCase());
  }

  saveSKU(skuObj) {
    const raw = localStorage.getItem(STORAGE_KEYS.SKUS);
    const skus = raw ? JSON.parse(raw) : INITIAL_SKUS;
    const existingIdx = skus.findIndex((s) => s.sku.toLowerCase() === skuObj.sku.toLowerCase());
    
    if (existingIdx >= 0) {
      skus[existingIdx] = { ...skus[existingIdx], ...skuObj };
    } else {
      skus.push(skuObj);
    }
    localStorage.setItem(STORAGE_KEYS.SKUS, JSON.stringify(skus));
    this.notify('SKU_UPDATED', skuObj);

    // Save to MySQL
    API.addSku(skuObj).catch((e) => console.warn('Save SKU MySQL error:', e));

    return skuObj;
  }

  /**
   * Bulk import products from parsed Excel/CSV
   */
  importProducts(importedProducts, mode = 'merge') {
    if (!importedProducts || importedProducts.length === 0) return { count: 0 };

    const raw = localStorage.getItem(STORAGE_KEYS.SKUS);
    let skus = raw ? JSON.parse(raw) : INITIAL_SKUS;

    if (mode === 'replace') {
      skus = importedProducts;
    } else {
      // Merge mode
      importedProducts.forEach((newProd) => {
        const idx = skus.findIndex((s) => s.sku.toLowerCase() === newProd.sku.toLowerCase());
        if (idx >= 0) {
          skus[idx] = { ...skus[idx], ...newProd };
        } else {
          skus.push(newProd);
        }
      });
    }

    localStorage.setItem(STORAGE_KEYS.SKUS, JSON.stringify(skus));
    this.notify('PRODUCTS_IMPORTED', { count: importedProducts.length });

    // Sync to MySQL API
    API.importProducts(importedProducts, mode === 'replace' ? 'REPLACE' : 'MERGE')
      .then(() => this.syncFromBackend())
      .catch((e) => console.warn('Import MySQL error:', e));

    return { count: importedProducts.length };
  }

  // --- Locations Master ---
  getLocations() {
    const raw = localStorage.getItem(STORAGE_KEYS.LOCATIONS);
    return raw ? JSON.parse(raw) : INITIAL_LOCATIONS;
  }

  getLocation(locId) {
    const locs = this.getLocations();
    return locs.find((l) => (l.id || '').toUpperCase() === (locId || '').toUpperCase());
  }

  saveLocation(locObj) {
    const locs = this.getLocations();
    const existingIdx = locs.findIndex((l) => l.id === locObj.id);
    if (existingIdx >= 0) {
      locs[existingIdx] = { ...locs[existingIdx], ...locObj };
    } else {
      locs.push(locObj);
    }
    localStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(locs));
    this.notify('LOCATION_UPDATED', locObj);

    // Save to MySQL
    API.addLocation(locObj).catch((e) => console.warn('Save Location MySQL error:', e));

    return locObj;
  }

  // --- Inbound Documents ---
  getInboundDocs() {
    const raw = localStorage.getItem(STORAGE_KEYS.INBOUND);
    return raw ? JSON.parse(raw) : INITIAL_INBOUND_DOCS;
  }

  getInboundDoc(docNo) {
    const docs = this.getInboundDocs();
    return docs.find((d) => (d.docNo || d.doc_no) === docNo);
  }

  /**
   * Creates a new Inbound Receiving Document from Handheld Inbound Staging
   */
  createInboundDocument(docData) {
    const docs = this.getInboundDocs();
    const stock = this.getStockItems();

    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const countToday = docs.filter((d) => (d.docNo || d.doc_no || '').includes(todayStr)).length + 1;
    const docNo = docData.docNo || `GRN-${todayStr}-${String(countToday).padStart(3, '0')}`;

    const newDoc = {
      id: `INB-${Date.now()}`,
      docNo: docNo,
      doc_no: docNo,
      poNo: docData.poNo || `PO-${todayStr}-${Math.floor(1000 + Math.random() * 9000)}`,
      supplier: docData.supplier || 'Supplier Umum',
      receivedAt: docData.receivedAt || new Date().toISOString(),
      operator: docData.operator || 'Operator Handheld',
      status: 'RECEIVED',
      stagingLocation: docData.stagingLocation || 'STG-01',
      items: []
    };

    docData.items.forEach((item, index) => {
      const lpCount = stock.length + index + 1;
      const lpId = item.lpId || `LP-${todayStr}-${String(lpCount).padStart(3, '0')}`;
      
      const docItem = {
        lpId: lpId,
        sku: item.sku,
        name: item.name,
        sapCode: item.sapCode || `SAP-${item.sku}`,
        category: item.category || 'General',
        batchNo: item.batchNo || `BATCH-${todayStr}`,
        expDate: item.expDate || '2027-12-31',
        qty: Number(item.qty),
        unit: item.unit || 'Box',
        location: newDoc.stagingLocation,
        putawayStatus: 'PENDING',
        suggestedLocation: item.suggestedLocation || this.calculateSuggestedRack(item.sku),
        putawayAt: null
      };
      newDoc.items.push(docItem);

      // Add to Stock Items
      const stockItem = {
        id: `STK-${Date.now()}-${index}`,
        lpId: lpId,
        inboundDocNo: docNo,
        sku: item.sku,
        name: item.name,
        sapCode: item.sapCode || `SAP-${item.sku}`,
        category: item.category || 'General',
        batchNo: item.batchNo || `BATCH-${todayStr}`,
        expDate: item.expDate || '2027-12-31',
        qty: Number(item.qty),
        unit: item.unit || 'Box',
        location: newDoc.stagingLocation,
        status: 'STAGING',
        inboundDate: newDoc.receivedAt,
        lastMovedAt: newDoc.receivedAt
      };
      stock.push(stockItem);
    });

    docs.unshift(newDoc);
    localStorage.setItem(STORAGE_KEYS.INBOUND, JSON.stringify(docs));
    localStorage.setItem(STORAGE_KEYS.STOCK, JSON.stringify(stock));

    this.notify('INBOUND_CREATED', newDoc);

    // Save to MySQL API
    API.createInbound({
      poNo: newDoc.poNo,
      supplier: newDoc.supplier,
      stagingLocation: newDoc.stagingLocation,
      receivedBy: newDoc.operator,
      items: docData.items
    }).then(() => this.syncFromBackend()).catch((e) => console.warn('Create Inbound MySQL error:', e));

    return newDoc;
  }

  // --- Stock Items ---
  getStockItems() {
    const raw = localStorage.getItem(STORAGE_KEYS.STOCK);
    return raw ? JSON.parse(raw) : INITIAL_STOCK_ITEMS;
  }

  findStockByLP(lpId) {
    const stock = this.getStockItems();
    return stock.find((s) => (s.lpId || s.lp_id || '').toLowerCase() === (lpId || '').toLowerCase().trim());
  }

  calculateSuggestedRack(skuCode) {
    const sku = this.getSKU(skuCode);
    const locations = this.getLocations().filter((l) => l.type === 'RACK');
    const stock = this.getStockItems();

    let preferredZone = 'B';
    const category = sku ? (sku.category || '') : '';
    if (category.toLowerCase().includes('farmasi') || category.toLowerCase().includes('medis')) {
      preferredZone = 'A';
    } else if (category.toLowerCase().includes('cold') || category.toLowerCase().includes('vaksin')) {
      preferredZone = 'D';
    } else if (category.toLowerCase().includes('tech') || category.toLowerCase().includes('general')) {
      preferredZone = 'C';
    }

    const zoneRacks = locations.filter((l) => l.zone === preferredZone);

    for (const rack of zoneRacks) {
      const rackStock = stock.filter((s) => (s.location || s.location_id) === rack.id && s.status === 'STORED');
      if (rackStock.length === 0) return rack.id;
      if (rackStock.some((s) => s.sku === skuCode) && rackStock.length < 2) return rack.id;
    }

    return zoneRacks[0] ? zoneRacks[0].id : 'A-01-01';
  }

  // --- Putaway Workflow Execution ---
  executePutaway({ lpId, targetLocationId, operator = 'Operator Handheld', notes = '' }) {
    const stock = this.getStockItems();
    const docs = this.getInboundDocs();
    const logs = this.getMovementLogs();
    const locations = this.getLocations();

    const cleanLp = (lpId || '').trim();
    const stockItem = stock.find((s) => (s.lpId || s.lp_id || '').toLowerCase() === cleanLp.toLowerCase());
    if (!stockItem) {
      return { success: false, message: `Barang dengan License Plate / QR ${lpId} tidak ditemukan di sistem.` };
    }

    const targetLoc = locations.find((l) => l.id.toUpperCase() === targetLocationId.toUpperCase().trim());
    if (!targetLoc) {
      return { success: false, message: `Lokasi Rak ${targetLocationId} tidak terdaftar di sistem master data.` };
    }

    const previousLocation = stockItem.location || stockItem.location_id;

    // Update Stock Item
    stockItem.location = targetLoc.id;
    stockItem.location_id = targetLoc.id;
    stockItem.status = 'STORED';
    stockItem.lastMovedAt = new Date().toISOString();

    // Update Inbound Doc item if linked
    docs.forEach((doc) => {
      let allDone = true;
      (doc.items || []).forEach((it) => {
        if ((it.lpId || it.lp_id || '').toLowerCase() === cleanLp.toLowerCase()) {
          it.location = targetLoc.id;
          it.putawayStatus = 'DONE';
          it.putawayAt = new Date().toISOString();
        }
        if (it.putawayStatus !== 'DONE') {
          allDone = false;
        }
      });
      if (allDone && doc.items && doc.items.length > 0) {
        doc.status = 'PUTAWAY_COMPLETED';
      }
    });

    // Record Movement Audit Log
    const newLog = {
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toISOString(),
      lpId: stockItem.lpId || stockItem.lp_id,
      sku: stockItem.sku,
      name: stockItem.name,
      sapCode: stockItem.sapCode || stockItem.sap_code,
      qty: stockItem.qty,
      unit: stockItem.unit,
      batchNo: stockItem.batchNo || stockItem.batch_no,
      fromLocation: previousLocation,
      toLocation: targetLoc.id,
      operator: operator,
      actionType: 'PUTAWAY',
      notes: notes || `Putaway berhasil dari ${previousLocation} ke Rak ${targetLoc.id}`
    };
    logs.unshift(newLog);

    localStorage.setItem(STORAGE_KEYS.STOCK, JSON.stringify(stock));
    localStorage.setItem(STORAGE_KEYS.INBOUND, JSON.stringify(docs));
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));

    this.notify('PUTAWAY_COMPLETED', { stockItem, newLog });

    // Confirm to MySQL API
    API.confirmPutaway(cleanLp, targetLoc.id, operator)
      .then(() => this.syncFromBackend())
      .catch((e) => console.warn('Confirm Putaway MySQL error:', e));

    return { success: true, message: `Putaway Berhasil! Barang disimpan di Rak ${targetLoc.id}.`, stockItem, log: newLog };
  }

  // --- Movement Logs ---
  getMovementLogs() {
    const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
    return raw ? JSON.parse(raw) : INITIAL_MOVEMENT_LOGS;
  }
}

export const Storage = new StorageManager();
