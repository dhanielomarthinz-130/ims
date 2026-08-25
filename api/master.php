<?php
/**
 * Master Data (SKUs & Locations) API Endpoint
 */

require_once __DIR__ . '/../config/db.php';

$action = $_GET['action'] ?? ($_POST['action'] ?? 'all');
$pdo = Database::getConnection();

switch ($action) {
    case 'all':
        $skus = $pdo->query("SELECT * FROM skus ORDER BY sku ASC")->fetchAll();
        $locations = $pdo->query("SELECT * FROM locations ORDER BY id ASC")->fetchAll();
        sendJsonResponse([
            'success' => true,
            'skus' => $skus,
            'locations' => $locations
        ]);
        break;

    case 'skus':
        $skus = $pdo->query("SELECT * FROM skus ORDER BY sku ASC")->fetchAll();
        sendJsonResponse(['success' => true, 'skus' => $skus]);
        break;

    case 'locations':
        $locations = $pdo->query("SELECT * FROM locations ORDER BY id ASC")->fetchAll();
        sendJsonResponse(['success' => true, 'locations' => $locations]);
        break;

    case 'add_sku':
        $raw = file_get_contents('php://input');
        $body = json_decode($raw, true) ?? $_POST;

        $sku = trim($body['sku'] ?? '');
        $name = trim($body['name'] ?? '');
        $sapCode = trim($body['sapCode'] ?? $body['sap_code'] ?? '');
        $category = trim($body['category'] ?? 'General');
        $unit = trim($body['unit'] ?? 'Pcs');
        $minStock = (int)($body['minStock'] ?? 10);
        $maxStock = (int)($body['maxStock'] ?? 500);

        if (empty($sku) || empty($name)) {
            sendJsonResponse(['success' => false, 'message' => 'SKU dan Nama Produk wajib diisi.'], 400);
        }

        if (empty($sapCode)) {
            $sapCode = 'SAP-' . rand(100000, 999999);
        }

        $stmt = $pdo->prepare("
            INSERT INTO skus (sku, name, sap_code, category, unit, min_stock, max_stock, is_under_reserve, status, created_at)
            VALUES (:sku, :name, :sap, :cat, :unit, :min, :max, 'No', 'Active', NOW())
            ON DUPLICATE KEY UPDATE
                name = VALUES(name),
                category = VALUES(category),
                unit = VALUES(unit),
                min_stock = VALUES(min_stock),
                max_stock = VALUES(max_stock)
        ");
        $stmt->execute([
            'sku' => $sku,
            'name' => $name,
            'sap' => $sapCode,
            'cat' => $category,
            'unit' => $unit,
            'min' => $minStock,
            'max' => $maxStock
        ]);

        sendJsonResponse(['success' => true, 'message' => "Master SKU {$sku} berhasil disimpan."]);
        break;

    case 'add_location':
        $raw = file_get_contents('php://input');
        $body = json_decode($raw, true) ?? $_POST;

        $id = trim($body['id'] ?? '');
        $name = trim($body['name'] ?? '');
        $zone = trim($body['zone'] ?? 'A');
        $type = trim($body['type'] ?? 'RACK');
        $capacity = (int)($body['capacity'] ?? 10);

        if (empty($id) || empty($name)) {
            sendJsonResponse(['success' => false, 'message' => 'ID Lokasi dan Nama Lokasi wajib diisi.'], 400);
        }

        $stmt = $pdo->prepare("
            INSERT INTO locations (id, name, zone, type, capacity, is_active)
            VALUES (:id, :name, :zone, :type, :cap, 1)
            ON DUPLICATE KEY UPDATE
                name = VALUES(name),
                zone = VALUES(zone),
                type = VALUES(type),
                capacity = VALUES(capacity)
        ");
        $stmt->execute([
            'id' => $id,
            'name' => $name,
            'zone' => $zone,
            'type' => $type,
            'cap' => $capacity
        ]);

        sendJsonResponse(['success' => true, 'message' => "Lokasi {$id} berhasil disimpan."]);
        break;

    default:
        sendJsonResponse(['success' => false, 'message' => 'Action tidak valid.'], 400);
}
