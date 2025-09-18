// JavaScript for interactive elements
document.addEventListener('DOMContentLoaded', function() {
    // Initialize application
    initApp();
    
    // Mobile menu toggle
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    hamburger.addEventListener('click', function() {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });
    
    // Close mobile menu when clicking on a link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
            
            // Smooth scrolling for navigation links
            if (link.getAttribute('href').startsWith('#')) {
                const targetId = link.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - 80,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
    
    // Dashboard link
    document.getElementById('dashboard-link').addEventListener('click', (e) => {
        e.preventDefault();
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (currentUser) {
            showDashboard();
        } else {
            showToast('Please log in to access the dashboard', 'warning');
            document.getElementById('open-login').click();
        }
    });
    
    // Fade in elements on scroll
    const fadeElements = document.querySelectorAll('.fade-in');
    
    function checkFade() {
        fadeElements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const elementVisible = 150;
            
            if (elementTop < window.innerHeight - elementVisible) {
                element.classList.add('visible');
            }
        });
    }
    
    // Check on load and scroll
    window.addEventListener('load', checkFade);
    window.addEventListener('scroll', checkFade);
    
    // Resource link click handlers
    document.querySelectorAll('.resource-card a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const resourceId = link.getAttribute('data-resource');
            if (resourceId) {
                showDetailPage(`${resourceId}-detail`);
            }
        });
    });
    
    // Threat learn more buttons
    document.querySelectorAll('.threat-card .btn').forEach(button => {
        button.addEventListener('click', () => {
            const threatType = button.getAttribute('data-threat');
            if (threatType) {
                showDetailPage(`${threatType}-detail`);
            }
        });
    });
    
    // Back button handlers
    document.querySelectorAll('.back-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            showMainContent();
        });
    });
    
    // Interactive checklist
    const checklistItems = document.querySelectorAll('.check-item input');
    const checklistProgress = document.getElementById('checklist-progress');
    let completedItems = 0;
    
    function updateChecklistProgress() {
        completedItems = 0;
        checklistItems.forEach(item => {
            if (item.checked) {
                completedItems++;
            }
        });
        
        const percentage = Math.round((completedItems / checklistItems.length) * 100);
        checklistProgress.textContent = `Progress: ${completedItems}/${checklistItems.length} (${percentage}%)`;
        
        // Update UI based on progress
        if (completedItems === checklistItems.length) {
            document.querySelector('.checklist').style.backgroundColor = '#f0fff0';
            document.querySelector('.checklist').style.padding = '1rem';
            document.querySelector('.checklist').style.borderRadius = '8px';
        } else {
            document.querySelector('.checklist').style.backgroundColor = '';
        }
        
        // Update activity feed if user is logged in
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (currentUser && completedItems === checklistItems.length) {
            const activities = JSON.parse(localStorage.getItem('activities')) || [];
            activities.unshift({
                type: 'checklist',
                message: 'Completed security checklist',
                date: new Date().toISOString()
            });
            localStorage.setItem('activities', JSON.stringify(activities));
            
            // Update dashboard if visible
            if (document.getElementById('dashboard').style.display === 'block') {
                updateActivityFeed();
            }
        }
    }
    
    checklistItems.forEach(item => {
        item.addEventListener('change', updateChecklistProgress);
    });
    
    // Initialize checklist progress
    updateChecklistProgress();
    
    // Newsletter subscription
    document.getElementById('newsletter-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = e.target.querySelector('input[type="email"]').value;
        
        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showToast('Please enter a valid email address', 'error');
            return;
        }
        
        // Save subscription
        const subscriptions = JSON.parse(localStorage.getItem('newsletterSubscriptions')) || [];
        if (!subscriptions.includes(email)) {
            subscriptions.push(email);
            localStorage.setItem('newsletterSubscriptions', JSON.stringify(subscriptions));
        }
        
        showToast('Thanks for subscribing to our newsletter!');
        e.target.reset();
    });
    
    // Contact link
    document.getElementById('footer-contact').addEventListener('click', (e) => {
        e.preventDefault();
        showToast('Contact form would open here');
    });
    
    // Run security assessment
    document.getElementById('run-assessment').addEventListener('click', () => {
        const btn = document.getElementById('run-assessment');
        btn.disabled = true;
        btn.textContent = 'Running Assessment...';
        
        setTimeout(() => {
            // Simulate assessment
            const newScore = Math.floor(Math.random() * 20) + 80;
            document.getElementById('security-score').textContent = `${newScore}%`;
            
            // Update score circle
            const scoreCircle = document.querySelector('.score-circle');
            scoreCircle.style.background = `conic-gradient(var(--success) 0% ${newScore}%, var(--light) ${newScore}% 100%)`;
            
            // Update completed checks
            const completedChecks = Math.min(10, Math.floor(newScore / 10));
            document.getElementById('completed-checks').textContent = `${completedChecks}/10`;
            
            // Add notification
            addNotification('Security Assessment Complete', `Your security score is ${newScore}%.`, 'success');
            
            // Update activity feed
            const activities = JSON.parse(localStorage.getItem('activities')) || [];
            activities.unshift({
                type: 'assessment',
                message: `Completed security assessment with score ${newScore}%`,
                date: new Date().toISOString()
            });
            localStorage.setItem('activities', JSON.stringify(activities));
            updateActivityFeed();
            
            btn.disabled = false;
            btn.textContent = 'Run New Assessment';
            
            showToast('Security assessment completed successfully!');
        }, 2000);
    });
    
    // Dark mode toggle
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const darkModeIcon = darkModeToggle.querySelector('i');
    
    // Check for saved dark mode preference
    if (localStorage.getItem('darkMode') === 'enabled') {
        document.body.classList.add('dark-mode');
        darkModeIcon.classList.remove('fa-moon');
        darkModeIcon.classList.add('fa-sun');
    }
    
    darkModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        if (document.body.classList.contains('dark-mode')) {
            localStorage.setItem('darkMode', 'enabled');
            darkModeIcon.classList.remove('fa-moon');
            darkModeIcon.classList.add('fa-sun');
        } else {
            localStorage.setItem('darkMode', 'disabled');
            darkModeIcon.classList.remove('fa-sun');
            darkModeIcon.classList.add('fa-moon');
        }
    });
    
    // Progress bar on scroll
    window.addEventListener('scroll', () => {
        const winHeight = window.innerHeight;
        const docHeight = document.documentElement.scrollHeight;
        const scrolled = window.scrollY;
        const progress = (scrolled / (docHeight - winHeight)) * 100;
        document.getElementById('progress-bar').style.width = `${progress}%`;
    });
});

