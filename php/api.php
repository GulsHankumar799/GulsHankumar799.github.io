<?php
// api.php - REST API Endpoint
session_start();
require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Get request method and endpoint
$method = $_SERVER['REQUEST_METHOD'];
$request_uri = $_SERVER['REQUEST_URI'];
$endpoint = str_replace('/api/', '', parse_url($request_uri, PHP_URL_PATH));

// API Key authentication (for external clients)
$api_key = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
$api_key = str_replace('Bearer ', '', $api_key);

// Validate API key for external requests
function validate_api_key($api_key) {
    if (empty($api_key)) {
        return false;
    }
    
    try {
        $conn = get_db_connection();
        $stmt = $conn->prepare("
            SELECT * FROM api_keys 
            WHERE key_value = ? AND status = 'active' 
            AND (expires_at IS NULL OR expires_at > NOW())
        ");
        $stmt->bind_param("s", $api_key);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            return false;
        }
        
        // Update last used timestamp
        $key_id = $result->fetch_assoc()['id'];
        $update_stmt = $conn->prepare("UPDATE api_keys SET last_used = NOW() WHERE id = ?");
        $update_stmt->bind_param("i", $key_id);
        $update_stmt->execute();
        
        $conn->close();
        return true;
    } catch (Exception $e) {
        return false;
    }
}

// Get request data
$input_data = json_decode(file_get_contents('php://input'), true);
if (empty($input_data)) {
    $input_data = $_POST;
}

// Get query parameters
$query_params = $_GET;

