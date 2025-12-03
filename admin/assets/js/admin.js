// ===== CyberShield Pro Admin Dashboard JavaScript =====

// Admin Configuration
const ADMIN_CONFIG = {
    appName: 'CyberShield Pro',
    version: '2.4.0',
    sessionTimeout: 30, // minutes
    apiBaseUrl: '/api/admin',
    enableNotifications: true,
    debugMode: false
};

// Global State
let adminState = {
    currentSection: 'overview',
    lastActivity: Date.now(),
    notifications: [],
    theme: 'dark'
};

// DOM Elements Cache
const elements = {
    sidebar: null,
    mainContent: null,
    currentTime: null,
    adminUsername: null,
    userAvatar: null,
    mobileMenuToggle: null,
    logoutModal: null,
    logoutBtn: null,
    cancelLogout: null,
    confirmLogout: null
};

// Chart Instances
const charts = {
    userGrowth: null,
    threatActivity: null,
    revenue: null,
    systemHealth: null
};

// Initialize Dashboard
function initializeAdminDashboard() {
    console.log(`🚀 ${ADMIN_CONFIG.appName} v${ADMIN_CONFIG.version} Initializing...`);
    
    cacheDOMElements();
    validateSession();
    setupEventListeners();
    initializeCharts();
    loadDashboardData();
    startTimers();
    
    // Update UI
    updateAdminInfo();
    updateTime();
    
    // Check for updates
    checkForUpdates();
    
    console.log('✅ Admin dashboard initialized successfully');
}

// Cache DOM Elements
function cacheDOMElements() {
    elements.sidebar = document.getElementById('sidebar');
    elements.mainContent = document.getElementById('main-content');
    elements.currentTime = document.getElementById('current-time');
    elements.adminUsername = document.getElementById('admin-username');
    elements.userAvatar = document.getElementById('user-avatar');
    elements.mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    elements.logoutModal = document.getElementById('logout-modal');
    elements.logoutBtn = document.getElementById('logout-btn');
    elements.cancelLogout = document.getElementById('cancel-logout');
    elements.confirmLogout = document.getElementById('confirm-logout');
    
    // Add mobile menu toggle button if not exists
    if (!elements.mobileMenuToggle) {
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'mobile-menu-toggle';
        toggleBtn.className = 'btn btn-primary lg:hidden mobile-menu-toggle';
        toggleBtn.innerHTML = '<i class="fas fa-bars"></i>';
        document.querySelector('.user-info').appendChild(toggleBtn);
        elements.mobileMenuToggle = toggleBtn;
    }
}

// Validate Admin Session
function validateSession() {
    try {
        const sessionData = localStorage.getItem('admin_session');
        
        if (!sessionData) {
            redirectToLogin('No active session found');
            return false;
        }
        
        const session = JSON.parse(sessionData);
        
        // Check session expiration
        if (session.expires && session.expires < Date.now()) {
            localStorage.removeItem('admin_session');
            redirectToLogin('Session expired');
            return false;
        }
        
        // Validate session structure
        if (!session.username || !session.token) {
            redirectToLogin('Invalid session data');
            return false;
        }
        
        // Update last activity
        adminState.lastActivity = Date.now();
        
        return true;
        
    } catch (error) {
        console.error('Session validation error:', error);
        redirectToLogin('Session validation failed');
        return false;
    }
}

// Redirect to Login Page
function redirectToLogin(reason = '') {
    if (reason) {
        localStorage.setItem('logout_reason', reason);
    }
    
    // Log logout event
    const logoutLog = {
        timestamp: new Date().toISOString(),
        username: elements.adminUsername?.textContent || 'Unknown',
        action: 'auto_logout',
        reason: reason
    };
    
    const logs = JSON.parse(localStorage.getItem('admin_logs') || '[]');
    logs.unshift(logoutLog);
    localStorage.setItem('admin_logs', JSON.stringify(logs.slice(0, 100)));
    
    // Clear session and redirect
    localStorage.removeItem('admin_session');
    window.location.href = '../index.html';
}