function initApp() {
    // Initialize stats
    updateStats();
    
    // Check if user is logged in
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
        document.getElementById('auth-buttons').style.display = 'none';
        document.getElementById('user-menu').style.display = 'flex';
        document.getElementById('user-name').textContent = currentUser.name;
        document.getElementById('user-avatar').textContent = currentUser.name.split(' ').map(n => n[0]).join('');
    }
    
    // Initialize notifications
    updateNotificationUI();
    
    // Initialize activity feed if dashboard is visible
    if (document.getElementById('dashboard').style.display === 'block') {
        updateActivityFeed();
    }
}

function updateStats() {
    // Animate hero stats
    animateValue('stat-threats', 0, Math.floor(Math.random() * 1000) + 500, 2000);
    animateValue('stat-users', 0, Math.floor(Math.random() * 10000) + 10000, 2000);
    
    const reports = JSON.parse(localStorage.getItem('reports')) || [];
    animateValue('stat-reports', 0, reports.length, 2000);
}

function animateValue(id, start, end, duration) {
    const obj = document.getElementById(id);
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start).toLocaleString();
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

function showDetailPage(pageId) {
    // Hide main content
    document.getElementById('main-content').style.display = 'none';
    document.getElementById('dashboard').style.display = 'none';
    
    // Hide all detail pages
    document.querySelectorAll('.detail-page').forEach(page => {
        page.style.display = 'none';
    });
    
    // Show the requested detail page
    const detailPage = document.getElementById(pageId);
    if (detailPage) {
        detailPage.style.display = 'block';
        window.scrollTo(0, 0);
    }
}