// Main API router
try {
    switch ($endpoint) {
        case 'jobs':
            handle_jobs_endpoint($method, $input_data, $query_params);
            break;
            
        case 'apply':
            if ($method === 'POST') {
                handle_job_application($input_data);
            } else {
                http_response_code(405);
                echo json_encode(['error' => 'Method not allowed']);
            }
            break;
            
        case 'contact':
            if ($method === 'POST') {
                handle_contact_form($input_data);
            } else {
                http_response_code(405);
                echo json_encode(['error' => 'Method not allowed']);
            }
            break;
            
        case 'newsletter':
            if ($method === 'POST') {
                handle_newsletter_subscription($input_data);
            } elseif ($method === 'DELETE') {
                handle_newsletter_unsubscription($query_params);
            } else {
                http_response_code(405);
                echo json_encode(['error' => 'Method not allowed']);
            }
            break;
            
        case 'blog/posts':
            handle_blog_posts($method, $input_data, $query_params);
            break;
            
        case 'blog/categories':
            handle_blog_categories($method, $query_params);
            break;
            
        case 'auth/login':
            if ($method === 'POST') {
                handle_login($input_data);
            } else {
                http_response_code(405);
                echo json_encode(['error' => 'Method not allowed']);
            }
            break;
            
        case 'auth/register':
            if ($method === 'POST') {
                handle_registration($input_data);
            } else {
                http_response_code(405);
                echo json_encode(['error' => 'Method not allowed']);
            }
            break;
            
        case 'user/profile':
            if ($method === 'GET') {
                handle_get_profile($query_params);
            } elseif ($method === 'PUT') {
                handle_update_profile($input_data);
            } else {
                http_response_code(405);
                echo json_encode(['error' => 'Method not allowed']);
            }
            break;
            
        case 'user/applications':
            handle_user_applications($method, $input_data, $query_params);
            break;
            
        default:
            http_response_code(404);
            echo json_encode(['error' => 'Endpoint not found']);
    }
} catch (Exception $e) {
    error_log("API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}

// Jobs endpoint handler
function handle_jobs_endpoint($method, $data, $params) {
    if ($method === 'GET') {
        // Get jobs with filtering and pagination
        $conn = get_db_connection();
        
        // Build query with filters
        $where_clauses = ["status = 'published'"];
        $query_params = [];
        $types = '';
        
        if (!empty($params['department'])) {
            $where_clauses[] = "department = ?";
            $query_params[] = $params['department'];
            $types .= 's';
        }
        
        if (!empty($params['type'])) {
            $where_clauses[] = "employment_type = ?";
            $query_params[] = $params['type'];
            $types .= 's';
        }
        
        if (!empty($params['location'])) {
            $where_clauses[] = "location LIKE ?";
            $query_params[] = '%' . $params['location'] . '%';
            $types .= 's';
        }
        
        if (!empty($params['search'])) {
            $where_clauses[] = "(title LIKE ? OR description LIKE ?)";
            $query_params[] = '%' . $params['search'] . '%';
            $query_params[] = '%' . $params['search'] . '%';
            $types .= 'ss';
        }
        
        $where_sql = implode(' AND ', $where_clauses);
        
        // Pagination
        $page = max(1, intval($params['page'] ?? 1));
        $limit = min(50, intval($params['limit'] ?? 10));
        $offset = ($page - 1) * $limit;
        
        // Get total count
        $count_sql = "SELECT COUNT(*) as total FROM job_postings WHERE $where_sql";
        $count_stmt = $conn->prepare($count_sql);
        
        if (!empty($query_params)) {
            $count_stmt->bind_param($types, ...$query_params);
        }
        
        $count_stmt->execute();
        $total_count = $count_stmt->get_result()->fetch_assoc()['total'];
        $count_stmt->close();
        
        // Get jobs
        $jobs_sql = "SELECT * FROM job_postings WHERE $where_sql ORDER BY published_at DESC LIMIT ? OFFSET ?";
        $query_params[] = $limit;
        $query_params[] = $offset;
        $types .= 'ii';
        
        $jobs_stmt = $conn->prepare($jobs_sql);
        $jobs_stmt->bind_param($types, ...$query_params);
        $jobs_stmt->execute();
        $jobs = $jobs_stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $jobs_stmt->close();
        
        $conn->close();
        
        // Increment views for each job
        foreach ($jobs as &$job) {
            $job['views']++;
        }
        
        echo json_encode([
            'success' => true,
            'data' => $jobs,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total_count,
                'pages' => ceil($total_count / $limit)
            ]
        ]);
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
}

// Blog posts handler
function handle_blog_posts($method, $data, $params) {
    if ($method === 'GET') {
        $conn = get_db_connection();
        
        // Build query
        $where_clauses = ["status = 'published'"];
        $query_params = [];
        $types = '';
        
        if (!empty($params['category'])) {
            $where_clauses[] = "category = ?";
            $query_params[] = $params['category'];
            $types .= 's';
        }
        
        if (!empty($params['author'])) {
            $where_clauses[] = "author_id = ?";
            $query_params[] = $params['author'];
            $types .= 'i';
        }
        
        if (!empty($params['search'])) {
            $where_clauses[] = "(title LIKE ? OR content LIKE ? OR excerpt LIKE ?)";
            $query_params[] = '%' . $params['search'] . '%';
            $query_params[] = '%' . $params['search'] . '%';
            $query_params[] = '%' . $params['search'] . '%';
            $types .= 'sss';
        }
        
        $where_sql = implode(' AND ', $where_clauses);
        
        // Pagination
        $page = max(1, intval($params['page'] ?? 1));
        $limit = min(50, intval($params['limit'] ?? 10));
        $offset = ($page - 1) * $limit;
        
        // Get total count
        $count_sql = "SELECT COUNT(*) as total FROM blog_posts WHERE $where_sql";
        $count_stmt = $conn->prepare($count_sql);
        
        if (!empty($query_params)) {
            $count_stmt->bind_param($types, ...$query_params);
        }
        
        $count_stmt->execute();
        $total_count = $count_stmt->get_result()->fetch_assoc()['total'];
        $count_stmt->close();
        
        // Get posts
        $posts_sql = "SELECT * FROM blog_posts WHERE $where_sql ORDER BY published_at DESC LIMIT ? OFFSET ?";
        $query_params[] = $limit;
        $query_params[] = $offset;
        $types .= 'ii';
        
        $posts_stmt = $conn->prepare($posts_sql);
        $posts_stmt->bind_param($types, ...$query_params);
        $posts_stmt->execute();
        $posts = $posts_stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $posts_stmt->close();
        
        // Get categories for each post
        foreach ($posts as &$post) {
            $cat_stmt = $conn->prepare("
                SELECT c.name, c.slug 
                FROM blog_post_categories pc 
                JOIN blog_categories c ON pc.category_id = c.id 
                WHERE pc.post_id = ?
            ");
            $cat_stmt->bind_param("i", $post['id']);
            $cat_stmt->execute();
            $post['categories'] = $cat_stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            $cat_stmt->close();
        }
        
        $conn->close();
        
        echo json_encode([
            'success' => true,
            'data' => $posts,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total_count,
                'pages' => ceil($total_count / $limit)
            ]
        ]);
    } elseif ($method === 'POST' && validate_api_key($GLOBALS['api_key'])) {
        // Create new blog post (requires API key)
        $title = sanitize_input($data['title'] ?? '');
        $content = sanitize_input($data['content'] ?? '');
        $excerpt = sanitize_input($data['excerpt'] ?? '');
        $author_id = intval($data['author_id'] ?? 0);
        
        if (empty($title) || empty($content) || empty($author_id)) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing required fields']);
            return;
        }
        
        $conn = get_db_connection();
        $stmt = $conn->prepare("
            INSERT INTO blog_posts (title, content, excerpt, author_id, status, created_at) 
            VALUES (?, ?, ?, ?, 'draft', NOW())
        ");
        $stmt->bind_param("sssi", $title, $content, $excerpt, $author_id);
        
        if ($stmt->execute()) {
            $post_id = $stmt->insert_id;
            
            // Add categories if provided
            if (!empty($data['categories']) && is_array($data['categories'])) {
                foreach ($data['categories'] as $category_id) {
                    $cat_stmt = $conn->prepare("
                        INSERT INTO blog_post_categories (post_id, category_id) 
                        VALUES (?, ?)
                    ");
                    $cat_stmt->bind_param("ii", $post_id, $category_id);
                    $cat_stmt->execute();
                    $cat_stmt->close();
                }
            }
            
            echo json_encode([
                'success' => true,
                'message' => 'Blog post created successfully',
                'post_id' => $post_id
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create blog post']);
        }
        
        $stmt->close();
        $conn->close();
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
}

// User applications handler
function handle_user_applications($method, $data, $params) {
    // Check authentication
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Authentication required']);
        return;
    }
    
    $user_id = $_SESSION['user_id'];
    $user_email = $_SESSION['email'];
    
    if ($method === 'GET') {
        $conn = get_db_connection();
        
        // Get user's applications
        $page = max(1, intval($params['page'] ?? 1));
        $limit = min(50, intval($params['limit'] ?? 10));
        $offset = ($page - 1) * $limit;
        
        // Get total count
        $count_stmt = $conn->prepare("
            SELECT COUNT(*) as total 
            FROM job_applications 
            WHERE email = ?
        ");
        $count_stmt->bind_param("s", $user_email);
        $count_stmt->execute();
        $total_count = $count_stmt->get_result()->fetch_assoc()['total'];
        $count_stmt->close();
        
        // Get applications
        $stmt = $conn->prepare("
            SELECT ja.*, jp.title as job_title, jp.department, jp.location 
            FROM job_applications ja 
            LEFT JOIN job_postings jp ON ja.job_id = jp.id 
            WHERE ja.email = ? 
            ORDER BY ja.applied_at DESC 
            LIMIT ? OFFSET ?
        ");
        $stmt->bind_param("sii", $user_email, $limit, $offset);
        $stmt->execute();
        $applications = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $stmt->close();
        
        $conn->close();
        
        echo json_encode([
            'success' => true,
            'data' => $applications,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total_count,
                'pages' => ceil($total_count / $limit)
            ]
        ]);
    } elseif ($method === 'POST') {
        // Submit new application
        handle_job_application($data);
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
}

// Login handler
function handle_login($data) {
    // This would use the login.php logic
    // For API, we return a JWT token
    $email = sanitize_input($data['email'] ?? '');
    $password = $data['password'] ?? '';
    
    if (empty($email) || empty($password)) {
        http_response_code(400);
        echo json_encode(['error' => 'Email and password required']);
        return;
    }
    
    try {
        $conn = get_db_connection();
        $stmt = $conn->prepare("
            SELECT id, username, email, password_hash, role, status 
            FROM users 
            WHERE email = ? AND status = 'active'
        ");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            http_response_code(401);
            echo json_encode(['error' => 'Invalid credentials']);
            return;
        }
        
        $user = $result->fetch_assoc();
        
        if (!verify_password($password, $user['password_hash'])) {
            http_response_code(401);
            echo json_encode(['error' => 'Invalid credentials']);
            return;
        }
        
        // Generate JWT token
        $token = generate_jwt_token($user);
        
        echo json_encode([
            'success' => true,
            'message' => 'Login successful',
            'token' => $token,
            'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'email' => $user['email'],
                'role' => $user['role']
            ]
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Login failed']);
    }
}

// JWT Token generation
function generate_jwt_token($user) {
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $payload = json_encode([
        'user_id' => $user['id'],
        'username' => $user['username'],
        'email' => $user['email'],
        'role' => $user['role'],
        'iat' => time(),
        'exp' => time() + (7 * 24 * 60 * 60) // 7 days
    ]);
    
    $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
    $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
    
    $signature = hash_hmac('sha256', "$base64UrlHeader.$base64UrlPayload", 'your-secret-key', true);
    $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
    
    return "$base64UrlHeader.$base64UrlPayload.$base64UrlSignature";
}

// Rate limiting for API
function api_rate_limit($key, $limit = 100, $window = 3600) {
    $ip = $_SERVER['REMOTE_ADDR'];
    $api_key = $GLOBALS['api_key'] ?? '';
    $rate_key = "api_rate_${key}_" . ($api_key ?: $ip);
    
    return check_rate_limit($rate_key, $limit, $window);
}
?>