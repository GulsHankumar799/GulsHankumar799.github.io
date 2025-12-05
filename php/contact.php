<?php
// contact.php
session_start();
header('Content-Type: application/json');

// Security headers
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');

// Database connection
$servername = "localhost";
$username = "your_username";
$password = "your_password";
$dbname = "cybershield_pro";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit();
}

// CSRF token validation
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($_POST['csrf_token']) || $_POST['csrf_token'] !== $_SESSION['csrf_token']) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'CSRF validation failed']);
        exit();
    }
}

// Input validation and sanitization
function sanitize_input($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data, ENT_QUOTES, 'UTF-8');
    return $data;
}

// Validate email
function validate_email($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL);
}

// Validate phone
function validate_phone($phone) {
    return preg_match('/^[0-9\-\+\(\)\s]{10,15}$/', $phone);
}

// Honeypot field check
if (!empty($_POST['website'])) {
    // Bot detected - silently fail
    http_response_code(200);
    echo json_encode(['success' => true, 'message' => 'Thank you for your message!']);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get form data
    $name = sanitize_input($_POST['name'] ?? '');
    $email = sanitize_input($_POST['email'] ?? '');
    $phone = sanitize_input($_POST['phone'] ?? '');
    $company = sanitize_input($_POST['company'] ?? '');
    $service = sanitize_input($_POST['service'] ?? '');
    $message = sanitize_input($_POST['message'] ?? '');
    
    // Validate required fields
    if (empty($name) || empty($email) || empty($message)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Please fill all required fields']);
        exit();
    }
    
    // Validate email
    if (!validate_email($email)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Please enter a valid email address']);
        exit();
    }
    
    // Validate phone if provided
    if (!empty($phone) && !validate_phone($phone)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Please enter a valid phone number']);
        exit();
    }
    
    // Prepare SQL statement (prevent SQL injection)
    $stmt = $conn->prepare("INSERT INTO contact_submissions (name, email, phone, company, service, message, ip_address, user_agent, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())");
    
    // Get client info
    $ip_address = $_SERVER['REMOTE_ADDR'];
    $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';
    
    // Bind parameters
    $stmt->bind_param("ssssssss", $name, $email, $phone, $company, $service, $message, $ip_address, $user_agent);
    
    // Execute statement
    if ($stmt->execute()) {
        // Send email notification (optional)
        $to = "info@cybershieldpro.com";
        $subject = "New Contact Form Submission - CyberShield Pro";
        $email_message = "
        <html>
        <head>
            <title>New Contact Form Submission</title>
            <style>
                body { font-family: Arial, sans-serif; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #0a0e17; color: #00f3ff; padding: 20px; text-align: center; }
                .content { background: #f8f9fa; padding: 20px; }
                .field { margin-bottom: 15px; }
                .label { font-weight: bold; color: #0a0e17; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h2>New Contact Form Submission</h2>
                </div>
                <div class='content'>
                    <div class='field'><span class='label'>Name:</span> $name</div>
                    <div class='field'><span class='label'>Email:</span> $email</div>
                    <div class='field'><span class='label'>Phone:</span> $phone</div>
                    <div class='field'><span class='label'>Company:</span> $company</div>
                    <div class='field'><span class='label'>Service:</span> $service</div>
                    <div class='field'><span class='label'>Message:</span><br>$message</div>
                    <div class='field'><span class='label'>IP Address:</span> $ip_address</div>
                    <div class='field'><span class='label'>Timestamp:</span> " . date('Y-m-d H:i:s') . "</div>
                </div>
            </div>
        </body>
        </html>
        ";
        
        // Email headers
        $headers = "MIME-Version: 1.0" . "\r\n";
        $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
        $headers .= "From: no-reply@cybershieldpro.com" . "\r\n";
        $headers .= "Reply-To: $email" . "\r\n";
        
        // Send email
        mail($to, $subject, $email_message, $headers);
        
        // Success response
        echo json_encode([
            'success' => true,
            'message' => 'Thank you for your message! We will get back to you soon.',
            'submission_id' => $stmt->insert_id
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to save your message. Please try again.']);
    }
    
    $stmt->close();
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}

$conn->close();
?>