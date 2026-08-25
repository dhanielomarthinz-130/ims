<?php
/**
 * Inbound Staging & GRN Receiving API Endpoint
 */

require_once __DIR__ . '/../config/db.php';

$action = $_GET['action'] ?? ($_POST['action'] ?? 'list');
$pdo = Database::getConnection();

switch ($action) {
    case 'list':
        $stmt = $pdo->query("SELECT * FROM inbound_docs ORDER BY created_at DESC");
        $docs = $stmt->fetchAll();
        sendJsonResponse(['success' => true, 'docs' => $docs]);
        break;

    case 'create':
        $raw = file_get_contents('php://input');
        $body = json_decode($raw, true) ?? $_POST;

        $poNo = trim($body['poNo'] ?? '');
        $supplier = trim($body['supplier'] ?? '');
        $stagingLocation = trim($body['stagingLocation'] ?? 'STG-01');
        $receivedBy = trim($body['receivedBy'] ?? 'Operator Inbound');
        $items = $body['items'] ?? [];

        if (empty($poNo) || empty($supplier) || empty($items) || !is_array($items)) {
            sendJsonResponse(['success' => false, 'message' => 'PO, Supplier, dan Item Barang wajib diisi.'], 400);
        }

        $pdo->beginTransaction();
        try {
            $inboundId = 'INB-' . time();
            $docNo = 'GRN-' . date('Ymd-His');
            $totalQty = 0;
            $createdStockItems = [];

            // Insert stock items first
            $stockStmt = $pdo->prepare("
                INSERT INTO stock_items (id, lp_id, sku, name, batch_no, exp_date, qty, unit, location_id, status, inbound_doc_no, inbounded_at)
                VALUES (:id, :lp, :sku, :name, :batch, :exp, :qty, :unit, :loc, 'STAGING', :doc, NOW())
            ");

            foreach ($items as $idx => $item) {
                $sku = trim($item['sku'] ?? '');
                $name = trim($item['name'] ?? $sku);
                $batchNo = trim($item['batchNo'] ?? ('BATCH-' . date('Ymd')));
                $expDate = trim($item['expDate'] ?? date('Y-m-d', strtotime('+1 year')));
                $qty = (int)($item['qty'] ?? 1);
                $unit = trim($item['unit'] ?? 'Pcs');

                $lpId = 'LP-' . date('Ymd') . '-' . str_pad(rand(100, 999), 3, '0', STR_PAD_LEFT);
                $stockId = 'STK-' . time() . '-' . ($idx + 1);

                $stockStmt->execute([
                    'id' => $stockId,
                    'lp' => $lpId,
                    'sku' => $sku,
                    'name' => $name,
                    'batch' => $batchNo,
                    'exp' => $expDate,
                    'qty' => $qty,
                    'unit' => $unit,
                    'loc' => $stagingLocation,
                    'doc' => $docNo
                ]);

                $totalQty += $qty;
                $createdStockItems[] = [
                    'id' => $stockId,
                    'lpId' => $lpId,
                    'sku' => $sku,
                    'name' => $name,
                    'batchNo' => $batchNo,
                    'expDate' => $expDate,
                    'qty' => $qty,
                    'unit' => $unit,
                    'location' => $stagingLocation,
                    'status' => 'STAGING',
                    'inboundDocNo' => $docNo
                ];
            }

            // Insert Inbound Doc
            $docStmt = $pdo->prepare("
                INSERT INTO inbound_docs (id, doc_no, po_no, supplier, status, received_by, staging_location, total_items, total_qty, created_at)
                VALUES (:id, :doc, :po, :supp, 'RECEIVED', :by, :loc, :cnt, :qty, NOW())
            ");
            $docStmt->execute([
                'id' => $inboundId,
                'doc' => $docNo,
                'po' => $poNo,
                'supp' => $supplier,
                'by' => $receivedBy,
                'loc' => $stagingLocation,
                'cnt' => count($items),
                'qty' => $totalQty
            ]);

            $pdo->commit();

            sendJsonResponse([
                'success' => true,
                'message' => "Dokumen Inbound {$docNo} berhasil dibuat.",
                'doc' => [
                    'id' => $inboundId,
                    'docNo' => $docNo,
                    'poNo' => $poNo,
                    'supplier' => $supplier,
                    'stagingLocation' => $stagingLocation,
                    'totalItems' => count($items),
                    'totalQty' => $totalQty,
                    'createdAt' => date('c')
                ],
                'stockItems' => $createdStockItems
            ]);
        } catch (Exception $e) {
            $pdo->rollBack();
            sendJsonResponse(['success' => false, 'message' => 'Gagal membuat inbound: ' . $e->getMessage()], 500);
        }
        break;

    default:
        sendJsonResponse(['success' => false, 'message' => 'Action tidak valid.'], 400);
}
