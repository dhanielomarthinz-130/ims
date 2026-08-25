<?php
/**
 * Authentication & User Management API Endpoint
 */

require_once __DIR__ . '/../config/db.php';

session_start();

$action = $_GET['action'] ?? ($_POST['action'] ?? 'me');
$pdo = Database::getConnection();

switch ($action) {
    case 'login':
        $raw = file_get_contents('php://input');
        $body = json_decode($raw, true) ?? $_POST;

        $username = trim($body['username'] ?? '');
        $password = trim($body['password'] ?? '');

        if (empty($username) || empty($password)) {
            sendJsonResponse(['success' => false, 'message' => 'Username dan Password wajib diisi.'], 400);
        }

        // Search user by username OR name
        $stmt = $pdo->prepare("SELECT * FROM users WHERE LOWER(username) = LOWER(:u) OR LOWER(name) = LOWER(:u) LIMIT 1");
        $stmt->execute(['u' => $username]);
        $user = $stmt->fetch();

        if (!$user || $user['password'] !== $password) {
            sendJsonResponse(['success' => false, 'message' => 'Username atau Password salah.'], 401);
        }

        if ($user['status'] !== 'ACTIVE') {
            sendJsonResponse(['success' => false, 'message' => 'Akun Anda sedang dinonaktifkan.'], 403);
        }

        // Setup session
        $_SESSION['user'] = [
            'id' => $user['id'],
            'username' => $user['username'],
            'name' => $user['name'],
            'role' => $user['role'],
            'division' => $user['division'],
            'avatar' => $user['avatar'],
            'loggedInAt' => date('c')
        ];

        sendJsonResponse([
            'success' => true,
            'user' => $_SESSION['user']
        ]);
        break;

    case 'me':
        if (!empty($_SESSION['user'])) {
            sendJsonResponse(['success' => true, 'user' => $_SESSION['user']]);
        } else {
            sendJsonResponse(['success' => false, 'message' => 'Belum login.'], 401);
        }
        break;

    case 'logout':
        $_SESSION = [];
        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000,
                $params["path"], $params["domain"],
                $params["secure"], $params["httponly"]
            );
        }
        session_destroy();
        sendJsonResponse(['success' => true, 'message' => 'Berhasil logout.']);
        break;

    case 'users':
        $stmt = $pdo->query("SELECT id, username, name, role, division, avatar, status, created_at FROM users ORDER BY created_at ASC");
        $users = $stmt->fetchAll();
        sendJsonResponse(['success' => true, 'users' => $users]);
        break;

    case 'add_user':
        $raw = file_get_contents('php://input');
        $body = json_decode($raw, true) ?? $_POST;

        $username = trim($body['username'] ?? '');
        $password = trim($body['password'] ?? '');
        $name = trim($body['name'] ?? '');
        $role = trim($body['role'] ?? 'INBOUND');
        $division = trim($body['division'] ?? '');
        $avatar = trim($body['avatar'] ?? '👤');

        if (empty($username) || empty($password) || empty($name)) {
            sendJsonResponse(['success' => false, 'message' => 'Username, Password, dan Nama wajib diisi.'], 400);
        }

        // Check duplicate
        $stmt = $pdo->prepare("SELECT id FROM users WHERE LOWER(username) = LOWER(:u)");
        $stmt->execute(['u' => $username]);
        if ($stmt->fetch()) {
            sendJsonResponse(['success' => false, 'message' => "Username '{$username}' sudah digunakan."], 400);
        }

        $id = 'USR-' . time();
        $insert = $pdo->prepare("INSERT INTO users (id, username, password, name, role, division, avatar, status, created_at) VALUES (:id, :u, :p, :name, :role, :div, :avatar, 'ACTIVE', NOW())");
        $insert->execute([
            'id' => $id,
            'u' => $username,
            'p' => $password,
            'name' => $name,
            'role' => $role,
            'div' => $division,
            'avatar' => $avatar
        ]);

        sendJsonResponse([
            'success' => true,
            'message' => 'Pengguna berhasil ditambahkan.',
            'user' => [
                'id' => $id,
                'username' => $username,
                'name' => $name,
                'role' => $role,
                'division' => $division,
                'avatar' => $avatar,
                'status' => 'ACTIVE'
            ]
        ]);
        break;

    case 'delete_user':
        $id = $_GET['id'] ?? ($_POST['id'] ?? '');
        if (empty($id)) {
            sendJsonResponse(['success' => false, 'message' => 'User ID wajib disertakan.'], 400);
        }
        if ($id === 'USR-001') {
            sendJsonResponse(['success' => false, 'message' => 'Akun Super Admin utama tidak dapat dihapus.'], 400);
        }

        $stmt = $pdo->prepare("DELETE FROM users WHERE id = :id");
        $stmt->execute(['id' => $id]);
        sendJsonResponse(['success' => true, 'message' => 'Pengguna berhasil dihapus.']);
        break;

    default:
        sendJsonResponse(['success' => false, 'message' => 'Action tidak valid.'], 400);
}
