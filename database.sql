-- ==============================================================================
-- WMS SMART INVENTORY MANAGEMENT SYSTEM (12-KOLOM SAP SCHEMA & RBAC)
-- Native MySQL Database Definition & Initial Seed Data
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS `wms_inventory` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `wms_inventory`;

-- 1. USERS & RBAC ROLES TABLE
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(50) PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `role` VARCHAR(50) NOT NULL,
  `division` VARCHAR(100) NOT NULL,
  `avatar` VARCHAR(20) DEFAULT '👤',
  `status` ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. SKUS (MASTER PRODUK & 12-KOLOM SAP ATTRIBUTES) TABLE
CREATE TABLE IF NOT EXISTS `skus` (
  `sku` VARCHAR(50) PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `sap_code` VARCHAR(50) NOT NULL UNIQUE,
  `category` VARCHAR(50) NOT NULL,
  `unit` VARCHAR(20) NOT NULL DEFAULT 'Pcs',
  `qty_sap` INT NOT NULL DEFAULT 0,
  `qty_on_order` INT NOT NULL DEFAULT 0,
  `reserve_qty` INT NOT NULL DEFAULT 0,
  `min_stock` INT NOT NULL DEFAULT 10,
  `max_stock` INT NOT NULL DEFAULT 500,
  `image_url` VARCHAR(255) DEFAULT '',
  `is_under_reserve` ENUM('Yes', 'No') DEFAULT 'No',
  `status` ENUM('Active', 'Near Expiry', 'Out of Stock') DEFAULT 'Active',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. LOCATIONS (MASTER RAK & STAGING DOCK) TABLE
CREATE TABLE IF NOT EXISTS `locations` (
  `id` VARCHAR(50) PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `zone` VARCHAR(20) NOT NULL,
  `aisle` VARCHAR(10) DEFAULT '',
  `rack_level` VARCHAR(10) DEFAULT '',
  `bin` VARCHAR(10) DEFAULT '',
  `type` ENUM('STAGING', 'RACK', 'QC', 'DAMAGED') NOT NULL DEFAULT 'RACK',
  `capacity` INT NOT NULL DEFAULT 5,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. INBOUND DOCUMENTS (GRN & SURAT JALAN) TABLE
CREATE TABLE IF NOT EXISTS `inbound_docs` (
  `id` VARCHAR(50) PRIMARY KEY,
  `doc_no` VARCHAR(50) NOT NULL UNIQUE,
  `po_no` VARCHAR(50) NOT NULL,
  `supplier` VARCHAR(150) NOT NULL,
  `status` ENUM('RECEIVED', 'PUTAWAY_PARTIAL', 'PUTAWAY_COMPLETED') DEFAULT 'RECEIVED',
  `received_by` VARCHAR(100) NOT NULL,
  `staging_location` VARCHAR(50) NOT NULL,
  `total_items` INT NOT NULL DEFAULT 0,
  `total_qty` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. STOCK ITEMS (PALLET / LICENSE PLATE STAGING & RACK STOCK) TABLE
CREATE TABLE IF NOT EXISTS `stock_items` (
  `id` VARCHAR(50) PRIMARY KEY,
  `lp_id` VARCHAR(50) NOT NULL UNIQUE,
  `sku` VARCHAR(50) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `batch_no` VARCHAR(50) NOT NULL,
  `exp_date` DATE NOT NULL,
  `qty` INT NOT NULL DEFAULT 0,
  `unit` VARCHAR(20) NOT NULL DEFAULT 'Pcs',
  `location_id` VARCHAR(50) NOT NULL,
  `status` ENUM('STAGING', 'STORED', 'RESERVED', 'DAMAGED') NOT NULL DEFAULT 'STAGING',
  `inbound_doc_no` VARCHAR(50) DEFAULT '',
  `inbounded_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `putaway_at` DATETIME NULL,
  `putaway_by` VARCHAR(100) NULL,
  INDEX `idx_stock_sku` (`sku`),
  INDEX `idx_stock_loc` (`location_id`),
  INDEX `idx_stock_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. STOCK MOVEMENT AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS `movement_logs` (
  `id` VARCHAR(50) PRIMARY KEY,
  `lp_id` VARCHAR(50) NOT NULL,
  `sku` VARCHAR(50) NOT NULL,
  `from_location` VARCHAR(50) NOT NULL,
  `to_location` VARCHAR(50) NOT NULL,
  `qty` INT NOT NULL,
  `unit` VARCHAR(20) NOT NULL,
  `user_name` VARCHAR(100) NOT NULL,
  `user_id` VARCHAR(50) DEFAULT '',
  `type` VARCHAR(50) NOT NULL DEFAULT 'PUTAWAY',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ==============================================================================
-- INITIAL SEED DATA (Demo Dataset)
-- ==============================================================================

-- 1. SEED USERS
INSERT INTO `users` (`id`, `username`, `password`, `name`, `role`, `division`, `avatar`, `status`, `created_at`) VALUES
('USR-001', 'daniel', 'Dh@niel0', 'Daniel Imsula', 'SUPER_ADMIN', 'Super Administrator', '👑', 'ACTIVE', '2026-08-25 08:00:00'),
('USR-002', 'inbound.op', 'inbound123', 'Budi Santoso (Inbound)', 'INBOUND', 'Inbound Staging Area', '📥', 'ACTIVE', '2026-08-25 08:00:00'),
('USR-003', 'putaway.op', 'putaway123', 'Rian Pratama (Putaway)', 'PUTAWAY', 'Warehouse Putaway & Rack Movement', '🚜', 'ACTIVE', '2026-08-25 08:00:00'),
('USR-004', 'checker.ic', 'checker123', 'Siti Rahma (IC Checker)', 'CHECKER', 'Inventory Control & Audit', '🔍', 'ACTIVE', '2026-08-25 08:00:00'),
('USR-005', 'supervisor', 'spv123', 'Hendro Wijaya (Supervisor)', 'SUPERVISOR', 'Warehouse Operations Supervisor', '👔', 'ACTIVE', '2026-08-25 08:00:00')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- 2. SEED LOCATIONS (STAGING & RACKS ZONA A-D)
INSERT INTO `locations` (`id`, `name`, `zone`, `aisle`, `rack_level`, `bin`, `type`, `capacity`, `is_active`) VALUES
('STG-01', 'Staging Dock Pintu 1', 'STAGING', '01', '00', '01', 'STAGING', 20, 1),
('STG-02', 'Staging Dock Pintu 2', 'STAGING', '02', '00', '01', 'STAGING', 20, 1),
('STG-03', 'Staging Dock Pintu 3', 'STAGING', '03', '00', '01', 'STAGING', 20, 1),
('A-01-01', 'Rak Farmasi Baris 1 Kolom 1', 'A', '01', '01', '01', 'RACK', 10, 1),
('A-01-02', 'Rak Farmasi Baris 1 Kolom 2', 'A', '01', '01', '02', 'RACK', 10, 1),
('A-02-01', 'Rak Farmasi Baris 2 Kolom 1', 'A', '02', '01', '01', 'RACK', 10, 1),
('A-02-02', 'Rak Farmasi Baris 2 Kolom 2', 'A', '02', '01', '02', 'RACK', 10, 1),
('B-01-01', 'Rak FMCG Baris 1 Kolom 1', 'B', '01', '01', '01', 'RACK', 10, 1),
('B-01-02', 'Rak FMCG Baris 1 Kolom 2', 'B', '01', '01', '02', 'RACK', 10, 1),
('B-02-01', 'Rak FMCG Baris 2 Kolom 1', 'B', '02', '01', '01', 'RACK', 10, 1),
('B-02-02', 'Rak FMCG Baris 2 Kolom 2', 'B', '02', '01', '02', 'RACK', 10, 1),
('C-01-01', 'Rak Tech Baris 1 Kolom 1', 'C', '01', '01', '01', 'RACK', 10, 1),
('C-01-02', 'Rak Tech Baris 1 Kolom 2', 'C', '01', '01', '02', 'RACK', 10, 1),
('C-02-01', 'Rak Tech Baris 2 Kolom 1', 'C', '02', '01', '01', 'RACK', 10, 1),
('D-01-01', 'Cold Storage Baris 1 Kolom 1', 'D', '01', '01', '01', 'RACK', 10, 1),
('D-01-02', 'Cold Storage Baris 1 Kolom 2', 'D', '01', '01', '02', 'RACK', 10, 1)
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- 3. SEED SKUS (12-KOLOM SAP)
INSERT INTO `skus` (`sku`, `name`, `sap_code`, `category`, `unit`, `qty_sap`, `qty_on_order`, `reserve_qty`, `min_stock`, `max_stock`, `image_url`, `is_under_reserve`, `status`) VALUES
('SKU-MED-001', 'Paracetamol 500mg Box (100 Strip)', 'SAP-901102', 'Farmasi & Medis', 'Box', 120, 50, 0, 20, 500, '', 'No', 'Active'),
('SKU-MED-002', 'Amoxicillin 500mg Kapsul', 'SAP-901103', 'Farmasi & Medis', 'Box', 45, 0, 15, 10, 200, '', 'Yes', 'Near Expiry'),
('SKU-FMCG-101', 'Minyak Goreng Sawit 2L Premium', 'SAP-800201', 'FMCG & Sembako', 'Pouch', 350, 100, 50, 50, 1000, '', 'Yes', 'Active'),
('SKU-FMCG-102', 'Beras Ramos Super 5kg Bag', 'SAP-800202', 'FMCG & Sembako', 'Bag', 80, 0, 0, 15, 300, '', 'No', 'Active'),
('SKU-TECH-501', 'Barcode Scanner 2D Wireless Handheld', 'SAP-700501', 'General Goods & Tech', 'Unit', 25, 10, 5, 5, 100, '', 'Yes', 'Active'),
('SKU-COLD-901', 'Vaksin Influenza Imunisasi 5ml', 'SAP-600901', 'Cold Chain & Frozen', 'Vial', 15, 0, 0, 10, 50, '', 'No', 'Active')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- 4. SEED STOCK ITEMS
INSERT INTO `stock_items` (`id`, `lp_id`, `sku`, `name`, `batch_no`, `exp_date`, `qty`, `unit`, `location_id`, `status`, `inbound_doc_no`, `inbounded_at`, `putaway_at`, `putaway_by`) VALUES
('STK-101', 'LP-20260825-001', 'SKU-MED-001', 'Paracetamol 500mg Box (100 Strip)', 'BATCH-2026-A1', '2027-08-20', 120, 'Box', 'A-01-01', 'STORED', 'GRN-2026-0801', '2026-08-25 09:00:00', '2026-08-25 09:30:00', 'Rian Pratama'),
('STK-102', 'LP-20260825-002', 'SKU-MED-002', 'Amoxicillin 500mg Kapsul', 'BATCH-2026-B4', '2026-09-15', 45, 'Box', 'A-01-02', 'STORED', 'GRN-2026-0801', '2026-08-25 09:00:00', '2026-08-25 09:35:00', 'Rian Pratama'),
('STK-103', 'LP-20260825-003', 'SKU-FMCG-101', 'Minyak Goreng Sawit 2L Premium', 'BATCH-2026-F1', '2027-12-30', 350, 'Pouch', 'B-01-01', 'STORED', 'GRN-2026-0802', '2026-08-25 10:00:00', '2026-08-25 10:45:00', 'Rian Pratama'),
('STK-104', 'LP-20260825-004', 'SKU-FMCG-102', 'Beras Ramos Super 5kg Bag', 'BATCH-2026-R8', '2027-06-15', 80, 'Bag', 'B-02-01', 'STORED', 'GRN-2026-0802', '2026-08-25 10:00:00', '2026-08-25 11:00:00', 'Rian Pratama'),
('STK-105', 'LP-20260825-005', 'SKU-TECH-501', 'Barcode Scanner 2D Wireless Handheld', 'BATCH-2026-T9', '2029-01-01', 25, 'Unit', 'C-01-01', 'STORED', 'GRN-2026-0803', '2026-08-25 11:30:00', '2026-08-25 12:15:00', 'Rian Pratama'),
('STK-106', 'LP-20260825-006', 'SKU-COLD-901', 'Vaksin Influenza Imunisasi 5ml', 'BATCH-2026-V2', '2027-03-10', 15, 'Vial', 'D-01-01', 'STORED', 'GRN-2026-0803', '2026-08-25 11:30:00', '2026-08-25 12:30:00', 'Rian Pratama'),
-- Item in Staging Area awaiting Putaway
('STK-107', 'LP-20260825-007', 'SKU-MED-001', 'Paracetamol 500mg Box (100 Strip)', 'BATCH-2026-A2', '2027-08-20', 50, 'Box', 'STG-01', 'STAGING', 'GRN-2026-0804', '2026-08-25 14:00:00', NULL, NULL),
('STK-108', 'LP-20260825-008', 'SKU-FMCG-101', 'Minyak Goreng Sawit 2L Premium', 'BATCH-2026-F2', '2027-12-30', 100, 'Pouch', 'STG-02', 'STAGING', 'GRN-2026-0804', '2026-08-25 14:00:00', NULL, NULL)
ON DUPLICATE KEY UPDATE `qty`=VALUES(`qty`);

-- 5. SEED INBOUND DOCS
INSERT INTO `inbound_docs` (`id`, `doc_no`, `po_no`, `supplier`, `status`, `received_by`, `staging_location`, `total_items`, `total_qty`, `created_at`) VALUES
('INB-001', 'GRN-2026-0801', 'PO-2026-8891', 'PT Kimia Farma Trading', 'PUTAWAY_COMPLETED', 'Budi Santoso', 'STG-01', 2, 165, '2026-08-25 09:00:00'),
('INB-002', 'GRN-2026-0802', 'PO-2026-8892', 'PT Indofood Sukses Makmur', 'PUTAWAY_COMPLETED', 'Budi Santoso', 'STG-02', 2, 430, '2026-08-25 10:00:00'),
('INB-003', 'GRN-2026-0803', 'PO-2026-8893', 'PT Mega Elektronik & Farmasi', 'PUTAWAY_COMPLETED', 'Budi Santoso', 'STG-03', 2, 40, '2026-08-25 11:30:00'),
('INB-004', 'GRN-2026-0804', 'PO-2026-8894', 'PT Sinar Mitra Distribusi', 'RECEIVED', 'Budi Santoso', 'STG-01', 2, 150, '2026-08-25 14:00:00')
ON DUPLICATE KEY UPDATE `status`=VALUES(`status`);

-- 6. SEED MOVEMENT LOGS
INSERT INTO `movement_logs` (`id`, `lp_id`, `sku`, `from_location`, `to_location`, `qty`, `unit`, `user_name`, `user_id`, `type`, `created_at`) VALUES
('LOG-001', 'LP-20260825-001', 'SKU-MED-001', 'STG-01', 'A-01-01', 120, 'Box', 'Rian Pratama', 'USR-003', 'PUTAWAY', '2026-08-25 09:30:00'),
('LOG-002', 'LP-20260825-002', 'SKU-MED-002', 'STG-01', 'A-01-02', 45, 'Box', 'Rian Pratama', 'USR-003', 'PUTAWAY', '2026-08-25 09:35:00'),
('LOG-003', 'LP-20260825-003', 'SKU-FMCG-101', 'STG-02', 'B-01-01', 350, 'Pouch', 'Rian Pratama', 'USR-003', 'PUTAWAY', '2026-08-25 10:45:00'),
('LOG-004', 'LP-20260825-004', 'SKU-FMCG-102', 'STG-02', 'B-02-01', 80, 'Bag', 'Rian Pratama', 'USR-003', 'PUTAWAY', '2026-08-25 11:00:00'),
('LOG-005', 'LP-20260825-005', 'SKU-TECH-501', 'STG-03', 'C-01-01', 25, 'Unit', 'Rian Pratama', 'USR-003', 'PUTAWAY', '2026-08-25 12:15:00'),
('LOG-006', 'LP-20260825-006', 'SKU-COLD-901', 'STG-03', 'D-01-01', 15, 'Vial', 'Rian Pratama', 'USR-003', 'PUTAWAY', '2026-08-25 12:30:00')
ON DUPLICATE KEY UPDATE `qty`=VALUES(`qty`);
