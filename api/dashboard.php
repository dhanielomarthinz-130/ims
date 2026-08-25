<?php
/**
 * Dashboard & Warehouse Metrics API Endpoint
 */

require_once __DIR__ . '/../config/db.php';

$pdo = Database::getConnection();

// 1. Total stock items & units
$stockItems = $pdo->query("SELECT * FROM stock_items")->fetchAll();
$skus = $pdo->query("SELECT * FROM skus")->fetchAll();
$locations = $pdo->query("SELECT * FROM locations")->fetchAll();
$inboundDocs = $pdo->query("SELECT * FROM inbound_docs ORDER BY created_at DESC LIMIT 10")->fetchAll();
$movementLogs = $pdo->query("SELECT * FROM movement_logs ORDER BY created_at DESC LIMIT 10")->fetchAll();

$stagingItems = array_filter($stockItems, fn($s) => $s['status'] === 'STAGING');
$storedItems = array_filter($stockItems, fn($s) => $s['status'] === 'STORED');

$totalUnits = array_reduce($storedItems, fn($sum, $item) => $sum + (int)$item['qty'], 0);
$stagingTotalUnits = array_reduce($stagingItems, fn($sum, $item) => $sum + (int)$item['qty'], 0);

// 2. Near Expiry calculation (< 30 days)
$today = new DateTime();
$expiringItems = array_filter($stockItems, function ($s) use ($today) {
    if (empty($s['exp_date'])) return false;
    $expDate = new DateTime($s['exp_date']);
    $diff = $today->diff($expDate);
    $days = (int)$diff->format('%r%a');
    return $days <= 30;
});

// 3. Rack Occupancy
$rackLocations = array_filter($locations, fn($l) => $l['type'] === 'RACK');
$occupiedRackIds = array_unique(array_column($storedItems, 'location_id'));
$occupiedCount = count($occupiedRackIds);
$totalRacks = max(1, count($rackLocations));
$occupancyRate = round(($occupiedCount / $totalRacks) * 100);

sendJsonResponse([
    'success' => true,
    'metrics' => [
        'totalUnits' => $totalUnits,
        'storedBatchCount' => count($storedItems),
        'stagingCount' => count($stagingItems),
        'stagingTotalUnits' => $stagingTotalUnits,
        'occupancyRate' => $occupancyRate,
        'occupiedRacks' => $occupiedCount,
        'totalRacks' => count($rackLocations),
        'expiringSoonCount' => count($expiringItems)
    ],
    'stockItems' => $stockItems,
    'locations' => $locations,
    'skus' => $skus,
    'inboundDocs' => $inboundDocs,
    'movementLogs' => $movementLogs
]);
