<?php
// newsletter.php
header('Content-Type: application/json');

// Rate limiting check
session_start();
if (!isset($_SESSION['last_submission'])) {
    $_SESSION['last_submission'] = 0;
}

$current_time = time();
if ($current_time - $_SESSION['last_submission'] < 60) { // 60 seconds cooldown
    http_response_code(429);
    echo json_encode(['success' => false, 'message' => 'Please wait before submitting again']);
    exit();
}

// Database connection
$conn = new mysqli("localhost", "your_username", "your_password", "cybershield_pro");

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Honeypot check
    if (!empty($_POST['honeypot'])) {
        http_response_code(200);
        echo json_encode(['success' => true, 'message' => 'Subscribed successfully!']);
        exit();
    }
    
    $email = filter_var($_POST['email'] ?? '', FILTER_SANITIZE_EMAIL);
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid email address']);
        exit();
    }
    
    // Check if email already exists
    $check_stmt = $conn->prepare("SELECT id FROM newsletter_subscribers WHERE email = ? AND status = 'active'");
    $check_stmt->bind_param("s", $email);
    $check_stmt->execute();
    $check_stmt->store_result();
    
    if ($check_stmt->num_rows > 0) {
        echo json_encode(['success' => true, 'message' => 'You are already subscribed!']);
        $check_stmt->close();
        exit();
    }
    $check_stmt->close();
    
    // Generate verification token
    $token = bin2hex(random_bytes(32));
    $status = 'pending'; // Requires verification
    
    // Insert into database
    $stmt = $conn->prepare("INSERT INTO newsletter_subscribers (email, token, status, subscribed_at, ip_address) VALUES (?, ?, ?, NOW(), ?)");
    $ip_address = $_SERVER['REMOTE_ADDR'];
    $stmt->bind_param("ssss", $email, $token, $status, $ip_address);
    
    if ($stmt->execute()) {
        // Send verification email
        $verification_link = "https://cybershieldpro.com/verify.php?token=$token&email=" . urlencode($email);
        
        $subject = "Verify your subscription - CyberShield Pro";
        $message = "
        <html>
        <body style='font-family: Arial, sans-serif;'>
            <div style='max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;'>
                <div style='background: #0a0e17; color: #00f3ff; padding: 20px; text-align: center;'>
                    <h2>Verify Your Subscription</h2>
                </div>
                <div style='padding: 30px;'>
                    <p>Hello,</p>
                    <p>Thank you for subscribing to CyberShield Pro newsletter. Please click the button below to verify your email address:</p>
                    <div style='text-align: center; margin: 30px 0;'>
                        <a href='$verification_link' style='background: #00f3ff; color: #0a0e17; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;'>
                            Verify Email
                        </a>
                    </div>
                    <p>Or copy and paste this link in your browser:<br>
                    <code style='background: #e9ecef; padding: 5px 10px; border-radius: 3px;'>$verification_link</code></p>
                    <p>If you didn't request this subscription, please ignore this email.</p>
                    <hr>
                    <p style='font-size: 12px; color: #666;'>
                        This email was sent to $email<br>
                        CyberShield Pro • 123 Security Blvd, San Francisco, CA
                    </p>
                </div>
            </div>
        </body>
        </html>
        ";
        
        $headers = "MIME-Version: 1.0\r\n";
        $headers .= "Content-type:text/html;charset=UTF-8\r\n";
        $headers .= "From: newsletter@cybershieldpro.com\r\n";
        $headers .= "Reply-To: no-reply@cybershieldpro.com\r\n";
        
        mail($email, $subject, $message, $headers);
        
        $_SESSION['last_submission'] = $current_time;
        
        echo json_encode([
            'success' => true,
            'message' => 'Please check your email to verify your subscription!',
            'requires_verification' => true
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Subscription failed. Please try again.']);
    }
    
    $stmt->close();
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}

$conn->close();
?>