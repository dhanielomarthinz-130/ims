<?php
/**
 * Reset Database to Initial Demo State API Endpoint
 */

require_once __DIR__ . '/../config/db.php';

try {
    $pdo = Database::getConnection();
    $sqlFile = __DIR__ . '/../database.sql';

    if (!file_exists($sqlFile)) {
        sendJsonResponse(['success' => false, 'message' => 'database.sql tidak ditemukan.'], 404);
    }

    $sql = file_get_contents($sqlFile);
    $pdo->exec($sql);

    sendJsonResponse([
        'success' => true,
        'message' => 'Seluruh data inventori di MySQL berhasil direset ke kondisi awal demo!'
    ]);
} catch (Exception $e) {
    sendJsonResponse(['success' => false, 'message' => 'Gagal reset database: ' . $e->getMessage()], 500);
}