// Setup Event Listeners
function setupEventListeners() {
    // Mobile menu toggle
    if (elements.mobileMenuToggle) {
        elements.mobileMenuToggle.addEventListener('click', toggleSidebar);
    }
    
    // Navigation items
    document.querySelectorAll('.nav-item[data-section]').forEach(item => {
        item.addEventListener('click', handleNavigation);
    });
    
    // Logout handlers
    if (elements.logoutBtn) {
        elements.logoutBtn.addEventListener('click', () => {
            showModal('logout-modal');
        });
    }
    
    if (elements.cancelLogout) {
        elements.cancelLogout.addEventListener('click', () => {
            hideModal('logout-modal');
        });
    }
    
    if (elements.confirmLogout) {
        elements.confirmLogout.addEventListener('click', performLogout);
    }
    
    // Modal backdrop click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                hideModal(this.id);
            }
        });
    });
    
    // Activity tracking
    ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'].forEach(event => {
        document.addEventListener(event, updateLastActivity);
    });
    
    // Window events
    window.addEventListener('resize', handleResize);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Prevent back button
    history.pushState(null, null, location.href);
    window.onpopstate = function() {
        history.go(1);
        showNotification('Navigation disabled in admin panel', 'warning');
    };
}

// Toggle Sidebar (Mobile)
function toggleSidebar() {
    elements.sidebar.classList.toggle('active');
    elements.mainContent.classList.toggle('expanded');
}

// Handle Navigation
function handleNavigation(e) {
    e.preventDefault();
    
    const section = this.getAttribute('data-section');
    const allNavItems = document.querySelectorAll('.nav-item[data-section]');
    
    // Update active state
    allNavItems.forEach(item => item.classList.remove('active'));
    this.classList.add('active');
    
    // Load section
    loadSection(section);
    
    // Close sidebar on mobile
    if (window.innerWidth < 1024) {
        toggleSidebar();
    }
    
    // Update state
    adminState.currentSection = section;
    
    // Log navigation
    logActivity(`Navigated to ${section} section`, 'info');
}

// Load Section Content
function loadSection(section) {
    const contentDiv = document.getElementById('dashboard-content');
    
    // Hide all sections
    document.querySelectorAll('.section-content').forEach(sec => {
        sec.style.display = 'none';
    });
    
    // Show selected section if exists
    const existingSection = document.getElementById(`${section}-section`);
    if (existingSection) {
        existingSection.style.display = 'block';
        return;
    }
    
    // Load dynamic content
    const sectionTitles = {
        users: 'User Management',
        security: 'Security Center',
        threats: 'Threat Monitoring',
        logs: 'System Logs',
        analytics: 'Analytics',
        settings: 'Settings',
        backup: 'Backup & Restore'
    };
    
    contentDiv.innerHTML = `
        <section id="${section}-section" class="section-content">
            <div class="admin-card">
                <h2 class="text-2xl font-bold mb-4 text-gradient">${sectionTitles[section] || section.charAt(0).toUpperCase() + section.slice(1)}</h2>
                <p class="text-gray-400 mb-6">This section is under active development. Coming soon!</p>
                
                <div class="loading-spinner"></div>
                
                <div class="mt-6 p-4 bg-blue-900/20 border border-blue-800/30 rounded-lg">
                    <h3 class="font-semibold text-blue-300 mb-2">Planned Features:</h3>
                    <ul class="list-disc list-inside text-gray-400 space-y-1">
                        <li>Real-time data visualization</li>
                        <li>Advanced filtering and search</li>
                        <li>Bulk operations</li>
                        <li>Export functionality</li>
                        <li>API integration</li>
                    </ul>
                </div>
            </div>
        </section>
    `;
}

