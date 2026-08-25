/**
 * Initial Mock Database for WMS
 * Fully aligned with 12-column SAP & Product schema:
 * [SKU, Sku Name, Sap Code, Category, Qty Rack, Qty Sap, Qty On Hand, Qty On Order, Available Qty, Reserve Qty, Is Under Reserve, Status]
 */

export const INITIAL_SKUS = [
  {
    sku: 'SKU-MED-001',
    skuName: 'Paracetamol 500mg Strip (Box 100)',
    name: 'Paracetamol 500mg Strip (Box 100)',
    sapCode: 'SAP-100234',
    category: 'Farmasi & Medis',
    qtyRack: 350,
    qtySap: 350,
    qtyOnHand: 350,
    qtyOnOrder: 100,
    availableQty: 300,
    reserveQty: 50,
    isUnderReserve: 'Yes',
    status: 'Active',
    unit: 'BOX',
    minStock: 50,
    preferredZone: 'A',
    tempRequirement: 'Room (25°C)',
    barcode: '899123400101',
    description: 'Obat analgesik penurun panas dan pereda nyeri'
  },
  {
    sku: 'SKU-MED-002',
    skuName: 'Amoxicillin 500mg Kapsul',
    name: 'Amoxicillin 500mg Kapsul',
    sapCode: 'SAP-100235',
    category: 'Farmasi & Medis',
    qtyRack: 75,
    qtySap: 75,
    qtyOnHand: 75,
    qtyOnOrder: 50,
    availableQty: 75,
    reserveQty: 0,
    isUnderReserve: 'No',
    status: 'Active',
    unit: 'BOX',
    minStock: 30,
    preferredZone: 'A',
    tempRequirement: 'Room (25°C)',
    barcode: '899123400102',
    description: 'Antibiotik spektrum luas'
  },
  {
    sku: 'SKU-FMCG-101',
    skuName: 'Minyak Goreng Sawit Premium 2L Pouch',
    name: 'Minyak Goreng Sawit Premium 2L Pouch',
    sapCode: 'SAP-200451',
    category: 'FMCG & Sembako',
    qtyRack: 0,
    qtySap: 120,
    qtyOnHand: 120, // 120 in Staging waiting for Putaway
    qtyOnOrder: 200,
    availableQty: 120,
    reserveQty: 0,
    isUnderReserve: 'No',
    status: 'Active',
    unit: 'CTN',
    minStock: 80,
    preferredZone: 'B',
    tempRequirement: 'Ambient',
    barcode: '899234500201',
    description: 'Minyak kelapa sawit murni kemasan 2L isi 6 pouch'
  },
  {
    sku: 'SKU-FMCG-102',
    skuName: 'Susu UHT Full Cream 1000ml',
    name: 'Susu UHT Full Cream 1000ml',
    sapCode: 'SAP-200452',
    category: 'Dairy & Minuman',
    qtyRack: 0,
    qtySap: 80,
    qtyOnHand: 80, // in Staging
    qtyOnOrder: 150,
    availableQty: 80,
    reserveQty: 0,
    isUnderReserve: 'No',
    status: 'Near Expiry', // Alert (<30 days)
    unit: 'CTN',
    minStock: 100,
    preferredZone: 'B',
    tempRequirement: 'Ambient',
    barcode: '899234500202',
    description: 'Susu segar UHT 1 liter isi 12 pcs per karton'
  },
  {
    sku: 'SKU-FMCG-103',
    skuName: 'Kopi Bubuk Arabika Spesial 250g',
    name: 'Kopi Bubuk Arabika Spesial 250g',
    sapCode: 'SAP-300109',
    category: 'FMCG & Minuman',
    qtyRack: 90,
    qtySap: 90,
    qtyOnHand: 90,
    qtyOnOrder: 60,
    availableQty: 70,
    reserveQty: 20,
    isUnderReserve: 'Yes',
    status: 'Active',
    unit: 'PCS',
    minStock: 40,
    preferredZone: 'C',
    tempRequirement: 'Ambient',
    barcode: '899345600301',
    description: 'Kopi bubuk roasted single origin'
  },
  {
    sku: 'SKU-BEV-201',
    skuName: 'Teh Hijau Organik 50 Tea Bags',
    name: 'Teh Hijau Organik 50 Tea Bags',
    sapCode: 'SAP-300110',
    category: 'FMCG & Minuman',
    qtyRack: 0,
    qtySap: 0,
    qtyOnHand: 0,
    qtyOnOrder: 100,
    availableQty: 0,
    reserveQty: 0,
    isUnderReserve: 'No',
    status: 'Out of Stock',
    unit: 'BOX',
    minStock: 25,
    preferredZone: 'C',
    tempRequirement: 'Ambient',
    barcode: '899345600302',
    description: 'Teh celup organik aroma melati'
  },
  {
    sku: 'SKU-CHILL-301',
    skuName: 'Butter Premium Anchor 227g (Salted)',
    name: 'Butter Premium Anchor 227g (Salted)',
    sapCode: 'SAP-400812',
    category: 'Cold Storage',
    qtyRack: 110,
    qtySap: 110,
    qtyOnHand: 110,
    qtyOnOrder: 50,
    availableQty: 80,
    reserveQty: 30,
    isUnderReserve: 'Yes',
    status: 'Active',
    unit: 'BOX',
    minStock: 60,
    preferredZone: 'D',
    tempRequirement: 'Cold (4°C)',
    barcode: '899456700401',
    description: 'Mentega murni impor untuk bakery'
  },
  {
    sku: 'SKU-ELEC-401',
    skuName: 'Barcode Scanner Handheld 2D Wireless',
    name: 'Barcode Scanner Handheld 2D Wireless',
    sapCode: 'SAP-500921',
    category: 'Hardware & Logistik',
    qtyRack: 15,
    qtySap: 15,
    qtyOnHand: 15,
    qtyOnOrder: 10,
    availableQty: 15,
    reserveQty: 0,
    isUnderReserve: 'No',
    status: 'Active',
    unit: 'UNIT',
    minStock: 15,
    preferredZone: 'C',
    tempRequirement: 'Ambient',
    barcode: '899567800501',
    description: 'Alat scanner nirkabel bluetooth QR 2D'
  }
];

