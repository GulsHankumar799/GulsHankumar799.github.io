<?php
// config.php - Main configuration file

// Database configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'cybershield_user');
define('DB_PASS', 'StrongPassword123!');
define('DB_NAME', 'cybershield_pro');

// Site configuration
define('SITE_NAME', 'CyberShield Pro');
define('SITE_URL', 'https://cybershieldpro.com');
define('ADMIN_EMAIL', 'admin@cybershieldpro.com');
define('SUPPORT_EMAIL', 'support@cybershieldpro.com');

// Security configuration
define('CSRF_TOKEN_LIFETIME', 3600); // 1 hour
define('SESSION_TIMEOUT', 1800); // 30 minutes
define('MAX_LOGIN_ATTEMPTS', 5);
define('LOCKOUT_TIME', 900); // 15 minutes

// File upload configuration
define('MAX_UPLOAD_SIZE', 5242880); // 5MB in bytes
define('ALLOWED_FILE_TYPES', ['pdf', 'doc', 'docx', 'jpg', 'png', 'jpeg']);
define('UPLOAD_PATH', '/var/www/uploads/');

// Email configuration
define('SMTP_HOST', 'smtp.gmail.com');
define('SMTP_PORT', 587);
define('SMTP_USER', 'noreply@cybershieldpro.com');
define('SMTP_PASS', 'YourEmailPassword');

// API Keys (store in environment variables in production)
define('RECAPTCHA_SITE_KEY', 'your_recaptcha_site_key');
define('RECAPTCHA_SECRET_KEY', 'your_recaptcha_secret_key');

// Error reporting
if (ENVIRONMENT === 'development') {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
    ini_set('log_errors', 1);
    ini_set('error_log', '/var/log/php/cybershield_errors.log');
}

// Timezone
date_default_timezone_set('America/Los_Angeles');

// Start session with security settings
session_start([
    'name' => 'cybershield_session',
    'cookie_lifetime' => 86400, // 24 hours
    'cookie_secure' => true, // Only send over HTTPS
    'cookie_httponly' => true, // Prevent JavaScript access
    'cookie_samesite' => 'Strict', // CSRF protection
    'use_strict_mode' => true, // Prevent session fixation
    'use_cookies' => true,
    'use_only_cookies' => true
]);

// CSRF Token Generation
function generate_csrf_token() {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        $_SESSION['csrf_token_time'] = time();
    }
    return $_SESSION['csrf_token'];
}

// CSRF Token Validation
function validate_csrf_token($token) {
    if (!isset($_SESSION['csrf_token']) || !isset($_SESSION['csrf_token_time'])) {
        return false;
    }
    
    if ($_SESSION['csrf_token'] !== $token) {
        return false;
    }
    
    // Check if token is expired
    $token_lifetime = time() - $_SESSION['csrf_token_time'];
    if ($token_lifetime > CSRF_TOKEN_LIFETIME) {
        unset($_SESSION['csrf_token']);
        unset($_SESSION['csrf_token_time']);
        return false;
    }
    
    return true;
}

// Database connection function
function get_db_connection() {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    
    if ($conn->connect_error) {
        error_log("Database connection failed: " . $conn->connect_error);
        throw new Exception('Database connection failed');
    }
    
    $conn->set_charset("utf8mb4");
    return $conn;
}

// Input sanitization function
function sanitize_input($data) {
    if (is_array($data)) {
        return array_map('sanitize_input', $data);
    }
    
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    return $data;
}

// Generate secure random string
function generate_random_string($length = 32) {
    return bin2hex(random_bytes($length / 2));
}

// Password hashing and verification
function hash_password($password) {
    return password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
}

function verify_password($password, $hash) {
    return password_verify($password, $hash);
}

// Rate limiting function
function check_rate_limit($key, $limit = 10, $time_window = 60) {
    $current_time = time();
    $cache_key = "rate_limit_$key";
    
    if (!isset($_SESSION[$cache_key])) {
        $_SESSION[$cache_key] = [
            'count' => 1,
            'timestamp' => $current_time
        ];
        return true;
    }
    
    $data = $_SESSION[$cache_key];
    
    if ($current_time - $data['timestamp'] > $time_window) {
        $_SESSION[$cache_key] = [
            'count' => 1,
            'timestamp' => $current_time
        ];
        return true;
    }
    
    if ($data['count'] >= $limit) {
        return false;
    }
    
    $_SESSION[$cache_key]['count']++;
    return true;
}

// Log activity
function log_activity($user_id, $action, $details = '') {
    $conn = get_db_connection();
    $stmt = $conn->prepare("INSERT INTO activity_logs (user_id, action, details, ip_address, user_agent, created_at) VALUES (?, ?, ?, ?, ?, NOW())");
    
    $ip_address = $_SERVER['REMOTE_ADDR'];
    $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';
    
    $stmt->bind_param("issss", $user_id, $action, $details, $ip_address, $user_agent);
    $stmt->execute();
    $stmt->close();
    $conn->close();
}

// Send email function
function send_email($to, $subject, $message, $headers = []) {
    $default_headers = [
        'MIME-Version' => '1.0',
        'Content-type' => 'text/html; charset=UTF-8',
        'From' => 'CyberShield Pro <noreply@cybershieldpro.com>',
        'Reply-To' => 'support@cybershieldpro.com',
        'X-Mailer' => 'PHP/' . phpversion()
    ];
    
    $headers = array_merge($default_headers, $headers);
    
    $header_string = '';
    foreach ($headers as $key => $value) {
        $header_string .= "$key: $value\r\n";
    }
    
    return mail($to, $subject, $message, $header_string);
}

// Security headers
function set_security_headers() {
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('X-XSS-Protection: 1; mode=block');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    header('Permissions-Policy: geolocation=(), microphone=(), camera=()');
    
    // CSP Header (Content Security Policy)
    $csp = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://unpkg.com https://cdn.tailwindcss.com",
        "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.tailwindcss.com https://fonts.googleapis.com",
        "img-src 'self' data: https:",
        "font-src 'self' https://fonts.gstatic.com",
        "connect-src 'self'",
        "frame-ancestors 'none'",
        "form-action 'self'"
    ];
    
    header("Content-Security-Policy: " . implode('; ', $csp));
}

// Call security headers
set_security_headers();
?>