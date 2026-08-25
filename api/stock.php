<?php
/**
 * Stock & 12-Column SAP Reconciliation API Endpoint
 */

require_once __DIR__ . '/../config/db.php';

$action = $_GET['action'] ?? ($_POST['action'] ?? 'reconciliation');
$pdo = Database::getConnection();

switch ($action) {
    case 'reconciliation':
    case 'list':
        // Fetch all SKUs
        $skuStmt = $pdo->query("SELECT * FROM skus ORDER BY sku ASC");
        $skus = $skuStmt->fetchAll();

        // Calculate Qty in Rack from stock_items where status = 'STORED'
        $rackStockStmt = $pdo->query("SELECT sku, SUM(qty) as total_rack_qty FROM stock_items WHERE status = 'STORED' GROUP BY sku");
        $rackStockMap = [];
        while ($row = $rackStockStmt->fetch()) {
            $rackStockMap[$row['sku']] = (int)$row['total_rack_qty'];
        }

        // Build 12-column SAP schema
        $reconciliation = array_map(function ($s) use ($rackStockMap) {
            $sku = $s['sku'];
            $qtyRack = $rackStockMap[$sku] ?? 0;
            $qtySap = (int)$s['qty_sap'];
            $qtyOnHand = $qtyRack;
            $qtyOnOrder = (int)$s['qty_on_order'];
            $reserveQty = (int)$s['reserve_qty'];
            $availableQty = max(0, $qtyOnHand - $reserveQty);
            $isUnderReserve = ($reserveQty > 0 || $s['is_under_reserve'] === 'Yes') ? 'Yes' : 'No';

            return [
                'sku' => $s['sku'],
                'skuName' => $s['name'],
                'sapCode' => $s['sap_code'],
                'category' => $s['category'],
                'unit' => $s['unit'],
                'qtyRack' => $qtyRack,
                'qtySap' => $qtySap,
                'qtyOnHand' => $qtyOnHand,
                'qtyOnOrder' => $qtyOnOrder,
                'availableQty' => $availableQty,
                'reserveQty' => $reserveQty,
                'isUnderReserve' => $isUnderReserve,
                'status' => $s['status'],
                'minStock' => (int)$s['min_stock'],
                'maxStock' => (int)$s['max_stock']
            ];
        }, $skus);

        sendJsonResponse([
            'success' => true,
            'data' => $reconciliation,
            'skus' => $skus
        ]);
        break;

    case 'items':
        // Individual pallet / stock lot list
        $status = $_GET['status'] ?? 'ALL';
        $location = $_GET['location'] ?? 'ALL';

        $sql = "SELECT s.*, l.name as location_name, l.zone, l.type as location_type 
                FROM stock_items s 
                LEFT JOIN locations l ON s.location_id = l.id 
                WHERE 1=1";
        $params = [];

        if ($status !== 'ALL') {
            $sql .= " AND s.status = :status";
            $params['status'] = $status;
        }
        if ($location !== 'ALL') {
            $sql .= " AND s.location_id = :loc";
            $params['loc'] = $location;
        }

        $sql .= " ORDER BY s.inbounded_at DESC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $items = $stmt->fetchAll();

        sendJsonResponse([
            'success' => true,
            'items' => $items
        ]);
        break;

    case 'import':
        $raw = file_get_contents('php://input');
        $body = json_decode($raw, true) ?? $_POST;
        $products = $body['products'] ?? [];
        $mode = $body['mode'] ?? 'MERGE'; // 'MERGE' or 'REPLACE'

        if (empty($products) || !is_array($products)) {
            sendJsonResponse(['success' => false, 'message' => 'Data produk import tidak valid.'], 400);
        }

        $pdo->beginTransaction();
        try {
            if ($mode === 'REPLACE') {
                $pdo->exec("DELETE FROM skus");
            }

            $stmt = $pdo->prepare("
                INSERT INTO skus (sku, name, sap_code, category, unit, qty_sap, qty_on_order, reserve_qty, is_under_reserve, status)
                VALUES (:sku, :name, :sap_code, :category, :unit, :qty_sap, :qty_on_order, :reserve_qty, :is_under_reserve, :status)
                ON DUPLICATE KEY UPDATE
                    name = VALUES(name),
                    sap_code = VALUES(sap_code),
                    category = VALUES(category),
                    unit = VALUES(unit),
                    qty_sap = VALUES(qty_sap),
                    qty_on_order = VALUES(qty_on_order),
                    reserve_qty = VALUES(reserve_qty),
                    is_under_reserve = VALUES(is_under_reserve),
                    status = VALUES(status)
            ");

            $importedCount = 0;
            foreach ($products as $p) {
                $sku = trim($p['sku'] ?? $p['SKU'] ?? '');
                if (empty($sku)) continue;

                $stmt->execute([
                    'sku' => $sku,
                    'name' => $p['skuName'] ?? $p['Sku Name'] ?? $p['name'] ?? $sku,
                    'sap_code' => $p['sapCode'] ?? $p['Sap Code'] ?? ('SAP-' . rand(100000, 999999)),
                    'category' => $p['category'] ?? $p['Category'] ?? 'General Goods',
                    'unit' => $p['unit'] ?? $p['Unit'] ?? 'Pcs',
                    'qty_sap' => (int)($p['qtySap'] ?? $p['Qty Sap'] ?? 0),
                    'qty_on_order' => (int)($p['qtyOnOrder'] ?? $p['Qty On Order'] ?? 0),
                    'reserve_qty' => (int)($p['reserveQty'] ?? $p['Reserve Qty'] ?? 0),
                    'is_under_reserve' => ($p['isUnderReserve'] ?? $p['Is Under Reserve'] ?? 'No') === 'Yes' ? 'Yes' : 'No',
                    'status' => $p['status'] ?? $p['Status'] ?? 'Active'
                ]);
                $importedCount++;
            }

            $pdo->commit();
            sendJsonResponse([
                'success' => true,
                'message' => "Berhasil mengimpor {$importedCount} produk.",
                'count' => $importedCount
            ]);
        } catch (Exception $e) {
            $pdo->rollBack();
            sendJsonResponse(['success' => false, 'message' => 'Gagal import produk: ' . $e->getMessage()], 500);
        }
        break;

    default:
        sendJsonResponse(['success' => false, 'message' => 'Action tidak valid.'], 400);
}
