// auth.js - Authentication functionality

// Auth modal functionality
const authModal = document.getElementById('auth-modal');
const forgotPasswordModal = document.getElementById('forgot-password-modal');
const openLoginBtn = document.getElementById('open-login');
const openSignupBtn = document.getElementById('open-signup');
const closeModalBtn = document.getElementById('close-modal');
const closeForgotModalBtn = document.getElementById('close-forgot-modal');
const authTabs = document.querySelectorAll('.auth-tab');
const authForms = document.querySelectorAll('.auth-form');
const switchToSignup = document.getElementById('switch-to-signup');
const switchToLogin = document.getElementById('switch-to-login');
const authButtons = document.getElementById('auth-buttons');
const userMenu = document.getElementById('user-menu');
const userName = document.getElementById('user-name');
const userAvatar = document.getElementById('user-avatar');
const logoutBtn = document.getElementById('logout-btn');
const forgotPasswordLink = document.getElementById('forgot-password');
const backToLoginLink = document.getElementById('back-to-login');

// Open login modal
openLoginBtn.addEventListener('click', () => {
    authModal.style.display = 'block';
    switchTab('login');
});

// Open signup modal
openSignupBtn.addEventListener('click', () => {
    authModal.style.display = 'block';
    switchTab('signup');
});

// Close modal
closeModalBtn.addEventListener('click', () => {
    authModal.style.display = 'none';
});

closeForgotModalBtn.addEventListener('click', () => {
    forgotPasswordModal.style.display = 'none';
});

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === authModal) {
        authModal.style.display = 'none';
    }
    if (e.target === forgotPasswordModal) {
        forgotPasswordModal.style.display = 'none';
    }
});

// Switch between tabs
authTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const tabName = tab.getAttribute('data-tab');
        switchTab(tabName);
    });
});

// Switch to signup from login
switchToSignup.addEventListener('click', (e) => {
    e.preventDefault();
    switchTab('signup');
});

// Switch to login from signup
switchToLogin.addEventListener('click', (e) => {
    e.preventDefault();
    switchTab('login');
});

// Forgot password functionality
forgotPasswordLink.addEventListener('click', (e) => {
    e.preventDefault();
    authModal.style.display = 'none';
    forgotPasswordModal.style.display = 'block';
});

backToLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    forgotPasswordModal.style.display = 'none';
    authModal.style.display = 'block';
    switchTab('login');
});

// Form submissions
document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    // Simple validation
    if (!email || !password) {
        showToast('Please fill in all fields', 'error');
        return;
    }
    
    // Check if user exists
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        // Update current user
        const currentUser = {
            name: user.name,
            email: user.email,
            joined: user.joined
        };
        
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // Update UI
        authButtons.style.display = 'none';
        userMenu.style.display = 'flex';
        userName.textContent = currentUser.name;
        userAvatar.textContent = currentUser.name.split(' ').map(n => n[0]).join('');
        
        // Add notification
        addNotification('Login successful', 'You have successfully logged in to your account.', 'success');
        
        showToast('Login successful!');
        authModal.style.display = 'none';
        
        // Update dashboard if visible
        if (document.getElementById('dashboard').style.display === 'block') {
            updateDashboard();
        }
    } else {
        showToast('Invalid email or password', 'error');
    }
});

document.getElementById('signup-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirm = document.getElementById('signup-confirm').value;
    
    // Simple validation
    if (!name || !email || !password || !confirm) {
        showToast('Please fill in all fields', 'error');
        return;
    }
    
    if (password !== confirm) {
        showToast('Passwords do not match', 'error');
        return;
    }
    
    if (password.length < 8) {
        showToast('Password must be at least 8 characters long', 'error');
        return;
    }
    
    // Check if user already exists
    const users = JSON.parse(localStorage.getItem('users')) || [];
    if (users.some(user => user.email === email)) {
        showToast('User with this email already exists', 'error');
        return;
    }
    
    // Create new user
    const newUser = {
        name: name,
        email: email,
        password: password,
        joined: new Date().toISOString()
    };
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    // Update current user
    const currentUser = {
        name: name,
        email: email,
        joined: newUser.joined
    };
    
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    // Update UI
    authButtons.style.display = 'none';
    userMenu.style.display = 'flex';
    userName.textContent = currentUser.name;
    userAvatar.textContent = currentUser.name.split(' ').map(n => n[0]).join('');
    
    // Add notification
    addNotification('Welcome to CyberGuard', 'Thank you for creating an account with us.', 'success');
    
    showToast('Account created successfully!');
    authModal.style.display = 'none';
});

document.getElementById('forgot-password-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('reset-email').value;
    
    if (!email) {
        showToast('Please enter your email address', 'error');
        return;
    }
    
    // Check if user exists
    const users = JSON.parse(localStorage.getItem('users')) || [];
    if (users.some(user => user.email === email)) {
        showToast('Password reset link has been sent to your email', 'success');
        forgotPasswordModal.style.display = 'none';
    } else {
        showToast('No account found with this email', 'error');
    }
});

// Logout functionality
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('currentUser');
    authButtons.style.display = 'flex';
    userMenu.style.display = 'none';
    
    // Hide dashboard if visible
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('main-content').style.display = 'block';
    
    showToast('Logged out successfully');
});

function switchTab(tabName) {
    // Update tabs
    document.querySelectorAll('.auth-tab').forEach(tab => {
        if (tab.getAttribute('data-tab') === tabName) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    // Update forms
    document.querySelectorAll('.auth-form').forEach(form => {
        if (form.id === `${tabName}-form`) {
            form.classList.add('active');
        } else {
            form.classList.remove('active');
        }
    });
}