// Initialize Charts
function initializeCharts() {
    // Destroy existing charts
    Object.values(charts).forEach(chart => {
        if (chart) chart.destroy();
    });
    
    // User Growth Chart
    const userCtx = document.getElementById('userGrowthChart');
    if (userCtx) {
        charts.userGrowth = new Chart(userCtx.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [{
                    label: 'Active Users',
                    data: [1500, 1650, 1800, 1950, 2100, 2300, 2500, 2650, 2800, 2847, 2900, 3000],
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#3b82f6',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 6
                }]
            },
            options: getChartOptions('User Growth Over Time')
        });
    }
    
    // Threat Activity Chart
    const threatCtx = document.getElementById('threatActivityChart');
    if (threatCtx) {
        charts.threatActivity = new Chart(threatCtx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Malware', 'Phishing', 'DDoS', 'Brute Force', 'SQLi', 'XSS'],
                datasets: [{
                    label: 'Threat Count',
                    data: [45, 28, 12, 36, 8, 24],
                    backgroundColor: [
                        '#ef4444',
                        '#f59e0b',
                        '#10b981',
                        '#3b82f6',
                        '#8b5cf6',
                        '#ec4899'
                    ],
                    borderRadius: 6,
                    borderSkipped: false
                }]
            },
            options: getChartOptions('Threat Activity Distribution', true)
        });
    }
}

// Get Chart Options
function getChartOptions(title, isBar = false) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    color: '#9ca3af',
                    font: {
                        size: 12
                    }
                }
            },
            title: {
                display: true,
                text: title,
                color: '#ffffff',
                font: {
                    size: 14,
                    weight: '600'
                },
                padding: {
                    bottom: 20
                }
            },
            tooltip: {
                backgroundColor: 'rgba(30, 41, 59, 0.95)',
                titleColor: '#ffffff',
                bodyColor: '#d1d5db',
                borderColor: '#374151',
                borderWidth: 1,
                cornerRadius: 8,
                displayColors: true,
                callbacks: {
                    label: function(context) {
                        return `${context.dataset.label}: ${context.raw}`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: isBar,
                grid: {
                    color: '#374151',
                    drawBorder: false
                },
                ticks: {
                    color: '#9ca3af',
                    font: {
                        size: 11
                    }
                }
            },
            x: {
                grid: {
                    color: '#374151',
                    drawBorder: false
                },
                ticks: {
                    color: '#9ca3af',
                    font: {
                        size: 11
                    }
                }
            }
        },
        interaction: {
            intersect: false,
            mode: 'index'
        },
        animations: {
            tension: {
                duration: 1000,
                easing: 'easeOutCubic'
            }
        }
    };
}

// Load Dashboard Data
async function loadDashboardData() {
    try {
        // Simulate API call
        const mockData = {
            totalUsers: 2847,
            activeUsers: 2312,
            systemUptime: 98.7,
            threatsBlocked: 2456,
            revenue: 280000,
            serverLoad: 42
        };
        
        // Update stats cards
        updateStatsCards(mockData);
        
        // Load recent activity
        loadRecentActivity();
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showNotification('Failed to load dashboard data', 'error');
    }
}

// Update Stats Cards
function updateStatsCards(data) {
    const statsElements = {
        'Total Users': data.totalUsers,
        'System Uptime': `${data.systemUptime}%`,
        'Critical Threats': Math.floor(Math.random() * 50) + 10,
        'Monthly Revenue': `₹${(data.revenue / 1000).toFixed(1)}L`
    };
    
    // Update each stat card
    document.querySelectorAll('.stat-card').forEach((card, index) => {
        const statNumber = card.querySelector('.stat-number');
        const statLabel = card.querySelector('.stat-label');
        
        if (statNumber && statLabel) {
            const labels = Object.keys(statsElements);
            if (labels[index]) {
                statLabel.textContent = labels[index];
                statNumber.textContent = Object.values(statsElements)[index];
                
                // Add animation
                animateCounter(statNumber, 0, Object.values(statsElements)[index], 1000);
            }
        }
    });
}