export const INITIAL_LOCATIONS = [
  // Staging Areas (Inbound Receiving)
  { id: 'STG-01', zone: 'STAGING', aisle: 'IN', shelf: '01', bin: 'A', name: 'Inbound Staging 1', type: 'STAGING', capacityPallet: 20, maxKg: 5000 },
  { id: 'STG-02', zone: 'STAGING', aisle: 'IN', shelf: '02', bin: 'B', name: 'Inbound Staging 2', type: 'STAGING', capacityPallet: 20, maxKg: 5000 },

  // Zone A: Farmasi & High-Care Racks
  { id: 'A-01-01', zone: 'A', aisle: '01', shelf: '01', bin: '01', name: 'Rak Farmasi A-01-01', type: 'RACK', capacityPallet: 1, maxKg: 500 },
  { id: 'A-01-02', zone: 'A', aisle: '01', shelf: '01', bin: '02', name: 'Rak Farmasi A-01-02', type: 'RACK', capacityPallet: 1, maxKg: 500 },
  { id: 'A-01-03', zone: 'A', aisle: '01', shelf: '02', bin: '01', name: 'Rak Farmasi A-01-03', type: 'RACK', capacityPallet: 1, maxKg: 500 },
  { id: 'A-01-04', zone: 'A', aisle: '01', shelf: '02', bin: '02', name: 'Rak Farmasi A-01-04', type: 'RACK', capacityPallet: 1, maxKg: 500 },
  { id: 'A-02-01', zone: 'A', aisle: '02', shelf: '01', bin: '01', name: 'Rak Farmasi A-02-01', type: 'RACK', capacityPallet: 1, maxKg: 500 },
  { id: 'A-02-02', zone: 'A', aisle: '02', shelf: '01', bin: '02', name: 'Rak Farmasi A-02-02', type: 'RACK', capacityPallet: 1, maxKg: 500 },

  // Zone B: FMCG Bulk Racks
  { id: 'B-01-01', zone: 'B', aisle: '01', shelf: '01', bin: '01', name: 'Rak FMCG B-01-01', type: 'RACK', capacityPallet: 2, maxKg: 1000 },
  { id: 'B-01-02', zone: 'B', aisle: '01', shelf: '01', bin: '02', name: 'Rak FMCG B-01-02', type: 'RACK', capacityPallet: 2, maxKg: 1000 },
  { id: 'B-01-03', zone: 'B', aisle: '01', shelf: '02', bin: '01', name: 'Rak FMCG B-01-03', type: 'RACK', capacityPallet: 2, maxKg: 1000 },
  { id: 'B-02-01', zone: 'B', aisle: '02', shelf: '01', bin: '01', name: 'Rak FMCG B-02-01', type: 'RACK', capacityPallet: 2, maxKg: 1000 },
  { id: 'B-02-02', zone: 'B', aisle: '02', shelf: '01', bin: '02', name: 'Rak FMCG B-02-02', type: 'RACK', capacityPallet: 2, maxKg: 1000 },

  // Zone C: General Goods & Electronics
  { id: 'C-01-01', zone: 'C', aisle: '01', shelf: '01', bin: '01', name: 'Rak Umum C-01-01', type: 'RACK', capacityPallet: 1, maxKg: 400 },
  { id: 'C-01-02', zone: 'C', aisle: '01', shelf: '01', bin: '02', name: 'Rak Umum C-01-02', type: 'RACK', capacityPallet: 1, maxKg: 400 },
  { id: 'C-02-01', zone: 'C', aisle: '02', shelf: '01', bin: '01', name: 'Rak Umum C-02-01', type: 'RACK', capacityPallet: 1, maxKg: 400 },

  // Zone D: Cold Storage
  { id: 'D-01-01', zone: 'D', aisle: '01', shelf: '01', bin: '01', name: 'Cold Room D-01-01', type: 'RACK', capacityPallet: 1, maxKg: 600 },
  { id: 'D-01-02', zone: 'D', aisle: '01', shelf: '01', bin: '02', name: 'Cold Room D-01-02', type: 'RACK', capacityPallet: 1, maxKg: 600 }
];

