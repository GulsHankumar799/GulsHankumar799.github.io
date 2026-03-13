<?php
// dashboard.php
session_start();
require_once '../config.php';

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    header('Location: auth/login.php');
    exit();
}

// Get user information
$user_id = $_SESSION['user_id'];
$username = $_SESSION['username'];
$email = $_SESSION['email'];
$role = $_SESSION['role'];
$full_name = $_SESSION['full_name'];

// Get dashboard data
try {
    $conn = get_db_connection();
    
    // Get user stats
    $stats = [];
    
    // Get total applications (if applicable)
    if ($role === 'user') {
        $stmt = $conn->prepare("
            SELECT COUNT(*) as total, 
                   SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                   SUM(CASE WHEN status = 'reviewed' THEN 1 ELSE 0 END) as reviewed,
                   SUM(CASE WHEN status = 'shortlisted' THEN 1 ELSE 0 END) as shortlisted
            FROM job_applications 
            WHERE email = ?
        ");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $stats['applications'] = $stmt->get_result()->fetch_assoc();
        $stmt->close();
    }
    
    // Get recent activity
    $stmt = $conn->prepare("
        SELECT action, details, created_at 
        FROM activity_logs 
        WHERE user_id = ? 
        ORDER BY created_at DESC 
        LIMIT 10
    ");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $recent_activity = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();
    
    // Get notifications
    $stmt = $conn->prepare("
        SELECT id, title, message, type, is_read, created_at 
        FROM notifications 
        WHERE user_id = ? AND (expires_at IS NULL OR expires_at > NOW())
        ORDER BY created_at DESC 
        LIMIT 20
    ");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $notifications = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();
    
    // Mark unread notifications count
    $unread_count = 0;
    foreach ($notifications as $notification) {
        if (!$notification['is_read']) {
            $unread_count++;
        }
    }
    
    $conn->close();
    
} catch (Exception $e) {
    error_log("Dashboard error: " . $e->getMessage());
    $stats = [];
    $recent_activity = [];
    $notifications = [];
    $unread_count = 0;
}

// Set page title
$page_title = "Dashboard - CyberShield Pro";
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $page_title; ?></title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">
    <style>
        /* Google-inspired Dashboard Design */
        :root {
            --google-blue: #1a73e8;
            --google-blue-dark: #1b66c9;
            --google-gray-50: #f8f9fa;
            --google-gray-100: #f1f3f4;
            --google-gray-200: #e8eaed;
            --google-gray-400: #dadce0;
            --google-gray-600: #5f6368;
            --google-gray-700: #3c4043;
            --google-gray-800: #202124;
            --google-red: #d93025;
            --google-green: #188038;
            --google-yellow: #f9ab00;
            --sidebar-width: 260px;
            --header-height: 64px;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Roboto', Arial, sans-serif;
            background: var(--google-gray-50);
            color: var(--google-gray-800);
            min-height: 100vh;
        }

        /* Dashboard Layout */
        .dashboard {
            display: flex;
            min-height: 100vh;
        }

        /* Sidebar - Google Style */
        .sidebar {
            width: var(--sidebar-width);
            background: white;
            border-right: 1px solid var(--google-gray-200);
            position: fixed;
            height: 100vh;
            overflow-y: auto;
            transition: all 0.3s ease;
        }

        .sidebar-header {
            padding: 24px 24px 16px;
            border-bottom: 1px solid var(--google-gray-200);
        }

        .sidebar-header .logo {
            display: flex;
            align-items: center;
            gap: 8px;
            text-decoration: none;
            margin-bottom: 20px;
        }

        .sidebar-header .logo i {
            color: var(--google-blue);
            font-size: 28px;
        }

        .sidebar-header .logo span {
            font-family: 'Google Sans', sans-serif;
            font-size: 22px;
            font-weight: 500;
            color: var(--google-gray-800);
        }

        .sidebar-header .logo .logo-highlight {
            color: var(--google-blue);
        }

        /* User Info Card */
        .user-info {
            text-align: center;
            padding: 16px 0;
        }

        .user-avatar {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, var(--google-blue), #34a853);
            border-radius: 50%;
            margin: 0 auto 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Google Sans', sans-serif;
            font-size: 32px;
            font-weight: 500;
            color: white;
            box-shadow: 0 2px 10px rgba(26,115,232,0.3);
        }

        .user-info h3 {
            font-family: 'Google Sans', sans-serif;
            font-size: 16px;
            font-weight: 500;
            color: var(--google-gray-800);
            margin-bottom: 4px;
        }

        .user-info .user-email {
            font-size: 14px;
            color: var(--google-gray-600);
            margin-bottom: 12px;
        }

        .user-badge {
            display: inline-block;
            padding: 4px 12px;
            background: var(--google-gray-50);
            border: 1px solid var(--google-gray-200);
            border-radius: 16px;
            font-size: 12px;
            font-weight: 500;
            color: var(--google-blue);
            text-transform: uppercase;
        }

        /* Navigation */
        .sidebar-nav {
            padding: 16px 8px;
        }

        .nav-section {
            margin-bottom: 24px;
        }

        .nav-section-title {
            padding: 8px 16px;
            font-size: 11px;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--google-gray-600);
        }

        .nav-item {
            list-style: none;
        }

        .nav-item a {
            display: flex;
            align-items: center;
            padding: 10px 16px;
            margin: 2px 0;
            color: var(--google-gray-700);
            text-decoration: none;
            font-size: 14px;
            font-weight: 500;
            border-radius: 24px;
            transition: all 0.2s;
        }

        .nav-item a i {
            width: 24px;
            font-size: 18px;
            color: var(--google-gray-600);
            margin-right: 12px;
        }

        .nav-item a:hover {
            background: var(--google-gray-50);
            color: var(--google-gray-800);
        }

        .nav-item a:hover i {
            color: var(--google-blue);
        }

        .nav-item a.active {
            background: #e8f0fe;
            color: var(--google-blue);
        }

        .nav-item a.active i {
            color: var(--google-blue);
        }

        .nav-item.logout {
            margin-top: 32px;
            border-top: 1px solid var(--google-gray-200);
            padding-top: 16px;
        }

        .nav-item.logout a {
            color: var(--google-red);
        }

        .nav-item.logout a i {
            color: var(--google-red);
        }

        /* Main Content */
        .main-content {
            flex: 1;
            margin-left: var(--sidebar-width);
            padding: 24px 32px;
        }

        /* Header */
        .dashboard-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 32px;
        }

        .header-left h1 {
            font-family: 'Google Sans', sans-serif;
            font-size: 28px;
            font-weight: 400;
            color: var(--google-gray-800);
            margin-bottom: 4px;
        }

        .header-left .welcome-text {
            font-size: 14px;
            color: var(--google-gray-600);
        }

        .header-right {
            display: flex;
            align-items: center;
            gap: 16px;
        }

        /* Notification Bell */
        .notification-btn {
            position: relative;
            width: 40px;
            height: 40px;
            border: none;
            background: var(--google-gray-50);
            border-radius: 50%;
            cursor: pointer;
            transition: background 0.2s;
        }

        .notification-btn:hover {
            background: var(--google-gray-100);
        }

        .notification-btn i {
            font-size: 20px;
            color: var(--google-gray-700);
        }

        .notification-badge {
            position: absolute;
            top: -4px;
            right: -4px;
            background: var(--google-red);
            color: white;
            font-size: 11px;
            font-weight: 500;
            min-width: 18px;
            height: 18px;
            border-radius: 9px;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0 5px;
            border: 2px solid white;
        }

        /* Search Bar (optional) */
        .search-bar {
            display: flex;
            align-items: center;
            background: var(--google-gray-50);
            border-radius: 24px;
            padding: 8px 16px;
            width: 240px;
        }

        .search-bar i {
            color: var(--google-gray-600);
            font-size: 18px;
            margin-right: 8px;
        }

        .search-bar input {
            border: none;
            background: none;
            outline: none;
            font-size: 14px;
            width: 100%;
        }

        /* Stats Grid */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            gap: 20px;
            margin-bottom: 32px;
        }

        .stat-card {
            background: white;
            border: 1px solid var(--google-gray-200);
            border-radius: 12px;
            padding: 20px;
            transition: border-color 0.2s, box-shadow 0.2s;
        }

        .stat-card:hover {
            border-color: var(--google-blue);
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }

        .stat-icon {
            width: 48px;
            height: 48px;
            background: #e8f0fe;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 16px;
        }

        .stat-icon i {
            font-size: 24px;
            color: var(--google-blue);
        }

        .stat-label {
            font-size: 14px;
            color: var(--google-gray-600);
            margin-bottom: 8px;
        }

        .stat-value {
            font-family: 'Google Sans', sans-serif;
            font-size: 32px;
            font-weight: 400;
            color: var(--google-gray-800);
            margin-bottom: 4px;
        }

        .stat-desc {
            font-size: 13px;
            color: var(--google-gray-600);
        }

        /* Two Column Layout */
        .dashboard-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
        }

        /* Cards */
        .dashboard-card {
            background: white;
            border: 1px solid var(--google-gray-200);
            border-radius: 12px;
            overflow: hidden;
        }

        .card-header {
            padding: 20px 24px;
            border-bottom: 1px solid var(--google-gray-200);
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .card-header h2 {
            font-family: 'Google Sans', sans-serif;
            font-size: 18px;
            font-weight: 500;
            color: var(--google-gray-800);
        }

        .card-header a {
            color: var(--google-blue);
            text-decoration: none;
            font-size: 14px;
            font-weight: 500;
        }

        .card-header a:hover {
            text-decoration: underline;
        }

        .card-body {
            padding: 8px 0;
        }

        /* Activity List */
        .activity-item {
            display: flex;
            align-items: flex-start;
            padding: 16px 24px;
            border-bottom: 1px solid var(--google-gray-200);
        }

        .activity-item:last-child {
            border-bottom: none;
        }

        .activity-icon {
            width: 36px;
            height: 36px;
            background: var(--google-gray-50);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 16px;
        }

        .activity-icon i {
            font-size: 16px;
            color: var(--google-blue);
        }

        .activity-content {
            flex: 1;
        }

        .activity-title {
            font-size: 14px;
            font-weight: 500;
            color: var(--google-gray-800);
            margin-bottom: 4px;
        }

        .activity-desc {
            font-size: 13px;
            color: var(--google-gray-600);
            margin-bottom: 4px;
        }

        .activity-time {
            font-size: 12px;
            color: var(--google-gray-600);
        }

        /* Notification Item */
        .notification-item {
            display: flex;
            align-items: flex-start;
            padding: 16px 24px;
            border-bottom: 1px solid var(--google-gray-200);
            cursor: pointer;
            transition: background 0.2s;
        }

        .notification-item:hover {
            background: var(--google-gray-50);
        }

        .notification-item.unread {
            background: #e8f0fe;
        }

        .notification-icon {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 16px;
        }

        .notification-icon.success {
            background: #e6f4ea;
            color: var(--google-green);
        }

        .notification-icon.warning {
            background: #fef7e0;
            color: var(--google-yellow);
        }

        .notification-icon.error {
            background: #fce8e8;
            color: var(--google-red);
        }

        .notification-icon.info {
            background: #e8f0fe;
            color: var(--google-blue);
        }

        .notification-content {
            flex: 1;
        }

        .notification-title {
            font-size: 14px;
            font-weight: 500;
            color: var(--google-gray-800);
            margin-bottom: 4px;
        }

        .notification-message {
            font-size: 13px;
            color: var(--google-gray-600);
            margin-bottom: 4px;
        }

        .notification-time {
            font-size: 12px;
            color: var(--google-gray-600);
        }

        .notification-badge-new {
            display: inline-block;
            padding: 2px 8px;
            background: var(--google-blue);
            color: white;
            font-size: 11px;
            font-weight: 500;
            border-radius: 12px;
            margin-left: 8px;
        }

        /* Empty State */
        .empty-state {
            text-align: center;
            padding: 48px 24px;
        }

        .empty-state i {
            font-size: 48px;
            color: var(--google-gray-200);
            margin-bottom: 16px;
        }

        .empty-state p {
            color: var(--google-gray-600);
            font-size: 14px;
        }

        /* Notifications Panel */
        .notifications-panel {
            position: fixed;
            top: 80px;
            right: 32px;
            width: 360px;
            max-height: 480px;
            background: white;
            border: 1px solid var(--google-gray-200);
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            z-index: 1000;
            display: none;
            overflow: hidden;
        }

        .notifications-panel.show {
            display: block;
        }

        .panel-header {
            padding: 16px 20px;
            border-bottom: 1px solid var(--google-gray-200);
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .panel-header h3 {
            font-family: 'Google Sans', sans-serif;
            font-size: 16px;
            font-weight: 500;
            color: var(--google-gray-800);
        }

        .panel-header button {
            background: none;
            border: none;
            color: var(--google-gray-600);
            cursor: pointer;
            font-size: 18px;
        }

        .panel-body {
            max-height: 400px;
            overflow-y: auto;
        }

        /* Responsive */
        @media (max-width: 768px) {
            .sidebar {
                transform: translateX(-100%);
                z-index: 1000;
            }

            .sidebar.open {
                transform: translateX(0);
            }

            .main-content {
                margin-left: 0;
                padding: 16px;
            }

            .dashboard-grid {
                grid-template-columns: 1fr;
            }

            .stats-grid {
                grid-template-columns: 1fr;
            }

            .notifications-panel {
                width: calc(100% - 32px);
                right: 16px;
                left: 16px;
            }
        }
    </style>
</head>
<body>
    <div class="dashboard">
        <!-- Sidebar -->
        <div class="sidebar" id="sidebar">
            <div class="sidebar-header">
                <a href="../index.php" class="logo">
                    <i class="fas fa-shield-alt"></i>
                    <span>CyberShield<span class="logo-highlight">Pro</span></span>
                </a>
                
                <div class="user-info">
                    <div class="user-avatar">
                        <?php echo strtoupper(substr($full_name, 0, 1)); ?>
                    </div>
                    <h3><?php echo htmlspecialchars($full_name); ?></h3>
                    <div class="user-email"><?php echo htmlspecialchars($email); ?></div>
                    <span class="user-badge"><?php echo ucfirst($role); ?></span>
                </div>
            </div>

            <ul class="sidebar-nav">
                <li class="nav-section">
                    <div class="nav-section-title">Main</div>
                    <ul>
                        <li class="nav-item">
                            <a href="#" class="active">
                                <i class="fas fa-home"></i>
                                Dashboard
                            </a>
                        </li>
                        <li class="nav-item">
                            <a href="profile.php">
                                <i class="fas fa-user"></i>
                                Profile
                            </a>
                        </li>
                        <li class="nav-item">
                            <a href="settings.php">
                                <i class="fas fa-cog"></i>
                                Settings
                            </a>
                        </li>
                    </ul>
                </li>

                <?php if ($role === 'user'): ?>
                <li class="nav-section">
                    <div class="nav-section-title">Applications</div>
                    <ul>
                        <li class="nav-item">
                            <a href="my-applications.php">
                                <i class="fas fa-briefcase"></i>
                                My Applications
                            </a>
                        </li>
                        <li class="nav-item">
                            <a href="apply-job.php">
                                <i class="fas fa-plus-circle"></i>
                                Apply for Job
                            </a>
                        </li>
                    </ul>
                </li>
                <?php endif; ?>

                <?php if ($role === 'admin' || $role === 'manager'): ?>
                <li class="nav-section">
                    <div class="nav-section-title">Management</div>
                    <ul>
                        <li class="nav-item">
                            <a href="manage-applications.php">
                                <i class="fas fa-tasks"></i>
                                Manage Applications
                            </a>
                        </li>
                        <li class="nav-item">
                            <a href="post-job.php">
                                <i class="fas fa-edit"></i>
                                Post New Job
                            </a>
                        </li>
                    </ul>
                </li>
                <?php endif; ?>

                <?php if ($role === 'admin'): ?>
                <li class="nav-section">
                    <div class="nav-section-title">Admin</div>
                    <ul>
                        <li class="nav-item">
                            <a href="admin/users.php">
                                <i class="fas fa-users"></i>
                                User Management
                            </a>
                        </li>
                        <li class="nav-item">
                            <a href="admin/reports.php">
                                <i class="fas fa-chart-bar"></i>
                                Reports
                            </a>
                        </li>
                    </ul>
                </li>
                <?php endif; ?>

                <li class="nav-item logout">
                    <a href="logout.php">
                        <i class="fas fa-sign-out-alt"></i>
                        Sign out
                    </a>
                </li>
            </ul>
        </div>

        <!-- Main Content -->
        <div class="main-content">
            <!-- Header -->
            <div class="dashboard-header">
                <div class="header-left">
                    <h1>Welcome back, <?php echo htmlspecialchars(explode(' ', $full_name)[0]); ?>!</h1>
                    <div class="welcome-text">Here's what's happening with your account today.</div>
                </div>
                
                <div class="header-right">
                    <!-- Search (optional) -->
                    <div class="search-bar">
                        <i class="fas fa-search"></i>
                        <input type="text" placeholder="Search...">
                    </div>
                    
                    <!-- Notifications -->
                    <button class="notification-btn" onclick="toggleNotifications()">
                        <i class="fas fa-bell"></i>
                        <?php if ($unread_count > 0): ?>
                        <span class="notification-badge"><?php echo $unread_count; ?></span>
                        <?php endif; ?>
                    </button>
                </div>
            </div>

            <!-- Stats Grid -->
            <?php if ($role === 'user' && isset($stats['applications'])): ?>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-paper-plane"></i>
                    </div>
                    <div class="stat-label">Total Applications</div>
                    <div class="stat-value"><?php echo $stats['applications']['total'] ?? 0; ?></div>
                    <div class="stat-desc">All time applications</div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-clock"></i>
                    </div>
                    <div class="stat-label">Pending Review</div>
                    <div class="stat-value"><?php echo $stats['applications']['pending'] ?? 0; ?></div>
                    <div class="stat-desc">Awaiting review</div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-eye"></i>
                    </div>
                    <div class="stat-label">Reviewed</div>
                    <div class="stat-value"><?php echo $stats['applications']['reviewed'] ?? 0; ?></div>
                    <div class="stat-desc">Under review</div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-star"></i>
                    </div>
                    <div class="stat-label">Shortlisted</div>
                    <div class="stat-value"><?php echo $stats['applications']['shortlisted'] ?? 0; ?></div>
                    <div class="stat-desc">Shortlisted for next round</div>
                </div>
            </div>
            <?php endif; ?>

            <!-- Dashboard Grid -->
            <div class="dashboard-grid">
                <!-- Recent Activity -->
                <div class="dashboard-card">
                    <div class="card-header">
                        <h2>Recent activity</h2>
                        <a href="activity.php">View all</a>
                    </div>
                    <div class="card-body">
                        <?php if (!empty($recent_activity)): ?>
                            <?php foreach ($recent_activity as $activity): ?>
                            <div class="activity-item">
                                <div class="activity-icon">
                                    <i class="fas fa-history"></i>
                                </div>
                                <div class="activity-content">
                                    <div class="activity-title">
                                        <?php echo htmlspecialchars($activity['action']); ?>
                                    </div>
                                    <div class="activity-desc">
                                        <?php echo htmlspecialchars($activity['details']); ?>
                                    </div>
                                    <div class="activity-time">
                                        <?php echo date('M j, Y g:i A', strtotime($activity['created_at'])); ?>
                                    </div>
                                </div>
                            </div>
                            <?php endforeach; ?>
                        <?php else: ?>
                            <div class="empty-state">
                                <i class="fas fa-history"></i>
                                <p>No recent activity</p>
                            </div>
                        <?php endif; ?>
                    </div>
                </div>

                <!-- Notifications -->
                <div class="dashboard-card">
                    <div class="card-header">
                        <h2>Notifications</h2>
                        <a href="notifications.php">View all</a>
                    </div>
                    <div class="card-body">
                        <?php if (!empty($notifications)): ?>
                            <?php foreach (array_slice($notifications, 0, 5) as $notification): ?>
                            <div class="notification-item <?php echo $notification['is_read'] ? '' : 'unread'; ?>" 
                                 onclick="markAsRead(<?php echo $notification['id']; ?>)">
                                <div class="notification-icon <?php echo $notification['type']; ?>">
                                    <i class="fas fa-<?php 
                                        echo $notification['type'] === 'success' ? 'check-circle' : 
                                            ($notification['type'] === 'warning' ? 'exclamation-circle' : 
                                            ($notification['type'] === 'error' ? 'times-circle' : 'info-circle')); 
                                    ?>"></i>
                                </div>
                                <div class="notification-content">
                                    <div class="notification-title">
                                        <?php echo htmlspecialchars($notification['title']); ?>
                                        <?php if (!$notification['is_read']): ?>
                                        <span class="notification-badge-new">New</span>
                                        <?php endif; ?>
                                    </div>
                                    <div class="notification-message">
                                        <?php echo htmlspecialchars($notification['message']); ?>
                                    </div>
                                    <div class="notification-time">
                                        <?php echo date('M j, Y g:i A', strtotime($notification['created_at'])); ?>
                                    </div>
                                </div>
                            </div>
                            <?php endforeach; ?>
                        <?php else: ?>
                            <div class="empty-state">
                                <i class="fas fa-bell"></i>
                                <p>No notifications</p>
                            </div>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Notifications Panel -->
    <div class="notifications-panel" id="notificationsPanel">
        <div class="panel-header">
            <h3>Notifications</h3>
            <button onclick="toggleNotifications()"><i class="fas fa-times"></i></button>
        </div>
        <div class="panel-body">
            <?php if (!empty($notifications)): ?>
                <?php foreach ($notifications as $notification): ?>
                <div class="notification-item <?php echo $notification['is_read'] ? '' : 'unread'; ?>">
                    <div class="notification-icon <?php echo $notification['type']; ?>">
                        <i class="fas fa-<?php 
                            echo $notification['type'] === 'success' ? 'check-circle' : 
                                ($notification['type'] === 'warning' ? 'exclamation-circle' : 
                                ($notification['type'] === 'error' ? 'times-circle' : 'info-circle')); 
                        ?>"></i>
                    </div>
                    <div class="notification-content">
                        <div class="notification-title">
                            <?php echo htmlspecialchars($notification['title']); ?>
                        </div>
                        <div class="notification-message">
                            <?php echo htmlspecialchars($notification['message']); ?>
                        </div>
                        <div class="notification-time">
                            <?php echo date('M j, Y g:i A', strtotime($notification['created_at'])); ?>
                        </div>
                    </div>
                </div>
                <?php endforeach; ?>
            <?php else: ?>
                <div class="empty-state" style="padding: 32px 24px;">
                    <i class="fas fa-bell"></i>
                    <p>No notifications</p>
                </div>
            <?php endif; ?>
        </div>
    </div>

    <script>
        // Toggle notifications panel
        function toggleNotifications() {
            const panel = document.getElementById('notificationsPanel');
            panel.classList.toggle('show');
            
            if (panel.classList.contains('show')) {
                markAllAsRead();
            }
        }

        // Mark notification as read
        function markAsRead(notificationId) {
            const notification = document.querySelector(`[onclick="markAsRead(${notificationId})"]`);
            if (notification) {
                notification.classList.remove('unread');
                
                // Update badge count
                const badge = document.querySelector('.notification-badge');
                if (badge) {
                    const count = parseInt(badge.textContent) - 1;
                    if (count > 0) {
                        badge.textContent = count;
                    } else {
                        badge.remove();
                    }
                }
                
                // Send AJAX request
                fetch('mark-notification-read.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ notification_id: notificationId })
                });
            }
        }

        // Mark all as read
        function markAllAsRead() {
            const unreadItems = document.querySelectorAll('.notification-item.unread');
            const notificationIds = [];
            
            unreadItems.forEach(item => {
                notificationIds.push(item.dataset.notificationId);
                item.classList.remove('unread');
            });
            
            if (notificationIds.length > 0) {
                // Remove badge
                const badge = document.querySelector('.notification-badge');
                if (badge) badge.remove();
                
                // Send AJAX request
                fetch('mark-all-read.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ notification_ids: notificationIds })
                });
            }
        }

        // Close panel when clicking outside
        document.addEventListener('click', function(event) {
            const panel = document.getElementById('notificationsPanel');
            const bellBtn = document.querySelector('.notification-btn');
            
            if (panel.classList.contains('show') && 
                !panel.contains(event.target) && 
                !bellBtn.contains(event.target)) {
                panel.classList.remove('show');
            }
        });

        // Mobile sidebar toggle (optional)
        function toggleSidebar() {
            const sidebar = document.getElementById('sidebar');
            sidebar.classList.toggle('open');
        }

        // Check for URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('welcome') === 'true') {
            // Show welcome message
            const welcomeDiv = document.createElement('div');
            welcomeDiv.className = 'notification-item success';
            welcomeDiv.innerHTML = `
                <div class="notification-icon success">
                    <i class="fas fa-check-circle"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-title">Welcome back!</div>
                    <div class="notification-message">You have successfully logged in.</div>
                </div>
            `;
            document.querySelector('.dashboard-grid').prepend(welcomeDiv);
            
            // Auto hide after 5 seconds
            setTimeout(() => welcomeDiv.remove(), 5000);
        }
    </script>
</body>
</html>