<?php
/**
 * Putaway & Stock Movement API Endpoint
 */

require_once __DIR__ . '/../config/db.php';

$action = $_GET['action'] ?? ($_POST['action'] ?? 'staging_queue');
$pdo = Database::getConnection();

switch ($action) {
    case 'staging_queue':
        $stmt = $pdo->query("
            SELECT s.*, sk.category, sk.sap_code, l.name as staging_name
            FROM stock_items s
            LEFT JOIN skus sk ON s.sku = sk.sku
            LEFT JOIN locations l ON s.location_id = l.id
            WHERE s.status = 'STAGING'
            ORDER BY s.inbounded_at ASC
        ");
        $items = $stmt->fetchAll();
        sendJsonResponse(['success' => true, 'queue' => $items]);
        break;

    case 'suggest_rack':
        $sku = $_GET['sku'] ?? '';
        $lpId = $_GET['lp_id'] ?? '';

        // If LP provided, find SKU
        if (!empty($lpId) && empty($sku)) {
            $itemStmt = $pdo->prepare("SELECT sku FROM stock_items WHERE lp_id = :lp LIMIT 1");
            $itemStmt->execute(['lp' => $lpId]);
            $sku = $itemStmt->fetchColumn() ?: '';
        }

        // Get SKU details
        $skuStmt = $pdo->prepare("SELECT * FROM skus WHERE sku = :sku LIMIT 1");
        $skuStmt->execute(['sku' => $sku]);
        $skuData = $skuStmt->fetch();

        $category = $skuData['category'] ?? 'General';
        
        // Zone mapping
        $targetZone = 'B';
        if (stripos($category, 'Farmasi') !== false || stripos($category, 'Medis') !== false) {
            $targetZone = 'A';
        } elseif (stripos($category, 'Cold') !== false || stripos($category, 'Frozen') !== false || stripos($category, 'Vaksin') !== false) {
            $targetZone = 'D';
        } elseif (stripos($category, 'Tech') !== false || stripos($category, 'Elektronik') !== false || stripos($category, 'General') !== false) {
            $targetZone = 'C';
        }

        // Find available rack in target zone
        $rackStmt = $pdo->prepare("
            SELECT l.*, COUNT(s.id) as current_occupancy
            FROM locations l
            LEFT JOIN stock_items s ON l.id = s.location_id AND s.status = 'STORED'
            WHERE l.type = 'RACK' AND l.zone = :zone
            GROUP BY l.id
            HAVING current_occupancy < l.capacity
            ORDER BY current_occupancy ASC, l.id ASC
            LIMIT 1
        ");
        $rackStmt->execute(['zone' => $targetZone]);
        $suggestedRack = $rackStmt->fetch();

        if (!$suggestedRack) {
            // Fallback to any available rack
            $fallbackStmt = $pdo->query("
                SELECT l.*, COUNT(s.id) as current_occupancy
                FROM locations l
                LEFT JOIN stock_items s ON l.id = s.location_id AND s.status = 'STORED'
                WHERE l.type = 'RACK'
                GROUP BY l.id
                HAVING current_occupancy < l.capacity
                ORDER BY current_occupancy ASC, l.id ASC
                LIMIT 1
            ");
            $suggestedRack = $fallbackStmt->fetch();
        }

        sendJsonResponse([
            'success' => true,
            'sku' => $skuData,
            'suggestedZone' => $targetZone,
            'suggestedRack' => $suggestedRack ? $suggestedRack['id'] : 'A-01-01',
            'suggestedRackDetails' => $suggestedRack
        ]);
        break;

    case 'confirm_putaway':
        $raw = file_get_contents('php://input');
        $body = json_decode($raw, true) ?? $_POST;

        $lpId = trim($body['lpId'] ?? $body['lp_id'] ?? '');
        $targetLocation = trim($body['targetLocation'] ?? $body['target_location'] ?? '');
        $operatorName = trim($body['operatorName'] ?? $body['operator_name'] ?? 'Rian Pratama (Putaway)');
        $operatorId = trim($body['operatorId'] ?? $body['operator_id'] ?? '');

        if (empty($lpId) || empty($targetLocation)) {
            sendJsonResponse(['success' => false, 'message' => 'License Plate (LP) dan Lokasi Rak Tujuan wajib diisi.'], 400);
        }

        $pdo->beginTransaction();
        try {
            // Find item in stock_items
            $itemStmt = $pdo->prepare("SELECT * FROM stock_items WHERE lp_id = :lp LIMIT 1 FOR UPDATE");
            $itemStmt->execute(['lp' => $lpId]);
            $item = $itemStmt->fetch();

            if (!$item) {
                $pdo->rollBack();
                sendJsonResponse(['success' => false, 'message' => "Item dengan Barcode LP '{$lpId}' tidak ditemukan."], 404);
            }

            $fromLocation = $item['location_id'];

            // Update item to STORED in new location
            $updateStmt = $pdo->prepare("
                UPDATE stock_items 
                SET location_id = :loc, status = 'STORED', putaway_at = NOW(), putaway_by = :op 
                WHERE lp_id = :lp
            ");
            $updateStmt->execute([
                'loc' => $targetLocation,
                'op' => $operatorName,
                'lp' => $lpId
            ]);

            // Create movement log audit trail
            $logId = 'LOG-' . date('Ymd-His') . '-' . rand(100, 999);
            $logStmt = $pdo->prepare("
                INSERT INTO movement_logs (id, lp_id, sku, from_location, to_location, qty, unit, user_name, user_id, type, created_at)
                VALUES (:id, :lp, :sku, :from, :to, :qty, :unit, :user, :uid, 'PUTAWAY', NOW())
            ");
            $logStmt->execute([
                'id' => $logId,
                'lp' => $lpId,
                'sku' => $item['sku'],
                'from' => $fromLocation,
                'to' => $targetLocation,
                'qty' => $item['qty'],
                'unit' => $item['unit'],
                'user' => $operatorName,
                'uid' => $operatorId
            ]);

            // Update Inbound Doc status if applicable
            if (!empty($item['inbound_doc_no'])) {
                $inbDocNo = $item['inbound_doc_no'];
                $checkStagingStmt = $pdo->prepare("SELECT count(*) FROM stock_items WHERE inbound_doc_no = :doc AND status = 'STAGING'");
                $checkStagingStmt->execute(['doc' => $inbDocNo]);
                $remainingInStaging = (int)$checkStagingStmt->fetchColumn();

                $newStatus = ($remainingInStaging === 0) ? 'PUTAWAY_COMPLETED' : 'PUTAWAY_PARTIAL';
                $updDocStmt = $pdo->prepare("UPDATE inbound_docs SET status = :st WHERE doc_no = :doc");
                $updDocStmt->execute(['st' => $newStatus, 'doc' => $inbDocNo]);
            }

            $pdo->commit();

            sendJsonResponse([
                'success' => true,
                'message' => "Sukses! {$item['name']} ({$lpId}) telah berhasil di-putaway ke Rak {$targetLocation}.",
                'item' => [
                    'lpId' => $lpId,
                    'sku' => $item['sku'],
                    'name' => $item['name'],
                    'qty' => $item['qty'],
                    'unit' => $item['unit'],
                    'fromLocation' => $fromLocation,
                    'toLocation' => $targetLocation,
                    'putawayAt' => date('c'),
                    'putawayBy' => $operatorName
                ]
            ]);
        } catch (Exception $e) {
            $pdo->rollBack();
            sendJsonResponse(['success' => false, 'message' => 'Gagal konfirmasi putaway: ' . $e->getMessage()], 500);
        }
        break;

    case 'logs':
        $limit = (int)($_GET['limit'] ?? 20);
        $stmt = $pdo->prepare("
            SELECT m.*, s.name as sku_name
            FROM movement_logs m
            LEFT JOIN skus s ON m.sku = s.sku
            ORDER BY m.created_at DESC
            LIMIT :lim
        ");
        $stmt->bindValue(':lim', $limit, PDO::PARAM_INT);
        $stmt->execute();
        $logs = $stmt->fetchAll();

        sendJsonResponse(['success' => true, 'logs' => $logs]);
        break;

    default:
        sendJsonResponse(['success' => false, 'message' => 'Action tidak valid.'], 400);
}
