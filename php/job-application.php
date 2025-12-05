<?php
// job-application.php
session_start();
header('Content-Type: application/json');

// File upload configuration
$max_file_size = 5 * 1024 * 1024; // 5MB
$allowed_types = ['pdf', 'doc', 'docx'];
$upload_dir = '../uploads/resumes/';

// Create upload directory if not exists
if (!file_exists($upload_dir)) {
    mkdir($upload_dir, 0755, true);
}

// Security check
function sanitize_filename($filename) {
    $filename = preg_replace('/[^a-zA-Z0-9._-]/', '', $filename);
    $filename = time() . '_' . $filename;
    return $filename;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // CSRF protection
    if (!isset($_POST['csrf_token']) || $_POST['csrf_token'] !== $_SESSION['csrf_token']) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Security validation failed']);
        exit();
    }
    
    // Validate form data
    $required_fields = ['name', 'email', 'job_title', 'job_id'];
    foreach ($required_fields as $field) {
        if (empty($_POST[$field])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => "Please fill all required fields"]);
            exit();
        }
    }
    
    // Sanitize inputs
    $name = htmlspecialchars(trim($_POST['name']));
    $email = filter_var($_POST['email'], FILTER_SANITIZE_EMAIL);
    $phone = htmlspecialchars(trim($_POST['phone'] ?? ''));
    $job_title = htmlspecialchars(trim($_POST['job_title']));
    $job_id = (int)$_POST['job_id'];
    $linkedin = filter_var($_POST['linkedin'] ?? '', FILTER_SANITIZE_URL);
    $github = filter_var($_POST['github'] ?? '', FILTER_SANITIZE_URL);
    $cover_letter = htmlspecialchars(trim($_POST['cover_letter'] ?? ''));
    $source = htmlspecialchars(trim($_POST['source'] ?? ''));
    
    // Validate email
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid email address']);
        exit();
    }
    
    // Handle file upload
    if (!isset($_FILES['resume']) || $_FILES['resume']['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Please upload your resume']);
        exit();
    }
    
    $resume_file = $_FILES['resume'];
    
    // Check file size
    if ($resume_file['size'] > $max_file_size) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Resume must be less than 5MB']);
        exit();
    }
    
    // Check file type
    $file_ext = strtolower(pathinfo($resume_file['name'], PATHINFO_EXTENSION));
    if (!in_array($file_ext, $allowed_types)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Only PDF, DOC, and DOCX files are allowed']);
        exit();
    }
    
    // Generate safe filename
    $safe_filename = sanitize_filename($resume_file['name']);
    $upload_path = $upload_dir . $safe_filename;
    
    // Move uploaded file
    if (!move_uploaded_file($resume_file['tmp_name'], $upload_path)) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to upload resume']);
        exit();
    }
    
    // Database connection
    $conn = new mysqli("localhost", "your_username", "your_password", "cybershield_pro");
    
    if ($conn->connect_error) {
        // Delete uploaded file if DB fails
        unlink($upload_path);
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database connection failed']);
        exit();
    }
    
    // Save to database
    $stmt = $conn->prepare("INSERT INTO job_applications (job_id, job_title, name, email, phone, linkedin, github, cover_letter, resume_path, source, ip_address, user_agent, status, applied_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())");
    
    $ip_address = $_SERVER['REMOTE_ADDR'];
    $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';
    
    $stmt->bind_param("isssssssssss", $job_id, $job_title, $name, $email, $phone, $linkedin, $github, $cover_letter, $upload_path, $source, $ip_address, $user_agent);
    
    if ($stmt->execute()) {
        $application_id = $stmt->insert_id;
        
        // Send confirmation email to applicant
        $applicant_subject = "Application Received - CyberShield Pro";
        $applicant_message = "
        <html>
        <body style='font-family: Arial, sans-serif;'>
            <div style='max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;'>
                <div style='background: #0a0e17; color: #00f3ff; padding: 20px; text-align: center;'>
                    <h2>Application Received</h2>
                </div>
                <div style='padding: 30px;'>
                    <p>Dear $name,</p>
                    <p>Thank you for applying for the <strong>$job_title</strong> position at CyberShield Pro.</p>
                    <p>We have received your application and will review it carefully. Our hiring team will contact you if your qualifications match our requirements.</p>
                    <div style='background: #e9ecef; padding: 20px; border-radius: 5px; margin: 20px 0;'>
                        <p><strong>Application Details:</strong></p>
                        <p><strong>Position:</strong> $job_title</p>
                        <p><strong>Application ID:</strong> APP-$application_id</p>
                        <p><strong>Date Applied:</strong> " . date('F j, Y') . "</p>
                    </div>
                    <p>You can expect to hear back from us within 7-10 business days.</p>
                    <hr>
                    <p style='font-size: 12px; color: #666;'>
                        This is an automated message. Please do not reply to this email.<br>
                        CyberShield Pro Careers Team
                    </p>
                </div>
            </div>
        </body>
        </html>
        ";
        
        $headers = "MIME-Version: 1.0\r\n";
        $headers .= "Content-type:text/html;charset=UTF-8\r\n";
        $headers .= "From: careers@cybershieldpro.com\r\n";
        $headers .= "Reply-To: no-reply@cybershieldpro.com\r\n";
        
        mail($email, $applicant_subject, $applicant_message, $headers);
        
        // Send notification to HR
        $hr_subject = "New Job Application: $job_title";
        $hr_message = "
        <html>
        <body>
            <h2>New Job Application Received</h2>
            <p><strong>Position:</strong> $job_title (ID: $job_id)</p>
            <p><strong>Applicant:</strong> $name</p>
            <p><strong>Email:</strong> $email</p>
            <p><strong>Phone:</strong> $phone</p>
            <p><strong>Application ID:</strong> $application_id</p>
            <p><a href='https://cybershieldpro.com/admin/view-application.php?id=$application_id'>View Full Application</a></p>
        </body>
        </html>
        ";
        
        mail("hr@cybershieldpro.com", $hr_subject, $hr_message, $headers);
        
        echo json_encode([
            'success' => true,
            'message' => 'Application submitted successfully! Check your email for confirmation.',
            'application_id' => $application_id
        ]);
    } else {
        // Delete uploaded file if DB save fails
        unlink($upload_path);
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to save application']);
    }
    
    $stmt->close();
    $conn->close();
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}
?>