export const INITIAL_INBOUND_DOCS = [
  {
    docNo: 'INB-20260825-001',
    poNo: 'PO-2026-8801',
    supplier: 'PT Kimia Sehat Sentosa',
    receivedAt: '2026-08-25T09:30:00Z',
    operator: 'Daniel Imsula (Super Admin)',
    status: 'COMPLETED',
    stagingLocation: 'STG-01',
    items: [
      {
        lpId: 'LP-20260825-001',
        sku: 'SKU-MED-001',
        name: 'Paracetamol 500mg Strip (Box 100)',
        sapCode: 'SAP-100234',
        batchNo: 'BATCH-PCT-202608',
        expDate: '2027-08-20',
        qty: 150,
        unit: 'BOX',
        location: 'A-01-01',
        putawayStatus: 'DONE',
        putawayAt: '2026-08-25T10:15:00Z'
      }
    ]
  },
  {
    docNo: 'INB-20260825-002',
    poNo: 'PO-2026-8802',
    supplier: 'PT Agro Jaya Nusantara',
    receivedAt: '2026-08-25T11:45:00Z',
    operator: 'Budi Santoso (Inbound)',
    status: 'STAGING_PENDING',
    stagingLocation: 'STG-01',
    items: [
      {
        lpId: 'LP-20260825-002',
        sku: 'SKU-FMCG-101',
        name: 'Minyak Goreng Sawit Premium 2L Pouch',
        sapCode: 'SAP-200451',
        batchNo: 'BATCH-MG-26A',
        expDate: '2027-02-15',
        qty: 120,
        unit: 'CTN',
        location: 'STG-01',
        putawayStatus: 'PENDING',
        suggestedLocation: 'B-01-01',
        putawayAt: null
      },
      {
        lpId: 'LP-20260825-003',
        sku: 'SKU-FMCG-102',
        name: 'Susu UHT Full Cream 1000ml',
        sapCode: 'SAP-200452',
        batchNo: 'BATCH-UHT-2609',
        expDate: '2026-09-20',
        qty: 80,
        unit: 'CTN',
        location: 'STG-01',
        putawayStatus: 'PENDING',
        suggestedLocation: 'B-01-02',
        putawayAt: null
      }
    ]
  }
];

