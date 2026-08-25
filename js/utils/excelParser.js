/**
 * Excel & CSV Parser Utility for WMS
 * Handles import, export, and template generation for the 12-column product schema:
 * [SKU, Sku Name, Sap Code, Category, Qty Rack, Qty Sap, Qty On Hand, Qty On Order, Available Qty, Reserve Qty, Is Under Reserve, Status]
 */

export const ExcelParser = {
  COLUMNS: [
    'SKU',
    'Sku Name',
    'Sap Code',
    'Category',
    'Qty Rack',
    'Qty Sap',
    'Qty On Hand',
    'Qty On Order',
    'Available Qty',
    'Reserve Qty',
    'Is Under Reserve',
    'Status'
  ],

  /**
   * Generates and triggers download of the sample Excel/CSV template
   */
  downloadTemplate: function () {
    const sampleRows = [
      [
        'SKU-MED-001',
        'Paracetamol 500mg Strip (Box 100)',
        'SAP-100234',
        'Farmasi & Medis',
        350,
        350,
        350,
        100,
        300,
        50,
        'Yes',
        'Active'
      ],
      [
        'SKU-FMCG-101',
        'Minyak Goreng Sawit Premium 2L Pouch',
        'SAP-200451',
        'FMCG & Sembako',
        120,
        120,
        120,
        200,
        120,
        0,
        'No',
        'Active'
      ],
      [
        'SKU-FMCG-102',
        'Susu UHT Full Cream 1000ml',
        'SAP-200452',
        'Dairy & Minuman',
        80,
        100,
        80,
        50,
        80,
        0,
        'No',
        'Near Expiry'
      ],
      [
        'SKU-CHILL-301',
        'Butter Premium Anchor 227g',
        'SAP-400812',
        'Cold Storage',
        110,
        110,
        110,
        40,
        90,
        20,
        'Yes',
        'Active'
      ]
    ];

    const csvContent = [
      this.COLUMNS.join(','),
      ...sampleRows.map((row) =>
        row
          .map((val) => {
            if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
              return `"${val.replace(/"/g, '""')}"`;
            }
            return val;
          })
          .join(',')
      )
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Template_Upload_Product_WMS.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },

  /**
   * Parses CSV or text content uploaded by user
   * @param {string} textContent - Raw CSV text
   * @returns {Array<Object>} List of product objects matching schema
   */
  parseCSVText: function (textContent) {
    if (!textContent) return [];

    const lines = textContent.split(/\r\n|\n|\r/).filter((line) => line.trim().length > 0);
    if (lines.length <= 1) return [];

    // Parse header line
    const headerLine = lines[0];
    const headers = this.parseCSVLine(headerLine).map((h) => h.trim().toLowerCase());

    const products = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length === 0 || !values[0]) continue;

      const getVal = (possibleNames, fallback = '') => {
        for (const name of possibleNames) {
          const idx = headers.findIndex((h) => h.includes(name.toLowerCase()));
          if (idx >= 0 && values[idx] !== undefined) {
            return values[idx].trim();
          }
        }
        return fallback;
      };

      const sku = getVal(['sku', 'kode sku', 'product code'], `SKU-${Date.now()}-${i}`);
      const skuName = getVal(['sku name', 'name', 'nama barang', 'nama produk', 'product name'], 'Produk Tanpa Nama');
      const sapCode = getVal(['sap code', 'sap', 'kode sap'], `SAP-${100000 + i}`);
      const category = getVal(['category', 'kategori'], 'General');
      
      const qtyRack = parseInt(getVal(['qty rack', 'rack qty', 'qty di rak', 'stok rak'], '0'), 10) || 0;
      const qtySap = parseInt(getVal(['qty sap', 'sap qty', 'stok sap'], `${qtyRack}`), 10) || qtyRack;
      const qtyOnHand = parseInt(getVal(['qty on hand', 'on hand', 'stok on hand'], `${qtyRack}`), 10) || qtyRack;
      const qtyOnOrder = parseInt(getVal(['qty on order', 'on order', 'po qty'], '0'), 10) || 0;
      const reserveQty = parseInt(getVal(['reserve qty', 'reserved', 'qty reserve'], '0'), 10) || 0;
      const availableQty = parseInt(getVal(['available qty', 'available', 'qty tersedia'], `${qtyOnHand - reserveQty}`), 10) || (qtyOnHand - reserveQty);
      
      const isUnderReserveRaw = getVal(['is under reserve', 'under reserve', 'reserve status'], reserveQty > 0 ? 'Yes' : 'No');
      const isUnderReserve = ['yes', 'true', '1', 'ya'].includes(isUnderReserveRaw.toLowerCase()) ? 'Yes' : 'No';
      const status = getVal(['status', 'kondisi'], 'Active');

      products.push({
        sku: sku.toUpperCase(),
        name: skuName,
        skuName: skuName,
        sapCode: sapCode,
        category: category,
        qtyRack: qtyRack,
        qtySap: qtySap,
        qtyOnHand: qtyOnHand,
        qtyOnOrder: qtyOnOrder,
        availableQty: availableQty,
        reserveQty: reserveQty,
        isUnderReserve: isUnderReserve,
        status: status,
        unit: 'BOX',
        minStock: 20,
        preferredZone: category.includes('Farmasi') ? 'A' : category.includes('Cold') ? 'D' : category.includes('FMCG') ? 'B' : 'C'
      });
    }

    return products;
  },

  /**
   * Helper to parse a single CSV line with quote escaping
   */
  parseCSVLine: function (line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  },

  /**
   * Exports full 12-column product stock data to CSV
   */
  exportProductsToCSV: function (products, filename = 'Database_Product_WMS.csv') {
    if (!products || products.length === 0) return;

    const rows = products.map((p) => [
      p.sku,
      `"${(p.skuName || p.name || '').replace(/"/g, '""')}"`,
      p.sapCode || '-',
      `"${(p.category || 'General').replace(/"/g, '""')}"`,
      p.qtyRack !== undefined ? p.qtyRack : 0,
      p.qtySap !== undefined ? p.qtySap : (p.qtyRack || 0),
      p.qtyOnHand !== undefined ? p.qtyOnHand : (p.qtyRack || 0),
      p.qtyOnOrder !== undefined ? p.qtyOnOrder : 0,
      p.availableQty !== undefined ? p.availableQty : ((p.qtyOnHand || 0) - (p.reserveQty || 0)),
      p.reserveQty !== undefined ? p.reserveQty : 0,
      p.isUnderReserve || (p.reserveQty > 0 ? 'Yes' : 'No'),
      p.status || 'Active'
    ]);

    const csvContent = [this.COLUMNS.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
};
