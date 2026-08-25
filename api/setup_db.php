<?php
/**
 * One-Click Database Setup & Reset Script
 */

require_once __DIR__ . '/../config/db.php';

try {
    $pdo = Database::getConnection();
    $sqlFile = __DIR__ . '/../database.sql';

    if (!file_exists($sqlFile)) {
        sendJsonResponse(['success' => false, 'message' => 'File database.sql tidak ditemukan.'], 404);
    }

    $sql = file_get_contents($sqlFile);
    $pdo->exec($sql);

    // Verify record counts
    $counts = [
        'users' => (int)$pdo->query("SELECT count(*) FROM users")->fetchColumn(),
        'skus' => (int)$pdo->query("SELECT count(*) FROM skus")->fetchColumn(),
        'locations' => (int)$pdo->query("SELECT count(*) FROM locations")->fetchColumn(),
        'stock_items' => (int)$pdo->query("SELECT count(*) FROM stock_items")->fetchColumn(),
        'inbound_docs' => (int)$pdo->query("SELECT count(*) FROM inbound_docs")->fetchColumn(),
        'movement_logs' => (int)$pdo->query("SELECT count(*) FROM movement_logs")->fetchColumn(),
    ];

    sendJsonResponse([
        'success' => true,
        'message' => 'Database wms_inventory berhasil diinisialisasi!',
        'tables' => $counts
    ]);
} catch (Exception $e) {
    sendJsonResponse([
        'success' => false,
        'message' => 'Gagal setup database: ' . $e->getMessage()
    ], 500);
}