function showMainContent() {
    // Hide all detail pages
    document.querySelectorAll('.detail-page').forEach(page => {
        page.style.display = 'none';
    });
    
    // Show main content
    document.getElementById('main-content').style.display = 'block';
    document.getElementById('dashboard').style.display = 'none';
    window.scrollTo(0, 0);
}

function showDashboard() {
    // Hide main content and detail pages
    document.getElementById('main-content').style.display = 'none';
    document.querySelectorAll('.detail-page').forEach(page => {
        page.style.display = 'none';
    });
    
    // Show dashboard
    document.getElementById('dashboard').style.display = 'block';
    window.scrollTo(0, 0);
    
    // Update dashboard content
    updateDashboard();
}

function updateDashboard() {
    updateActivityFeed();
    
    // Update security score based on activities
    const activities = JSON.parse(localStorage.getItem('activities')) || [];
    let score = 50; // Base score
    
    // Add points for completed activities
    if (activities.some(a => a.type === 'network_scan')) score += 10;
    if (activities.some(a => a.type === 'checklist')) score += 15;
    if (activities.some(a => a.type === 'quiz')) score += 10;
    if (activities.some(a => a.type === 'assessment')) {
        const assessment = activities.find(a => a.type === 'assessment');
        if (assessment) {
            const match = assessment.message.match(/\d+/);
            if (match) {
                score = parseInt(match[0]);
            }
        }
    }
    
    // Ensure score is between 0 and 100
    score = Math.min(100, Math.max(0, score));
    
    document.getElementById('security-score').textContent = `${score}%`;
    
    // Update score circle
    const scoreCircle = document.querySelector('.score-circle');
    scoreCircle.style.background = `conic-gradient(var(--success) 0% ${score}%, var(--light) ${score}% 100%)`;
    
    // Update completed checks
    const completedChecks = Math.min(10, Math.floor(score / 10));
    document.getElementById('completed-checks').textContent = `${completedChecks}/10`;
    
    // Update active alerts
    const notifications = JSON.parse(localStorage.getItem('notifications')) || [];
    const unreadNotifications = notifications.filter(n => !n.read && n.type === 'warning');
    document.getElementById('active-alerts').textContent = unreadNotifications.length;
    
    // Update last scan
    const lastScan = activities.find(a => a.type === 'network_scan');
    if (lastScan) {
        document.getElementById('last-scan').textContent = formatTime(lastScan.date);
    }
}

function updateActivityFeed() {
    const activities = JSON.parse(localStorage.getItem('activities')) || [];
    const activityList = document.getElementById('activity-list');
    
    activityList.innerHTML = '';
    
    if (activities.length === 0) {
        activityList.innerHTML = '<div class="activity-item"><p>No recent activity</p></div>';
        return;
    }
    
    activities.slice(0, 5).forEach(activity => {
        let icon = 'fas fa-info-circle';
        if (activity.type === 'network_scan') icon = 'fas fa-network-wired';
        if (activity.type === 'checklist') icon = 'fas fa-check-circle';
        if (activity.type === 'quiz') icon = 'fas fa-scroll';
        if (activity.type === 'assessment') icon = 'fas fa-chart-line';
        
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        activityItem.innerHTML = `
            <div class="activity-icon">
                <i class="${icon}"></i>
            </div>
            <div class="activity-content">
                <p>${activity.message}</p>
                <div class="activity-time">${formatTime(activity.date)}</div>
            </div>
        `;
        
        activityList.appendChild(activityItem);
    });
}

function formatTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hr ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
}

function showToast(message, type = 'success') {
    // Remove existing toasts
    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach(toast => toast.remove());
    
    // Create new toast
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-exclamation-triangle'}"></i>
        ${message}
    `;
    
    document.body.appendChild(toast);
    
    // Remove toast after animation
    setTimeout(() => {
        toast.remove();
    }, 3000);
}