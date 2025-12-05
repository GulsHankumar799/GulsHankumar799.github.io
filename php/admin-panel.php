<?php
// admin-panel.php
session_start();
require_once 'config.php';

// Check if user is admin
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    header('Location: /login.html');
    exit();
}

// Get admin statistics
try {
    $conn = get_db_connection();
    
    // Get total counts
    $stats = [];
    
    // Users count
    $result = $conn->query("
        SELECT COUNT(*) as total,
               SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
               SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
        FROM users
    ");
    $stats['users'] = $result->fetch_assoc();
    
    // Job applications count
    $result = $conn->query("
        SELECT COUNT(*) as total,
               SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
               SUM(CASE WHEN status = 'reviewed' THEN 1 ELSE 0 END) as reviewed,
               SUM(CASE WHEN status = 'shortlisted' THEN 1 ELSE 0 END) as shortlisted,
               SUM(CASE WHEN status = 'hired' THEN 1 ELSE 0 END) as hired
        FROM job_applications
        WHERE applied_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    ");
    $stats['applications'] = $result->fetch_assoc();
    
    // Contact submissions count
    $result = $conn->query("
        SELECT COUNT(*) as total,
               SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new,
               SUM(CASE WHEN status = 'replied' THEN 1 ELSE 0 END) as replied
        FROM contact_submissions
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    ");
    $stats['contacts'] = $result->fetch_assoc();
    
    // Newsletter subscribers
    $result = $conn->query("
        SELECT COUNT(*) as total,
               SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
               SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
        FROM newsletter_subscribers
    ");
    $stats['subscribers'] = $result->fetch_assoc();
    
    // Recent security events
    $stmt = $conn->prepare("
        SELECT event_type, details, ip_address, severity, created_at 
        FROM security_logs 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        ORDER BY created_at DESC 
        LIMIT 20
    ");
    $stmt->execute();
    $security_events = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();
    
    // Recent user registrations
    $result = $conn->query("
        SELECT username, email, role, status, created_at 
        FROM users 
        ORDER BY created_at DESC 
        LIMIT 10
    ");
    $recent_users = $result->fetch_all(MYSQLI_ASSOC);
    
    // Activity summary
    $result = $conn->query("
        SELECT DATE(created_at) as date, 
               COUNT(*) as count,
               action
        FROM activity_logs 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY DATE(created_at), action
        ORDER BY date DESC
    ");
    $activity_summary = $result->fetch_all(MYSQLI_ASSOC);
    
    $conn->close();
    
} catch (Exception $e) {
    error_log("Admin panel error: " . $e->getMessage());
    $stats = [];
    $security_events = [];
    $recent_users = [];
    $activity_summary = [];
}

$page_title = "Admin Dashboard - CyberShield Pro";
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $page_title; ?></title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        :root {
            --primary-cyan: #00f3ff;
            --primary-pink: #ff2a6d;
            --primary-green: #00ff95;
            --primary-yellow: #ffcc00;
            --dark-bg: #0a0e17;
            --card-bg: rgba(26, 29, 41, 0.9);
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Poppins', sans-serif;
            background: var(--dark-bg);
            color: white;
        }
        
        .admin-container {
            display: flex;
            min-height: 100vh;
        }
        
        .admin-sidebar {
            width: 250px;
            background: var(--card-bg);
            border-right: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .admin-header {
            padding: 30px 20px;
            text-align: center;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .admin-logo {
            font-size: 1.5rem;
            font-weight: bold;
            color: var(--primary-cyan);
            margin-bottom: 20px;
        }
        
        .admin-nav {
            padding: 20px;
        }
        
        .nav-group {
            margin-bottom: 30px;
        }
        
        .nav-title {
            color: var(--gray-text);
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 15px;
            padding-left: 10px;
        }
        
        .nav-link {
            display: flex;
            align-items: center;
            padding: 12px 15px;
            color: rgba(255, 255, 255, 0.7);
            text-decoration: none;
            border-radius: 8px;
            margin-bottom: 5px;
            transition: all 0.3s;
        }
        
        .nav-link:hover,
        .nav-link.active {
            background: rgba(0, 243, 255, 0.1);
            color: var(--primary-cyan);
        }
        
        .nav-link i {
            margin-right: 10px;
            width: 20px;
        }
        
        .admin-main {
            flex: 1;
            padding: 30px;
            overflow-y: auto;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        
        .stat-card {
            background: var(--card-bg);
            border-radius: 12px;
            padding: 25px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .stat-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        
        .stat-icon {
            width: 50px;
            height: 50px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
        }
        
        .icon-users { background: rgba(0, 243, 255, 0.1); color: var(--primary-cyan); }
        .icon-applications { background: rgba(255, 42, 109, 0.1); color: var(--primary-pink); }
        .icon-contacts { background: rgba(0, 255, 149, 0.1); color: var(--primary-green); }
        .icon-subscribers { background: rgba(255, 204, 0, 0.1); color: var(--primary-yellow); }
        
        .stat-value {
            font-size: 2.5rem;
            font-weight: bold;
            margin: 10px 0;
        }
        
        .chart-container {
            background: var(--card-bg);
            border-radius: 12px;
            padding: 25px;
            margin-bottom: 30px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .chart-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        
        .security-events {
            background: var(--card-bg);
            border-radius: 12px;
            padding: 25px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .event-item {
            padding: 15px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .event-item:last-child {
            border-bottom: none;
        }
        
        .severity {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 500;
            margin-right: 10px;
        }
        
        .severity-low { background: rgba(0, 255, 149, 0.1); color: var(--primary-green); }
        .severity-medium { background: rgba(255, 204, 0, 0.1); color: var(--primary-yellow); }
        .severity-high { background: rgba(255, 42, 109, 0.1); color: var(--primary-pink); }
        .severity-critical { background: rgba(255, 0, 0, 0.1); color: #ff0000; }
        
        .recent-users {
            background: var(--card-bg);
            border-radius: 12px;
            padding: 25px;
            margin-top: 30px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .user-item {
            display: flex;
            align-items: center;
            padding: 15px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .user-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--primary-cyan), var(--primary-pink));
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 15px;
            font-weight: bold;
        }
        
        .user-info {
            flex: 1;
        }
        
        .user-role {
            background: rgba(0, 243, 255, 0.1);
            color: var(--primary-cyan);
            padding: 3px 10px;
            border-radius: 5px;
            font-size: 0.8rem;
        }
    </style>
</head>
<body>
    <div class="admin-container">
        <!-- Sidebar -->
        <div class="admin-sidebar">
            <div class="admin-header">
                <div class="admin-logo">
                    <i class="fas fa-shield-alt"></i> Admin Panel
                </div>
                <p style="color: rgba(255, 255, 255, 0.7); font-size: 0.9rem;">
                    <?php echo htmlspecialchars($_SESSION['full_name']); ?>
                </p>
            </div>
            
            <div class="admin-nav">
                <div class="nav-group">
                    <div class="nav-title">Dashboard</div>
                    <a href="#" class="nav-link active">
                        <i class="fas fa-home"></i> Overview
                    </a>
                </div>
                
                <div class="nav-group">
                    <div class="nav-title">Management</div>
                    <a href="admin/users.php" class="nav-link">
                        <i class="fas fa-users"></i> Users
                    </a>
                    <a href="admin/jobs.php" class="nav-link">
                        <i class="fas fa-briefcase"></i> Jobs
                    </a>
                    <a href="admin/applications.php" class="nav-link">
                        <i class="fas fa-file-alt"></i> Applications
                    </a>
                </div>
                
                <div class="nav-group">
                    <div class="nav-title">Content</div>
                    <a href="admin/contacts.php" class="nav-link">
                        <i class="fas fa-envelope"></i> Contact Forms
                    </a>
                    <a href="admin/newsletter.php" class="nav-link">
                        <i class="fas fa-newspaper"></i> Newsletter
                    </a>
                    <a href="admin/blog.php" class="nav-link">
                        <i class="fas fa-blog"></i> Blog Posts
                    </a>
                </div>
                
                <div class="nav-group">
                    <div class="nav-title">Security</div>
                    <a href="admin/security-logs.php" class="nav-link">
                        <i class="fas fa-shield-alt"></i> Security Logs
                    </a>
                    <a href="admin/activity-logs.php" class="nav-link">
                        <i class="fas fa-history"></i> Activity Logs
                    </a>
                </div>
                
                <div class="nav-group">
                    <div class="nav-title">Settings</div>
                    <a href="admin/settings.php" class="nav-link">
                        <i class="fas fa-cog"></i> System Settings
                    </a>
                    <a href="admin/backup.php" class="nav-link">
                        <i class="fas fa-database"></i> Backup
                    </a>
                </div>
            </div>
        </div>
        
        <!-- Main Content -->
        <div class="admin-main">
            <!-- Stats Grid -->
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-header">
                        <h3>Users</h3>
                        <div class="stat-icon icon-users">
                            <i class="fas fa-users"></i>
                        </div>
                    </div>
                    <div class="stat-value">
                        <?php echo $stats['users']['total'] ?? 0; ?>
                    </div>
                    <p style="color: rgba(255, 255, 255, 0.7);">
                        <span style="color: var(--primary-green);">
                            <?php echo $stats['users']['active'] ?? 0; ?> active
                        </span> • 
                        <span style="color: var(--primary-yellow);">
                            <?php echo $stats['users']['pending'] ?? 0; ?> pending
                        </span>
                    </p>
                </div>
                
                <div class="stat-card">
                    <div class="stat-header">
                        <h3>Applications</h3>
                        <div class="stat-icon icon-applications">
                            <i class="fas fa-file-alt"></i>
                        </div>
                    </div>
                    <div class="stat-value">
                        <?php echo $stats['applications']['total'] ?? 0; ?>
                    </div>
                    <p style="color: rgba(255, 255, 255, 0.7);">
                        <span style="color: var(--primary-yellow);">
                            <?php echo $stats['applications']['pending'] ?? 0; ?> pending
                        </span> • 
                        <span style="color: var(--primary-green);">
                            <?php echo $stats['applications']['hired'] ?? 0; ?> hired
                        </span>
                    </p>
                </div>
                
                <div class="stat-card">
                    <div class="stat-header">
                        <h3>Contact Forms</h3>
                        <div class="stat-icon icon-contacts">
                            <i class="fas fa-envelope"></i>
                        </div>
                    </div>
                    <div class="stat-value">
                        <?php echo $stats['contacts']['total'] ?? 0; ?>
                    </div>
                    <p style="color: rgba(255, 255, 255, 0.7);">
                        <span style="color: var(--primary-pink);">
                            <?php echo $stats['contacts']['new'] ?? 0; ?> new
                        </span> • 
                        <span style="color: var(--primary-green);">
                            <?php echo $stats['contacts']['replied'] ?? 0; ?> replied
                        </span>
                    </p>
                </div>
                
                <div class="stat-card">
                    <div class="stat-header">
                        <h3>Subscribers</h3>
                        <div class="stat-icon icon-subscribers">
                            <i class="fas fa-newspaper"></i>
                        </div>
                    </div>
                    <div class="stat-value">
                        <?php echo $stats['subscribers']['total'] ?? 0; ?>
                    </div>
                    <p style="color: rgba(255, 255, 255, 0.7);">
                        <span style="color: var(--primary-green);">
                            <?php echo $stats['subscribers']['active'] ?? 0; ?> active
                        </span> • 
                        <span style="color: var(--primary-yellow);">
                            <?php echo $stats['subscribers']['pending'] ?? 0; ?> pending
                        </span>
                    </p>
                </div>
            </div>
            
            <!-- Charts -->
            <div class="chart-container">
                <div class="chart-header">
                    <h3>Activity Overview (Last 7 Days)</h3>
                    <select id="chart-period" style="background: rgba(255, 255, 255, 0.1); 
                           border: 1px solid rgba(255, 255, 255, 0.2); color: white; 
                           padding: 5px 10px; border-radius: 5px;">
                        <option value="7">Last 7 Days</option>
                        <option value="30">Last 30 Days</option>
                        <option value="90">Last 90 Days</option>
                    </select>
                </div>
                <canvas id="activityChart" height="100"></canvas>
            </div>
            
            <!-- Recent Security Events -->
            <div class="security-events">
                <h3 style="margin-bottom: 20px;">Recent Security Events</h3>
                <?php if (!empty($security_events)): ?>
                    <?php foreach ($security_events as $event): ?>
                    <div class="event-item">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <span class="severity severity-<?php echo strtolower($event['severity']); ?>">
                                    <?php echo $event['severity']; ?>
                                </span>
                                <strong><?php echo htmlspecialchars($event['event_type']); ?></strong>
                            </div>
                            <small style="color: rgba(255, 255, 255, 0.5);">
                                <?php echo date('M j, g:i A', strtotime($event['created_at'])); ?>
                            </small>
                        </div>
                        <p style="margin: 10px 0; color: rgba(255, 255, 255, 0.7); font-size: 0.9rem;">
                            <?php echo htmlspecialchars($event['details']); ?>
                        </p>
                        <small style="color: rgba(255, 255, 255, 0.5);">
                            IP: <?php echo htmlspecialchars($event['ip_address']); ?>
                        </small>
                    </div>
                    <?php endforeach; ?>
                <?php else: ?>
                    <p style="color: rgba(255, 255, 255, 0.7); text-align: center; padding: 20px;">
                        No security events in the last 7 days
                    </p>
                <?php endif; ?>
            </div>
            
            <!-- Recent Users -->
            <div class="recent-users">
                <h3 style="margin-bottom: 20px;">Recent User Registrations</h3>
                <?php if (!empty($recent_users)): ?>
                    <?php foreach ($recent_users as $user): ?>
                    <div class="user-item">
                        <div class="user-avatar">
                            <?php echo strtoupper(substr($user['username'], 0, 1)); ?>
                        </div>
                        <div class="user-info">
                            <div style="display: flex; justify-content: space-between;">
                                <div>
                                    <strong><?php echo htmlspecialchars($user['username']); ?></strong>
                                    <span class="user-role"><?php echo ucfirst($user['role']); ?></span>
                                </div>
                                <small style="color: rgba(255, 255, 255, 0.5);">
                                    <?php echo date('M j, Y', strtotime($user['created_at'])); ?>
                                </small>
                            </div>
                            <p style="margin: 5px 0; color: rgba(255, 255, 255, 0.7); font-size: 0.9rem;">
                                <?php echo htmlspecialchars($user['email']); ?>
                            </p>
                            <span style="display: inline-block; padding: 2px 8px; border-radius: 3px; 
                                  background: <?php echo $user['status'] === 'active' ? 'rgba(0, 255, 149, 0.1)' : 
                                              ($user['status'] === 'pending' ? 'rgba(255, 204, 0, 0.1)' : 
                                              'rgba(255, 42, 109, 0.1)'); ?>; 
                                  color: <?php echo $user['status'] === 'active' ? 'var(--primary-green)' : 
                                         ($user['status'] === 'pending' ? 'var(--primary-yellow)' : 
                                         'var(--primary-pink)'); ?>; 
                                  font-size: 0.8rem;">
                                <?php echo ucfirst($user['status']); ?>
                            </span>
                        </div>
                    </div>
                    <?php endforeach; ?>
                <?php else: ?>
                    <p style="color: rgba(255, 255, 255, 0.7); text-align: center; padding: 20px;">
                        No recent user registrations
                    </p>
                <?php endif; ?>
            </div>
        </div>
    </div>
    
    <script>
        // Activity Chart
        const activityCtx = document.getElementById('activityChart').getContext('2d');
        const activityChart = new Chart(activityCtx, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [
                    {
                        label: 'Registrations',
                        data: [12, 19, 8, 15, 10, 5, 14],
                        borderColor: '#00f3ff',
                        backgroundColor: 'rgba(0, 243, 255, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: 'Applications',
                        data: [8, 12, 6, 10, 15, 8, 12],
                        borderColor: '#ff2a6d',
                        backgroundColor: 'rgba(255, 42, 109, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: 'Contact Forms',
                        data: [5, 8, 12, 6, 9, 4, 7],
                        borderColor: '#00ff95',
                        backgroundColor: 'rgba(0, 255, 149, 0.1)',
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        }
                    }
                }
            }
        });
        
        // Update chart based on period selection
        document.getElementById('chart-period').addEventListener('change', function(e) {
            const period = e.target.value;
            // In a real application, you would fetch new data based on the period
            console.log('Period changed to:', period + ' days');
        });
    </script>
</body>
</html>