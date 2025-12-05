<?php
// dashboard.php
session_start();
require_once 'config.php';

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    header('Location: /login.html');
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
    <style>
        :root {
            --primary-cyan: #00f3ff;
            --primary-pink: #ff2a6d;
            --dark-bg: #0a0e17;
            --card-bg: rgba(26, 29, 41, 0.9);
            --light-text: #ffffff;
            --gray-text: rgba(255, 255, 255, 0.7);
        }
        
        body {
            font-family: 'Poppins', sans-serif;
            background: var(--dark-bg);
            color: var(--light-text);
            margin: 0;
            padding: 0;
        }
        
        .dashboard-container {
            display: flex;
            min-height: 100vh;
        }
        
        .sidebar {
            width: 250px;
            background: var(--card-bg);
            padding: 20px;
            border-right: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .sidebar-header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .user-avatar {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, var(--primary-cyan), var(--primary-pink));
            border-radius: 50%;
            margin: 0 auto 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2rem;
            font-weight: bold;
        }
        
        .sidebar-nav {
            list-style: none;
            padding: 0;
        }
        
        .sidebar-nav li {
            margin-bottom: 10px;
        }
        
        .sidebar-nav a {
            display: flex;
            align-items: center;
            padding: 12px 15px;
            color: var(--gray-text);
            text-decoration: none;
            border-radius: 8px;
            transition: all 0.3s;
        }
        
        .sidebar-nav a:hover,
        .sidebar-nav a.active {
            background: rgba(0, 243, 255, 0.1);
            color: var(--primary-cyan);
        }
        
        .sidebar-nav i {
            margin-right: 10px;
            width: 20px;
        }
        
        .main-content {
            flex: 1;
            padding: 30px;
            overflow-y: auto;
        }
        
        .dashboard-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        
        .stat-card {
            background: var(--card-bg);
            border-radius: 12px;
            padding: 25px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            transition: all 0.3s;
        }
        
        .stat-card:hover {
            border-color: var(--primary-cyan);
            transform: translateY(-5px);
        }
        
        .stat-icon {
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, var(--primary-cyan), var(--primary-pink));
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 15px;
        }
        
        .stat-value {
            font-size: 2rem;
            font-weight: bold;
            margin: 10px 0;
            background: linear-gradient(135deg, var(--primary-cyan), var(--primary-pink));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .activity-section,
        .notifications-section {
            background: var(--card-bg);
            border-radius: 12px;
            padding: 25px;
            margin-bottom: 30px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .section-title {
            font-size: 1.5rem;
            margin-bottom: 20px;
            color: var(--primary-cyan);
        }
        
        .activity-item,
        .notification-item {
            padding: 15px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            align-items: center;
        }
        
        .activity-item:last-child,
        .notification-item:last-child {
            border-bottom: none;
        }
        
        .notification-item.unread {
            background: rgba(0, 243, 255, 0.05);
        }
        
        .notification-badge {
            background: var(--primary-pink);
            color: white;
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 0.8rem;
            margin-left: 10px;
        }
        
        .logout-btn {
            background: rgba(255, 42, 109, 0.1);
            color: var(--primary-pink);
            border: 1px solid rgba(255, 42, 109, 0.3);
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .logout-btn:hover {
            background: rgba(255, 42, 109, 0.2);
        }
        
        @media (max-width: 768px) {
            .dashboard-container {
                flex-direction: column;
            }
            
            .sidebar {
                width: 100%;
                order: 2;
            }
            
            .stats-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="dashboard-container">
        <!-- Sidebar -->
        <div class="sidebar">
            <div class="sidebar-header">
                <div class="user-avatar">
                    <?php echo strtoupper(substr($full_name, 0, 1)); ?>
                </div>
                <h3><?php echo htmlspecialchars($full_name); ?></h3>
                <p style="color: var(--gray-text); font-size: 0.9rem;">
                    <?php echo htmlspecialchars($email); ?>
                </p>
                <p style="background: rgba(0, 243, 255, 0.1); color: var(--primary-cyan); 
                   padding: 5px 10px; border-radius: 5px; display: inline-block; margin-top: 10px;">
                    <?php echo ucfirst($role); ?>
                </p>
            </div>
            
            <ul class="sidebar-nav">
                <li><a href="#" class="active"><i class="fas fa-home"></i> Dashboard</a></li>
                <li><a href="profile.php"><i class="fas fa-user"></i> Profile</a></li>
                
                <?php if ($role === 'user'): ?>
                <li><a href="my-applications.php"><i class="fas fa-briefcase"></i> My Applications</a></li>
                <li><a href="apply-job.php"><i class="fas fa-plus-circle"></i> Apply for Job</a></li>
                <?php endif; ?>
                
                <?php if ($role === 'admin' || $role === 'manager'): ?>
                <li><a href="manage-applications.php"><i class="fas fa-tasks"></i> Manage Applications</a></li>
                <li><a href="post-job.php"><i class="fas fa-edit"></i> Post New Job</a></li>
                <?php endif; ?>
                
                <?php if ($role === 'admin'): ?>
                <li><a href="admin/users.php"><i class="fas fa-users"></i> User Management</a></li>
                <li><a href="admin/reports.php"><i class="fas fa-chart-bar"></i> Reports</a></li>
                <?php endif; ?>
                
                <li><a href="settings.php"><i class="fas fa-cog"></i> Settings</a></li>
                <li><a href="logout.php" class="logout-btn" style="margin-top: 30px;">
                    <i class="fas fa-sign-out-alt"></i> Logout
                </a></li>
            </ul>
        </div>
        
        <!-- Main Content -->
        <div class="main-content">
            <div class="dashboard-header">
                <h1>Welcome back, <?php echo htmlspecialchars($full_name); ?>!</h1>
                <div style="position: relative;">
                    <button onclick="toggleNotifications()" style="background: none; border: none; color: var(--primary-cyan); 
                           font-size: 1.5rem; cursor: pointer; position: relative;">
                        <i class="fas fa-bell"></i>
                        <?php if ($unread_count > 0): ?>
                        <span class="notification-badge"><?php echo $unread_count; ?></span>
                        <?php endif; ?>
                    </button>
                </div>
            </div>
            
            <!-- Stats Grid -->
            <div class="stats-grid">
                <?php if ($role === 'user' && isset($stats['applications'])): ?>
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-paper-plane"></i>
                    </div>
                    <h3>Total Applications</h3>
                    <div class="stat-value"><?php echo $stats['applications']['total'] ?? 0; ?></div>
                    <p style="color: var(--gray-text);">Applications submitted</p>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-clock"></i>
                    </div>
                    <h3>Pending Review</h3>
                    <div class="stat-value"><?php echo $stats['applications']['pending'] ?? 0; ?></div>
                    <p style="color: var(--gray-text);">Awaiting review</p>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-eye"></i>
                    </div>
                    <h3>Reviewed</h3>
                    <div class="stat-value"><?php echo $stats['applications']['reviewed'] ?? 0; ?></div>
                    <p style="color: var(--gray-text);">Under review</p>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-star"></i>
                    </div>
                    <h3>Shortlisted</h3>
                    <div class="stat-value"><?php echo $stats['applications']['shortlisted'] ?? 0; ?></div>
                    <p style="color: var(--gray-text);">Shortlisted for next round</p>
                </div>
                <?php endif; ?>
            </div>
            
            <!-- Recent Activity -->
            <div class="activity-section">
                <h2 class="section-title">Recent Activity</h2>
                <div class="activity-list">
                    <?php if (!empty($recent_activity)): ?>
                        <?php foreach ($recent_activity as $activity): ?>
                        <div class="activity-item">
                            <div style="margin-right: 15px; color: var(--primary-cyan);">
                                <i class="fas fa-history"></i>
                            </div>
                            <div>
                                <p style="margin: 0; font-weight: 500;">
                                    <?php echo htmlspecialchars($activity['action']); ?>
                                </p>
                                <p style="margin: 5px 0 0 0; color: var(--gray-text); font-size: 0.9rem;">
                                    <?php echo htmlspecialchars($activity['details']); ?>
                                </p>
                                <small style="color: var(--gray-text);">
                                    <?php echo date('M j, Y g:i A', strtotime($activity['created_at'])); ?>
                                </small>
                            </div>
                        </div>
                        <?php endforeach; ?>
                    <?php else: ?>
                        <p style="color: var(--gray-text); text-align: center; padding: 20px;">
                            No recent activity
                        </p>
                    <?php endif; ?>
                </div>
            </div>
            
            <!-- Notifications -->
            <div class="notifications-section" id="notifications-panel" style="display: none;">
                <h2 class="section-title">Notifications</h2>
                <div class="notifications-list">
                    <?php if (!empty($notifications)): ?>
                        <?php foreach ($notifications as $notification): ?>
                        <div class="notification-item <?php echo $notification['is_read'] ? '' : 'unread'; ?>" 
                             data-notification-id="<?php echo $notification['id']; ?>">
                            <div style="margin-right: 15px; color: 
                                <?php echo $notification['type'] === 'success' ? 'var(--primary-cyan)' : 
                                          ($notification['type'] === 'warning' ? '#ffcc00' : 
                                          ($notification['type'] === 'error' ? 'var(--primary-pink)' : 'var(--gray-text)')); ?>">
                                <i class="fas fa-<?php echo $notification['type'] === 'success' ? 'check-circle' : 
                                                       ($notification['type'] === 'warning' ? 'exclamation-circle' : 
                                                       ($notification['type'] === 'error' ? 'times-circle' : 'info-circle')); ?>"></i>
                            </div>
                            <div style="flex: 1;">
                                <p style="margin: 0; font-weight: 500;">
                                    <?php echo htmlspecialchars($notification['title']); ?>
                                    <?php if (!$notification['is_read']): ?>
                                    <span class="notification-badge">New</span>
                                    <?php endif; ?>
                                </p>
                                <p style="margin: 5px 0 0 0; color: var(--gray-text);">
                                    <?php echo htmlspecialchars($notification['message']); ?>
                                </p>
                                <small style="color: var(--gray-text);">
                                    <?php echo date('M j, Y g:i A', strtotime($notification['created_at'])); ?>
                                </small>
                            </div>
                        </div>
                        <?php endforeach; ?>
                    <?php else: ?>
                        <p style="color: var(--gray-text); text-align: center; padding: 20px;">
                            No notifications
                        </p>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        function toggleNotifications() {
            const panel = document.getElementById('notifications-panel');
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
            
            // Mark notifications as read when panel is opened
            if (panel.style.display === 'block') {
                markNotificationsAsRead();
            }
        }
        
        function markNotificationsAsRead() {
            const unreadItems = document.querySelectorAll('.notification-item.unread');
            const notificationIds = [];
            
            unreadItems.forEach(item => {
                notificationIds.push(item.dataset.notificationId);
                item.classList.remove('unread');
            });
            
            // Send AJAX request to mark as read
            if (notificationIds.length > 0) {
                fetch('/php/mark-notifications-read.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ notification_ids: notificationIds })
                });
            }
        }
        
        // Close notifications panel when clicking outside
        document.addEventListener('click', function(event) {
            const panel = document.getElementById('notifications-panel');
            const bellIcon = document.querySelector('.fa-bell');
            
            if (panel.style.display === 'block' && 
                !panel.contains(event.target) && 
                !bellIcon.closest('button').contains(event.target)) {
                panel.style.display = 'none';
            }
        });
    </script>
</body>
</html>