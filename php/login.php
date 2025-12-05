<?php
// login.php
session_start();
require_once 'config.php';

header('Content-Type: application/json');

// Rate limiting for login attempts
$ip_address = $_SERVER['REMOTE_ADDR'];
$rate_limit_key = "login_attempts_$ip_address";

if (!check_rate_limit($rate_limit_key, 5, 300)) { // 5 attempts per 5 minutes
    http_response_code(429);
    echo json_encode([
        'success' => false,
        'message' => 'Too many login attempts. Please try again later.'
    ]);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Validate CSRF token
    if (!isset($_POST['csrf_token']) || !validate_csrf_token($_POST['csrf_token'])) {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'message' => 'Security validation failed'
        ]);
        exit();
    }

    // Get and sanitize input
    $email = filter_var($_POST['email'], FILTER_SANITIZE_EMAIL);
    $password = $_POST['password'];
    $remember_me = isset($_POST['remember_me']);

    // Validate input
    if (empty($email) || empty($password)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Please enter email and password'
        ]);
        exit();
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid email format'
        ]);
        exit();
    }

    // Database connection
    try {
        $conn = get_db_connection();

        // Check if user exists and is not locked
        $stmt = $conn->prepare("
            SELECT id, username, email, password_hash, role, status, 
                   login_attempts, locked_until, full_name 
            FROM users 
            WHERE email = ? 
            LIMIT 1
        ");
        
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            // Log failed attempt
            log_security_event('failed_login', "Non-existent user attempt: $email");
            
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid credentials'
            ]);
            exit();
        }

        $user = $result->fetch_assoc();
        $stmt->close();

        // Check if account is locked
        if ($user['locked_until'] && strtotime($user['locked_until']) > time()) {
            $lock_time = date('h:i A', strtotime($user['locked_until']));
            http_response_code(423);
            echo json_encode([
                'success' => false,
                'message' => "Account is locked until $lock_time"
            ]);
            exit();
        }

        // Verify password
        if (!verify_password($password, $user['password_hash'])) {
            // Increment login attempts
            $new_attempts = $user['login_attempts'] + 1;
            
            if ($new_attempts >= MAX_LOGIN_ATTEMPTS) {
                // Lock the account
                $lock_time = date('Y-m-d H:i:s', time() + LOCKOUT_TIME);
                $stmt = $conn->prepare("
                    UPDATE users 
                    SET login_attempts = ?, locked_until = ? 
                    WHERE id = ?
                ");
                $stmt->bind_param("isi", $new_attempts, $lock_time, $user['id']);
                
                // Log security event
                log_security_event('suspicious_activity', 
                    "Account locked due to multiple failed login attempts: $email");
            } else {
                $stmt = $conn->prepare("
                    UPDATE users 
                    SET login_attempts = ? 
                    WHERE id = ?
                ");
                $stmt->bind_param("ii", $new_attempts, $user['id']);
            }
            
            $stmt->execute();
            $stmt->close();
            
            log_security_event('failed_login', "Failed login attempt for: $email");
            
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid credentials'
            ]);
            exit();
        }

        // Check if account is active
        if ($user['status'] !== 'active') {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'message' => 'Account is not active. Please contact support.'
            ]);
            exit();
        }

        // Login successful - reset attempts and update last login
        $stmt = $conn->prepare("
            UPDATE users 
            SET login_attempts = 0, locked_until = NULL, last_login = NOW() 
            WHERE id = ?
        ");
        $stmt->bind_param("i", $user['id']);
        $stmt->execute();
        $stmt->close();

        // Create session
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['email'] = $user['email'];
        $_SESSION['role'] = $user['role'];
        $_SESSION['full_name'] = $user['full_name'];
        $_SESSION['login_time'] = time();

        // Generate session token for remember me
        if ($remember_me) {
            $token = generate_random_string(32);
            $token_hash = hash('sha256', $token);
            
            // Store token in database
            $expiry = date('Y-m-d H:i:s', time() + (30 * 24 * 60 * 60)); // 30 days
            $stmt = $conn->prepare("
                INSERT INTO user_sessions (user_id, token_hash, expires_at) 
                VALUES (?, ?, ?)
            ");
            $stmt->bind_param("iss", $user['id'], $token_hash, $expiry);
            $stmt->execute();
            $stmt->close();
            
            // Set cookie
            setcookie('remember_token', $token, [
                'expires' => time() + (30 * 24 * 60 * 60),
                'path' => '/',
                'domain' => $_SERVER['HTTP_HOST'],
                'secure' => true,
                'httponly' => true,
                'samesite' => 'Strict'
            ]);
        }

        // Regenerate session ID for security
        session_regenerate_id(true);

        // Log successful login
        log_activity($user['id'], 'login', 'User logged in successfully');
        log_security_event('login_attempt', "Successful login: $email");

        // Generate new CSRF token for next request
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));

        // Close connection
        $conn->close();

        // Return success response
        echo json_encode([
            'success' => true,
            'message' => 'Login successful!',
            'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'email' => $user['email'],
                'full_name' => $user['full_name'],
                'role' => $user['role']
            ],
            'redirect' => get_redirect_url($user['role'])
        ]);

    } catch (Exception $e) {
        error_log("Login error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'An error occurred. Please try again.'
        ]);
    }
} else {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed'
    ]);
}

// Helper function to get redirect URL based on role
function get_redirect_url($role) {
    switch ($role) {
        case 'admin':
            return '/admin/dashboard.php';
        case 'manager':
            return '/manager/dashboard.php';
        default:
            return '/dashboard.php';
    }
}

// Helper function to log security events
function log_security_event($event_type, $details = '') {
    try {
        $conn = get_db_connection();
        $stmt = $conn->prepare("
            INSERT INTO security_logs (event_type, details, ip_address, user_agent, severity) 
            VALUES (?, ?, ?, ?, ?)
        ");
        
        $ip_address = $_SERVER['REMOTE_ADDR'];
        $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';
        $severity = get_severity_level($event_type);
        
        $stmt->bind_param("sssss", $event_type, $details, $ip_address, $user_agent, $severity);
        $stmt->execute();
        $stmt->close();
        $conn->close();
    } catch (Exception $e) {
        error_log("Failed to log security event: " . $e->getMessage());
    }
}

// Helper function to determine severity level
function get_severity_level($event_type) {
    switch ($event_type) {
        case 'failed_login':
            return 'medium';
        case 'suspicious_activity':
            return 'high';
        case 'login_attempt':
            return 'low';
        default:
            return 'low';
    }
}
?>