// Animate Counter
function animateCounter(element, start, end, duration) {
    if (typeof end === 'string' && end.includes('₹')) {
        return; // Don't animate currency
    }
    
    if (typeof end === 'string' && end.includes('%')) {
        return; // Don't animate percentage
    }
    
    const numericEnd = parseInt(end.toString().replace(/[^0-9]/g, ''));
    if (isNaN(numericEnd)) return;
    
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = Math.floor(progress * (numericEnd - start) + start);
        element.textContent = value.toLocaleString();
        
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// Load Recent Activity
function loadRecentActivity() {
    const activities = [
        {
            icon: 'user-plus',
            title: 'New user registration',
            description: 'john.doe@company.com - 5 minutes ago',
            type: 'success'
        },
        {
            icon: 'exclamation-triangle',
            title: 'Critical threat detected',
            description: 'Malware from external network - 15 minutes ago',
            type: 'danger'
        },
        {
            icon: 'server',
            title: 'System maintenance',
            description: 'Database optimization completed - 1 hour ago',
            type: 'warning'
        },
        {
            icon: 'credit-card',
            title: 'Payment received',
            description: 'Subscription renewal - 2 hours ago',
            type: 'success'
        },
        {
            icon: 'user-shield',
            title: 'Security audit',
            description: 'Monthly security audit completed - 3 hours ago',
            type: 'info'
        }
    ];
    
    const activityLog = document.querySelector('.activity-log');
    if (!activityLog) return;
    
    activityLog.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon ${activity.type}">
                <i class="fas fa-${activity.icon}"></i>
            </div>
            <div class="activity-content">
                <p>${activity.title}</p>
                <p>${activity.description}</p>
            </div>
            <span class="badge badge-${activity.type}">
                ${activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
            </span>
        </div>
    `).join('');
}

// Update Admin Info
function updateAdminInfo() {
    try {
        const sessionData = JSON.parse(localStorage.getItem('admin_session') || '{}');
        
        if (elements.adminUsername && sessionData.username) {
            elements.adminUsername.textContent = sessionData.username;
        }
        
        if (elements.userAvatar && sessionData.username) {
            elements.userAvatar.textContent = sessionData.username.charAt(0).toUpperCase();
            
            // Generate consistent gradient based on username
            const colors = [
                ['#3b82f6', '#8b5cf6'],
                ['#10b981', '#3b82f6'],
                ['#f59e0b', '#ef4444'],
                ['#ec4899', '#8b5cf6']
            ];
            
            const colorIndex = sessionData.username.charCodeAt(0) % colors.length;
            elements.userAvatar.style.background = `linear-gradient(135deg, ${colors[colorIndex][0]}, ${colors[colorIndex][1]})`;
        }
        
    } catch (error) {
        console.error('Error updating admin info:', error);
    }
}

// Update Time
function updateTime() {
    if (!elements.currentTime) return;
    
    const now = new Date();
    const timeString = now.toLocaleString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
    
    elements.currentTime.textContent = timeString;
    elements.currentTime.title = `Server Time: ${now.toISOString()}`;
}

// Start Timers
function startTimers() {
    // Update time every second
    setInterval(updateTime, 1000);
    
    // Check session every minute
    setInterval(() => {
        const idleTime = Date.now() - adminState.lastActivity;
        const timeoutMs = ADMIN_CONFIG.sessionTimeout * 60 * 1000;
        
        if (idleTime > timeoutMs) {
            redirectToLogin('Session timeout due to inactivity');
        } else if (idleTime > timeoutMs * 0.8) {
            showNotification('Your session will expire soon. Please refresh your session.', 'warning');
        }
    }, 60000);
    
    // Refresh data every 5 minutes
    setInterval(loadDashboardData, 300000);
}

// Update Last Activity
function updateLastActivity() {
    adminState.lastActivity = Date.now();
}

// Show Modal
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

// Hide Modal
function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Perform Logout
function performLogout() {
    // Clear session
    localStorage.removeItem('admin_session');
    
    // Log logout event
    const logoutLog = {
        timestamp: new Date().toISOString(),
        username: elements.adminUsername?.textContent || 'Unknown',
        action: 'manual_logout',
        ip: '127.0.0.1'
    };
    
    const logs = JSON.parse(localStorage.getItem('admin_logs') || '[]');
    logs.unshift(logoutLog);
    localStorage.setItem('admin_logs', JSON.stringify(logs.slice(0, 100)));
    
    // Redirect to login
    window.location.href = '../index.html';
}

// Show Notification
function showNotification(message, type = 'info', duration = 5000) {
    if (!ADMIN_CONFIG.enableNotifications) return;
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-icon">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
        </div>
        <div class="notification-content">${message}</div>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Show with animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Close button
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    });
    
    // Auto remove
    if (duration > 0) {
        setTimeout(() => {
            if (notification.parentNode) {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }
        }, duration);
    }
    
    // Store in state
    adminState.notifications.push({
        message,
        type,
        timestamp: new Date(),
        id: Date.now()
    });
}

// Get Notification Icon
function getNotificationIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

// Log Activity
function logActivity(message, type = 'info') {
    if (ADMIN_CONFIG.debugMode) {
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
    
    const activity = {
        timestamp: new Date().toISOString(),
        message,
        type,
        section: adminState.currentSection
    };
    
    // Store in localStorage
    const activities = JSON.parse(localStorage.getItem('admin_activities') || '[]');
    activities.unshift(activity);
    localStorage.setItem('admin_activities', JSON.stringify(activities.slice(0, 1000)));
}

// Handle Resize
function handleResize() {
    if (window.innerWidth >= 1024) {
        elements.sidebar.classList.remove('active');
        elements.mainContent.classList.remove('expanded');
    }
    
    // Update charts on resize
    Object.values(charts).forEach(chart => {
        if (chart) chart.resize();
    });
}

// Handle Before Unload
function handleBeforeUnload(e) {
    // You can add cleanup logic here
    logActivity('Admin dashboard closed', 'info');
}

// Check for Updates
async function checkForUpdates() {
    try {
        // Simulate update check
        const currentVersion = ADMIN_CONFIG.version;
        const latestVersion = '2.4.1'; // This would come from an API
        
        if (latestVersion !== currentVersion) {
            showNotification(`Update available! v${latestVersion} is now available.`, 'info', 10000);
        }
    } catch (error) {
        // Silent fail
    }
}

// Export Functions for Debugging
if (typeof window !== 'undefined') {
    window.adminDashboard = {
        initialize: initializeAdminDashboard,
        showNotification,
        logActivity,
        getState: () => adminState,
        getConfig: () => ADMIN_CONFIG
    };
}

// Initialize on DOM Ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAdminDashboard);
} else {
    initializeAdminDashboard();
}

// Add notification styles dynamically
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 16px;
    border-radius: 10px;
    color: white;
    z-index: 9999;
    transform: translateX(150%);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    gap: 12px;
    max-width: 400px;
    backdrop-filter: blur(10px);
    border: 1px solid;
}

.notification.show {
    transform: translateX(0);
}

.notification-success {
    background: rgba(16, 185, 129, 0.15);
    border-color: rgba(16, 185, 129, 0.3);
}

.notification-error {
    background: rgba(239, 68, 68, 0.15);
    border-color: rgba(239, 68, 68, 0.3);
}

.notification-warning {
    background: rgba(245, 158, 11, 0.15);
    border-color: rgba(245, 158, 11, 0.3);
}

.notification-info {
    background: rgba(59, 130, 246, 0.15);
    border-color: rgba(59, 130, 246, 0.3);
}

.notification-icon {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
}

.notification-content {
    flex: 1;
    font-size: 14px;
    font-weight: 500;
}

.notification-close {
    background: none;
    border: none;
    color: inherit;
    cursor: pointer;
    opacity: 0.7;
    transition: opacity 0.2s;
    padding: 4px;
}

.notification-close:hover {
    opacity: 1;
}
`;
document.head.appendChild(notificationStyles);