-- ============================================================================
-- SUPABASE POSTGRESQL SCHEMA FOR WMS INVENTORY MANAGEMENT SYSTEM
-- Schema Version: 2.0 (12-Column SAP Product Schema & Multi-Division RBAC)
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABLE: products (Master Produk 12 Kolom SAP)
CREATE TABLE IF NOT EXISTS products (
    sku VARCHAR(100) PRIMARY KEY,
    sku_name VARCHAR(255) NOT NULL,
    sap_code VARCHAR(100),
    category VARCHAR(100) DEFAULT 'General',
    qty_rack INTEGER DEFAULT 0,
    qty_sap INTEGER DEFAULT 0,
    qty_on_hand INTEGER DEFAULT 0,
    qty_on_order INTEGER DEFAULT 0,
    available_qty INTEGER DEFAULT 0,
    reserve_qty INTEGER DEFAULT 0,
    is_under_reserve VARCHAR(10) DEFAULT 'No',
    status VARCHAR(50) DEFAULT 'Active',
    unit VARCHAR(20) DEFAULT 'BOX',
    min_stock INTEGER DEFAULT 20,
    preferred_zone VARCHAR(10) DEFAULT 'B',
    barcode VARCHAR(100),
    temp_requirement VARCHAR(50) DEFAULT 'Ambient',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABLE: locations (Lokasi Rak & Staging Area)
CREATE TABLE IF NOT EXISTS locations (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    zone VARCHAR(20) NOT NULL,
    aisle VARCHAR(20),
    shelf VARCHAR(20),
    bin VARCHAR(20),
    type VARCHAR(20) DEFAULT 'RACK', -- 'RACK' or 'STAGING'
    capacity_pallet INTEGER DEFAULT 1,
    max_kg INTEGER DEFAULT 500,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABLE: stock_items (Stok Aktual per Batch & Exp Date)
CREATE TABLE IF NOT EXISTS stock_items (
    id VARCHAR(100) PRIMARY KEY,
    lp_id VARCHAR(100) NOT NULL,
    inbound_doc_no VARCHAR(100),
    sku VARCHAR(100) REFERENCES products(sku) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sap_code VARCHAR(100),
    category VARCHAR(100),
    batch_no VARCHAR(100) NOT NULL,
    exp_date DATE NOT NULL,
    qty INTEGER NOT NULL DEFAULT 1,
    unit VARCHAR(20) DEFAULT 'BOX',
    location VARCHAR(50) REFERENCES locations(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'STAGING', -- 'STAGING' or 'STORED'
    inbound_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_moved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABLE: inbound_docs (Dokumen Penerimaan / GRN)
CREATE TABLE IF NOT EXISTS inbound_docs (
    doc_no VARCHAR(100) PRIMARY KEY,
    po_no VARCHAR(100) NOT NULL,
    supplier VARCHAR(255) NOT NULL,
    received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    operator VARCHAR(100),
    status VARCHAR(50) DEFAULT 'STAGING_PENDING', -- 'STAGING_PENDING' or 'COMPLETED'
    staging_location VARCHAR(50) DEFAULT 'STG-01',
    items JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABLE: movement_logs (Audit Trail Perpindahan & Putaway)
CREATE TABLE IF NOT EXISTS movement_logs (
    id VARCHAR(100) PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    lp_id VARCHAR(100),
    sku VARCHAR(100),
    name VARCHAR(255),
    sap_code VARCHAR(100),
    qty INTEGER,
    unit VARCHAR(20),
    batch_no VARCHAR(100),
    from_location VARCHAR(50),
    to_location VARCHAR(50),
    operator VARCHAR(100),
    action_type VARCHAR(50) DEFAULT 'PUTAWAY',
    notes TEXT
);

-- 6. TABLE: users (Manajemen Akun & Role Divisi)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(100) PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- 'SUPER_ADMIN', 'INBOUND', 'PUTAWAY', 'CHECKER', 'SUPERVISOR'
    division VARCHAR(100) NOT NULL,
    avatar VARCHAR(20) DEFAULT '👤',
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES (Public Anon Read/Write for Client Demo)
-- ============================================================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbound_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE movement_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public full access on products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access on locations" ON locations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access on stock_items" ON stock_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access on inbound_docs" ON inbound_docs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access on movement_logs" ON movement_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access on users" ON users FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- INITIAL DATA SEEDING (Daniel Imsula Super Admin & 12-Column Products)
-- ============================================================================

-- Insert Users
INSERT INTO users (id, username, password, name, role, division, avatar, status) VALUES
('USR-001', 'daniel', 'Dh@niel0', 'Daniel Imsula', 'SUPER_ADMIN', 'Super Administrator', '👑', 'ACTIVE'),
('USR-002', 'inbound.op', 'inbound123', 'Budi Santoso (Inbound)', 'INBOUND', 'Inbound Staging Area', '📥', 'ACTIVE'),
('USR-003', 'putaway.op', 'putaway123', 'Rian Pratama (Putaway)', 'PUTAWAY', 'Warehouse Putaway & Rack Movement', '🚜', 'ACTIVE'),
('USR-004', 'checker.ic', 'checker123', 'Siti Rahma (IC Checker)', 'CHECKER', 'Inventory Control & Audit', '🔍', 'ACTIVE'),
('USR-005', 'supervisor', 'spv123', 'Hendro Wijaya (Supervisor)', 'SUPERVISOR', 'Warehouse Operations Supervisor', '👔', 'ACTIVE')
ON CONFLICT (username) DO NOTHING;

-- Insert Locations
INSERT INTO locations (id, name, zone, aisle, shelf, bin, type, capacity_pallet, max_kg) VALUES
('STG-01', 'Inbound Staging 1', 'STAGING', 'IN', '01', 'A', 'STAGING', 20, 5000),
('STG-02', 'Inbound Staging 2', 'STAGING', 'IN', '02', 'B', 'STAGING', 20, 5000),
('A-01-01', 'Rak Farmasi A-01-01', 'A', '01', '01', '01', 'RACK', 1, 500),
('A-01-02', 'Rak Farmasi A-01-02', 'A', '01', '01', '02', 'RACK', 1, 500),
('A-01-03', 'Rak Farmasi A-01-03', 'A', '01', '02', '01', 'RACK', 1, 500),
('A-01-04', 'Rak Farmasi A-01-04', 'A', '01', '02', '02', 'RACK', 1, 500),
('A-02-01', 'Rak Farmasi A-02-01', 'A', '02', '01', '01', 'RACK', 1, 500),
('A-02-02', 'Rak Farmasi A-02-02', 'A', '02', '01', '02', 'RACK', 1, 500),
('B-01-01', 'Rak FMCG B-01-01', 'B', '01', '01', '01', 'RACK', 2, 1000),
('B-01-02', 'Rak FMCG B-01-02', 'B', '01', '01', '02', 'RACK', 2, 1000),
('B-01-03', 'Rak FMCG B-01-03', 'B', '01', '02', '01', 'RACK', 2, 1000),
('B-02-01', 'Rak FMCG B-02-01', 'B', '02', '01', '01', 'RACK', 2, 1000),
('B-02-02', 'Rak FMCG B-02-02', 'B', '02', '01', '02', 'RACK', 2, 1000),
('C-01-01', 'Rak Umum C-01-01', 'C', '01', '01', '01', 'RACK', 1, 400),
('C-01-02', 'Rak Umum C-01-02', 'C', '01', '01', '02', 'RACK', 1, 400),
('C-02-01', 'Rak Umum C-02-01', 'C', '02', '01', '01', 'RACK', 1, 400),
('D-01-01', 'Cold Room D-01-01', 'D', '01', '01', '01', 'RACK', 1, 600),
('D-01-02', 'Cold Room D-01-02', 'D', '01', '01', '02', 'RACK', 1, 600)
ON CONFLICT (id) DO NOTHING;

-- Insert Master Products (12 Kolom SAP)
INSERT INTO products (sku, sku_name, sap_code, category, qty_rack, qty_sap, qty_on_hand, qty_on_order, available_qty, reserve_qty, is_under_reserve, status, unit, min_stock, preferred_zone) VALUES
('SKU-MED-001', 'Paracetamol 500mg Strip (Box 100)', 'SAP-100234', 'Farmasi & Medis', 350, 350, 350, 100, 300, 50, 'Yes', 'Active', 'BOX', 50, 'A'),
('SKU-MED-002', 'Amoxicillin 500mg Kapsul', 'SAP-100235', 'Farmasi & Medis', 75, 75, 75, 50, 75, 0, 'No', 'Active', 'BOX', 30, 'A'),
('SKU-FMCG-101', 'Minyak Goreng Sawit Premium 2L Pouch', 'SAP-200451', 'FMCG & Sembako', 0, 120, 120, 200, 120, 0, 'No', 'Active', 'CTN', 80, 'B'),
('SKU-FMCG-102', 'Susu UHT Full Cream 1000ml', 'SAP-200452', 'Dairy & Minuman', 0, 80, 80, 150, 80, 0, 'No', 'Near Expiry', 'CTN', 100, 'B'),
('SKU-FMCG-103', 'Kopi Bubuk Arabika Spesial 250g', 'SAP-300109', 'FMCG & Minuman', 90, 90, 90, 60, 70, 20, 'Yes', 'Active', 'PCS', 40, 'C'),
('SKU-BEV-201', 'Teh Hijau Organik 50 Tea Bags', 'SAP-300110', 'FMCG & Minuman', 0, 0, 0, 100, 0, 0, 'No', 'Out of Stock', 'BOX', 25, 'C'),
('SKU-CHILL-301', 'Butter Premium Anchor 227g (Salted)', 'SAP-400812', 'Cold Storage', 110, 110, 110, 50, 80, 30, 'Yes', 'Active', 'BOX', 60, 'D'),
('SKU-ELEC-401', 'Barcode Scanner Handheld 2D Wireless', 'SAP-500921', 'Hardware & Logistik', 15, 15, 15, 10, 15, 0, 'No', 'Active', 'UNIT', 15, 'C')
ON CONFLICT (sku) DO NOTHING;

-- Insert Initial Stock Items
INSERT INTO stock_items (id, lp_id, sku, name, sap_code, category, batch_no, exp_date, qty, unit, location, status) VALUES
('STK-001', 'LP-20260820-001', 'SKU-MED-001', 'Paracetamol 500mg Strip (Box 100)', 'SAP-100234', 'Farmasi & Medis', 'BATCH-PCT-202607', '2027-07-15', 200, 'BOX', 'A-01-02', 'STORED'),
('STK-002', 'LP-20260825-001', 'SKU-MED-001', 'Paracetamol 500mg Strip (Box 100)', 'SAP-100234', 'Farmasi & Medis', 'BATCH-PCT-202608', '2027-08-20', 150, 'BOX', 'A-01-01', 'STORED'),
('STK-003', 'LP-20260821-002', 'SKU-MED-002', 'Amoxicillin 500mg Kapsul', 'SAP-100235', 'Farmasi & Medis', 'BATCH-AMX-2601', '2026-10-10', 75, 'BOX', 'A-01-03', 'STORED'),
('STK-004', 'LP-20260825-002', 'SKU-FMCG-101', 'Minyak Goreng Sawit Premium 2L Pouch', 'SAP-200451', 'FMCG & Sembako', 'BATCH-MG-26A', '2027-02-15', 120, 'CTN', 'STG-01', 'STAGING'),
('STK-005', 'LP-20260825-003', 'SKU-FMCG-102', 'Susu UHT Full Cream 1000ml', 'SAP-200452', 'Dairy & Minuman', 'BATCH-UHT-2609', '2026-09-20', 80, 'CTN', 'STG-01', 'STAGING'),
('STK-006', 'LP-20260815-001', 'SKU-FMCG-103', 'Kopi Bubuk Arabika Spesial 250g', 'SAP-300109', 'FMCG & Minuman', 'BATCH-KOP-2601', '2027-04-10', 90, 'PCS', 'C-01-01', 'STORED'),
('STK-007', 'LP-20260818-004', 'SKU-CHILL-301', 'Butter Premium Anchor 227g (Salted)', 'SAP-400812', 'Cold Storage', 'BATCH-BTR-889', '2026-11-30', 110, 'BOX', 'D-01-01', 'STORED')
ON CONFLICT (id) DO NOTHING;
