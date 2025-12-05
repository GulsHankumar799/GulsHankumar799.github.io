<?php
// register.php
session_start();
require_once 'config.php';

header('Content-Type: application/json');

// Rate limiting for registration
$ip_address = $_SERVER['REMOTE_ADDR'];
$rate_limit_key = "register_attempts_$ip_address";

if (!check_rate_limit($rate_limit_key, 3, 3600)) { // 3 attempts per hour
    http_response_code(429);
    echo json_encode([
        'success' => false,
        'message' => 'Too many registration attempts. Please try again later.'
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

    // Honeypot check
    if (!empty($_POST['website'])) {
        // Bot detected - return fake success
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Registration successful! Check your email.'
        ]);
        exit();
    }

    // Get and sanitize input
    $full_name = sanitize_input($_POST['full_name'] ?? '');
    $email = filter_var($_POST['email'], FILTER_SANITIZE_EMAIL);
    $username = sanitize_input($_POST['username'] ?? '');
    $password = $_POST['password'];
    $confirm_password = $_POST['confirm_password'] ?? '';
    $company = sanitize_input($_POST['company'] ?? '');
    $phone = sanitize_input($_POST['phone'] ?? '');

    // Validate required fields
    $errors = [];

    if (empty($full_name)) {
        $errors['full_name'] = 'Full name is required';
    } elseif (strlen($full_name) < 2 || strlen($full_name) > 100) {
        $errors['full_name'] = 'Full name must be between 2 and 100 characters';
    }

    if (empty($email)) {
        $errors['email'] = 'Email is required';
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors['email'] = 'Invalid email format';
    }

    if (empty($username)) {
        $errors['username'] = 'Username is required';
    } elseif (strlen($username) < 3 || strlen($username) > 50) {
        $errors['username'] = 'Username must be between 3 and 50 characters';
    } elseif (!preg_match('/^[a-zA-Z0-9_]+$/', $username)) {
        $errors['username'] = 'Username can only contain letters, numbers, and underscores';
    }

    if (empty($password)) {
        $errors['password'] = 'Password is required';
    } elseif (strlen($password) < 8) {
        $errors['password'] = 'Password must be at least 8 characters';
    } elseif (!preg_match('/[A-Z]/', $password)) {
        $errors['password'] = 'Password must contain at least one uppercase letter';
    } elseif (!preg_match('/[a-z]/', $password)) {
        $errors['password'] = 'Password must contain at least one lowercase letter';
    } elseif (!preg_match('/[0-9]/', $password)) {
        $errors['password'] = 'Password must contain at least one number';
    } elseif (!preg_match('/[^A-Za-z0-9]/', $password)) {
        $errors['password'] = 'Password must contain at least one special character';
    }

    if ($password !== $confirm_password) {
        $errors['confirm_password'] = 'Passwords do not match';
    }

    if (!empty($phone) && !preg_match('/^[0-9\-\+\(\)\s]{10,15}$/', $phone)) {
        $errors['phone'] = 'Invalid phone number format';
    }

    // If there are validation errors
    if (!empty($errors)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Validation failed',
            'errors' => $errors
        ]);
        exit();
    }

    try {
        $conn = get_db_connection();

        // Check if email already exists
        $stmt = $conn->prepare("SELECT id FROM users WHERE email = ? OR username = ?");
        $stmt->bind_param("ss", $email, $username);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            $stmt->close();
            http_response_code(409);
            echo json_encode([
                'success' => false,
                'message' => 'Email or username already exists'
            ]);
            exit();
        }
        $stmt->close();

        // Hash password
        $password_hash = hash_password($password);

        // Generate verification token
        $verification_token = bin2hex(random_bytes(32));
        $verification_expiry = date('Y-m-d H:i:s', time() + (24 * 60 * 60)); // 24 hours

        // Insert user into database
        $stmt = $conn->prepare("
            INSERT INTO users (username, email, password_hash, full_name, phone, company, 
                              verification_token, verification_expiry, status, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())
        ");
        
        $stmt->bind_param("ssssssss", $username, $email, $password_hash, $full_name, 
                         $phone, $company, $verification_token, $verification_expiry);
        
        if (!$stmt->execute()) {
            throw new Exception("Failed to create user: " . $stmt->error);
        }
        
        $user_id = $stmt->insert_id;
        $stmt->close();

        // Generate email verification link
        $verification_link = SITE_URL . "/php/verify-email.php?token=$verification_token&email=" . urlencode($email);

        // Send verification email
        $subject = "Verify Your Email - CyberShield Pro";
        $message = "
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #0a0e17; color: #00f3ff; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
                .button { display: inline-block; background: #00f3ff; color: #0a0e17; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
                .code { background: #e9ecef; padding: 10px; border-radius: 5px; font-family: monospace; margin: 10px 0; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h2>Welcome to CyberShield Pro!</h2>
                </div>
                <div class='content'>
                    <p>Hi $full_name,</p>
                    <p>Thank you for registering with CyberShield Pro. To complete your registration, please verify your email address by clicking the button below:</p>
                    
                    <div style='text-align: center;'>
                        <a href='$verification_link' class='button'>Verify Email Address</a>
                    </div>
                    
                    <p>Or copy and paste this link in your browser:</p>
                    <div class='code'>$verification_link</div>
                    
                    <p>This verification link will expire in 24 hours.</p>
                    
                    <p>If you didn't create an account with us, please ignore this email.</p>
                    
                    <hr>
                    <p style='color: #666; font-size: 12px;'>
                        This email was sent to $email<br>
                        CyberShield Pro • 123 Security Blvd, San Francisco, CA
                    </p>
                </div>
            </div>
        </body>
        </html>
        ";

        // Send email
        $headers = [
            'MIME-Version' => '1.0',
            'Content-type' => 'text/html; charset=UTF-8',
            'From' => 'CyberShield Pro <no-reply@cybershieldpro.com>',
            'Reply-To' => SUPPORT_EMAIL,
            'X-Mailer' => 'PHP/' . phpversion()
        ];

        $header_string = '';
        foreach ($headers as $key => $value) {
            $header_string .= "$key: $value\r\n";
        }

        $email_sent = mail($email, $subject, $message, $header_string);

        // Log activity
        log_activity($user_id, 'registration', 'User registered successfully');
        log_security_event('user_registration', "New user registered: $email");

        $conn->close();

        // Generate new CSRF token
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));

        // Return success response
        echo json_encode([
            'success' => true,
            'message' => 'Registration successful! Please check your email to verify your account.',
            'requires_verification' => true,
            'email_sent' => $email_sent,
            'user_id' => $user_id
        ]);

    } catch (Exception $e) {
        error_log("Registration error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'An error occurred during registration. Please try again.'
        ]);
    }
} else {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed'
    ]);
}
?>