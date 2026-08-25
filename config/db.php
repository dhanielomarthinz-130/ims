<?php
/**
 * Database Configuration & PDO Connection Manager
 * Automatically connects to MySQL on XAMPP and creates database/tables if needed.
 */

define('DB_HOST', '127.0.0.1');
define('DB_PORT', '3306');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'wms_inventory');

class Database {
    private static ?PDO $pdo = null;

    public static function getConnection(): PDO {
        if (self::$pdo === null) {
            try {
                // Connect to MySQL server
                $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";charset=utf8mb4";
                $options = [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ];

                $tempPdo = new PDO($dsn, DB_USER, DB_PASS, $options);
                
                // Ensure database exists
                $tempPdo->exec("CREATE DATABASE IF NOT EXISTS `" . DB_NAME . "` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
                $tempPdo->exec("USE `" . DB_NAME . "`");

                self::$pdo = $tempPdo;

                // Check if tables exist, if not auto initialize
                self::ensureTablesInitialized();

            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Database Connection Failed: ' . $e->getMessage()
                ]);
                exit;
            }
        }
        return self::$pdo;
    }

    private static function ensureTablesInitialized(): void {
        $stmt = self::$pdo->query("SHOW TABLES LIKE 'users'");
        if ($stmt->rowCount() === 0) {
            $sqlFile = __DIR__ . '/../database.sql';
            if (file_exists($sqlFile)) {
                $sql = file_get_contents($sqlFile);
                self::$pdo->exec($sql);
            }
        }
    }
}

/**
 * Helper to send JSON responses with CORS headers
 */
function sendJsonResponse(array $data, int $statusCode = 200): void {
    if (!headers_sent()) {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    }
    
    if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        exit;
    }

    echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}