export const INITIAL_STOCK_ITEMS = [
  {
    id: 'STK-001',
    lpId: 'LP-20260820-001',
    sku: 'SKU-MED-001',
    name: 'Paracetamol 500mg Strip (Box 100)',
    sapCode: 'SAP-100234',
    category: 'Farmasi & Medis',
    batchNo: 'BATCH-PCT-202607',
    expDate: '2027-07-15',
    qty: 200,
    unit: 'BOX',
    location: 'A-01-02',
    status: 'STORED',
    inboundDate: '2026-08-20T08:00:00Z',
    lastMovedAt: '2026-08-20T09:10:00Z'
  },
  {
    id: 'STK-002',
    lpId: 'LP-20260825-001',
    sku: 'SKU-MED-001',
    name: 'Paracetamol 500mg Strip (Box 100)',
    sapCode: 'SAP-100234',
    category: 'Farmasi & Medis',
    batchNo: 'BATCH-PCT-202608',
    expDate: '2027-08-20',
    qty: 150,
    unit: 'BOX',
    location: 'A-01-01',
    status: 'STORED',
    inboundDate: '2026-08-25T09:30:00Z',
    lastMovedAt: '2026-08-25T10:15:00Z'
  },
  {
    id: 'STK-003',
    lpId: 'LP-20260821-002',
    sku: 'SKU-MED-002',
    name: 'Amoxicillin 500mg Kapsul',
    sapCode: 'SAP-100235',
    category: 'Farmasi & Medis',
    batchNo: 'BATCH-AMX-2601',
    expDate: '2026-10-10',
    qty: 75,
    unit: 'BOX',
    location: 'A-01-03',
    status: 'STORED',
    inboundDate: '2026-08-21T10:00:00Z',
    lastMovedAt: '2026-08-21T11:00:00Z'
  },
  {
    id: 'STK-004',
    lpId: 'LP-20260825-002',
    sku: 'SKU-FMCG-101',
    name: 'Minyak Goreng Sawit Premium 2L Pouch',
    sapCode: 'SAP-200451',
    category: 'FMCG & Sembako',
    batchNo: 'BATCH-MG-26A',
    expDate: '2027-02-15',
    qty: 120,
    unit: 'CTN',
    location: 'STG-01',
    status: 'STAGING',
    inboundDate: '2026-08-25T11:45:00Z',
    lastMovedAt: '2026-08-25T11:45:00Z'
  },
  {
    id: 'STK-005',
    lpId: 'LP-20260825-003',
    sku: 'SKU-FMCG-102',
    name: 'Susu UHT Full Cream 1000ml',
    sapCode: 'SAP-200452',
    category: 'Dairy & Minuman',
    batchNo: 'BATCH-UHT-2609',
    expDate: '2026-09-20',
    qty: 80,
    unit: 'CTN',
    location: 'STG-01',
    status: 'STAGING',
    inboundDate: '2026-08-25T11:45:00Z',
    lastMovedAt: '2026-08-25T11:45:00Z'
  },
  {
    id: 'STK-006',
    lpId: 'LP-20260815-001',
    sku: 'SKU-FMCG-103',
    name: 'Kopi Bubuk Arabika Spesial 250g',
    sapCode: 'SAP-300109',
    category: 'FMCG & Minuman',
    batchNo: 'BATCH-KOP-2601',
    expDate: '2027-04-10',
    qty: 90,
    unit: 'PCS',
    location: 'C-01-01',
    status: 'STORED',
    inboundDate: '2026-08-15T08:00:00Z',
    lastMovedAt: '2026-08-15T08:45:00Z'
  },
  {
    id: 'STK-007',
    lpId: 'LP-20260818-004',
    sku: 'SKU-CHILL-301',
    name: 'Butter Premium Anchor 227g (Salted)',
    sapCode: 'SAP-400812',
    category: 'Cold Storage',
    batchNo: 'BATCH-BTR-889',
    expDate: '2026-11-30',
    qty: 110,
    unit: 'BOX',
    location: 'D-01-01',
    status: 'STORED',
    inboundDate: '2026-08-18T14:00:00Z',
    lastMovedAt: '2026-08-18T15:10:00Z'
  }
];

export const INITIAL_MOVEMENT_LOGS = [
  {
    id: 'MOV-001',
    timestamp: '2026-08-25T10:15:00Z',
    lpId: 'LP-20260825-001',
    sku: 'SKU-MED-001',
    qty: 150,
    fromLocation: 'STG-01',
    toLocation: 'A-01-01',
    operator: 'Daniel Imsula',
    actionType: 'PUTAWAY',
    notes: 'Putaway completed via QR scan'
  }
];
