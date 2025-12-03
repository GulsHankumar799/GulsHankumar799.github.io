/**
 * CyberShield Pro Authentication Module
 * Handles user authentication, session management, and security features
 */

class AuthManager {
    constructor() {
        this.tokenKey = 'auth_token';
        this.userKey = 'user';
        this.sessionKey = 'session_data';
        this.apiBaseUrl = window.location.hostname === 'localhost' 
            ? 'http://localhost:5000/api' 
            : '/api';
        
        this.init();
    }
    
    init() {
        // Check for existing session
        this.checkSession();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Update UI based on auth state
        this.updateAuthUI();
    }
    
    // Check existing session
    checkSession() {
        const token = localStorage.getItem(this.tokenKey);
        const user = localStorage.getItem(this.userKey);
        
        if (token && user) {
            try {
                // Validate token (in production, this would verify with server)
                const parsedUser = JSON.parse(user);
                
                // Check if token is expired (basic check)
                const tokenData = this.parseJwt(token);
                if (tokenData && tokenData.exp * 1000 > Date.now()) {
                    this.user = parsedUser;
                    this.token = token;
                    this.isAuthenticated = true;
                    
                    // Update last activity
                    this.updateLastActivity();
                    
                    return true;
                } else {
                    this.clearSession();
                }
            } catch (error) {
                console.error('Error parsing user data:', error);
                this.clearSession();
            }
        }
        
        return false;
    }
    
    // Parse JWT token
    parseJwt(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            
            return JSON.parse(jsonPayload);
        } catch (error) {
            return null;
        }
    }
    
    // Setup event listeners
    setupEventListeners() {
        // Logout button
        document.addEventListener('click', (e) => {
            if (e.target.closest('#logout-button')) {
                e.preventDefault();
                this.logout();
            }
        });
        
        // Auto logout on inactivity
        document.addEventListener('mousemove', () => this.updateLastActivity());
        document.addEventListener('keypress', () => this.updateLastActivity());
        
        // Check inactivity every minute
        setInterval(() => this.checkInactivity(), 60000);
    }
    
    // Update auth UI
    updateAuthUI() {
        const authState = document.getElementById('logged-in-state');
        const loggedOutState = document.getElementById('logged-out-state');
        const userName = document.getElementById('user-name');
        
        if (this.isAuthenticated && this.user) {
            if (authState) authState.classList.remove('hidden');
            if (loggedOutState) loggedOutState.classList.add('hidden');
            if (userName) userName.textContent = this.user.name || this.user.email;
        } else {
            if (authState) authState.classList.add('hidden');
            if (loggedOutState) loggedOutState.classList.remove('hidden');
        }
    }
    
    // Login function
    async login(email, password, rememberMe = false) {
        try {
            // Show loading state
            this.showLoading(true);
            
            // In production, this would be a real API call
            // const response = await fetch(`${this.apiBaseUrl}/auth/login`, {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({ email, password, rememberMe })
            // });
            
            // For demo purposes, simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Mock response
            const mockResponse = {
                success: true,
                token: 'mock-jwt-token-' + Date.now(),
                user: {
                    id: Date.now(),
                    name: email.split('@')[0],
                    email: email,
                    firstName: email.split('@')[0],
                    lastName: 'User',
                    role: 'user',
                    company: 'Demo Company'
                }
            };
            
            if (mockResponse.success) {
                // Store session data
                localStorage.setItem(this.tokenKey, mockResponse.token);
                localStorage.setItem(this.userKey, JSON.stringify(mockResponse.user));
                localStorage.setItem(this.sessionKey, JSON.stringify({
                    lastActivity: Date.now(),
                    rememberMe: rememberMe
                }));
                
                // Update auth state
                this.user = mockResponse.user;
                this.token = mockResponse.token;
                this.isAuthenticated = true;
                
                // Update UI
                this.updateAuthUI();
                
                // Show success message
                this.showNotification('Login successful!', 'success');
                
                // Redirect to dashboard or previous page
                setTimeout(() => {
                    const redirectTo = localStorage.getItem('redirectAfterLogin') || '../index.html';
                    localStorage.removeItem('redirectAfterLogin');
                    window.location.href = redirectTo;
                }, 1000);
                
                return { success: true, user: mockResponse.user };
            } else {
                throw new Error('Invalid credentials');
            }
            
        } catch (error) {
            console.error('Login error:', error);
            this.showNotification(error.message || 'Login failed. Please try again.', 'error');
            return { success: false, error: error.message };
        } finally {
            this.showLoading(false);
        }
    }
    
    // Register function
    async register(userData) {
        try {
            this.showLoading(true);
            
            // Validate passwords match
            if (userData.password !== userData.confirmPassword) {
                throw new Error('Passwords do not match');
            }
            
            // Validate password strength
            if (!this.validatePasswordStrength(userData.password)) {
                throw new Error('Password does not meet security requirements');
            }
            
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Mock response
            const mockResponse = {
                success: true,
                token: 'mock-jwt-token-' + Date.now(),
                user: {
                    id: Date.now(),
                    name: `${userData.firstName} ${userData.lastName}`,
                    email: userData.email,
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    role: 'user',
                    company: userData.company || '',
                    isVerified: false
                }
            };
            
            if (mockResponse.success) {
                // Store session data
                localStorage.setItem(this.tokenKey, mockResponse.token);
                localStorage.setItem(this.userKey, JSON.stringify(mockResponse.user));
                
                // Update auth state
                this.user = mockResponse.user;
                this.token = mockResponse.token;
                this.isAuthenticated = true;
                
                // Update UI
                this.updateAuthUI();
                
                // Show success message
                this.showNotification('Registration successful! Please verify your email.', 'success');
                
                // Redirect to verification page
                setTimeout(() => {
                    window.location.href = 'verify-email.html';
                }, 1500);
                
                return { success: true, user: mockResponse.user };
            }
            
        } catch (error) {
            console.error('Registration error:', error);
            this.showNotification(error.message || 'Registration failed. Please try again.', 'error');
            return { success: false, error: error.message };
        } finally {
            this.showLoading(false);
        }
    }
    
    // Logout function
    logout() {
        // Clear local storage
        this.clearSession();
        
        // Update auth state
        this.isAuthenticated = false;
        this.user = null;
        this.token = null;
        
        // Update UI
        this.updateAuthUI();
        
        // Show notification
        this.showNotification('You have been logged out.', 'info');
        
        // Redirect to login page
        setTimeout(() => {
            window.location.href = 'pages/auth/login.html';
        }, 1000);
    }
    
    // Clear session
    clearSession() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
        localStorage.removeItem(this.sessionKey);
    }
    
    // Update last activity timestamp
    updateLastActivity() {
        if (this.isAuthenticated) {
            const sessionData = JSON.parse(localStorage.getItem(this.sessionKey) || '{}');
            sessionData.lastActivity = Date.now();
            localStorage.setItem(this.sessionKey, JSON.stringify(sessionData));
        }
    }
    
    // Check inactivity
    checkInactivity() {
        if (!this.isAuthenticated) return;
        
        const sessionData = JSON.parse(localStorage.getItem(this.sessionKey) || '{}');
        const lastActivity = sessionData.lastActivity || 0;
        const rememberMe = sessionData.rememberMe || false;
        
        // 30 minutes timeout for normal sessions, 7 days for remember me
        const timeout = rememberMe ? 7 * 24 * 60 * 60 * 1000 : 30 * 60 * 1000;
        
        if (Date.now() - lastActivity > timeout) {
            this.showNotification('Session expired due to inactivity.', 'warning');
            this.logout();
        }
    }
    
    // Validate password strength
    validatePasswordStrength(password) {
        const requirements = {
            minLength: password.length >= 8,
            hasUpperCase: /[A-Z]/.test(password),
            hasLowerCase: /[a-z]_.test(password),
            hasNumbers: /[0-9]/.test(password),
            hasSpecial: /[^A-Za-z0-9]/.test(password)
        };
        
        // Return true if at least 4 requirements are met
        const metCount = Object.values(requirements).filter(Boolean).length;
        return metCount >= 4;
    }
    
    // Get password strength score
    getPasswordStrength(password) {
        let score = 0;
        
        // Length
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        
        // Character variety
        if (/[A-Z]/.test(password)) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;
        
        // Bonus for mixed case and special chars
        if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password) && /[0-9]_.test(password)) score++;
        
        return Math.min(score, 10); // Max score 10
    }
    
    // Show loading state
    showLoading(show) {
        const buttons = document.querySelectorAll('button[type="submit"]');
        buttons.forEach(button => {
            if (show) {
                button.disabled = true;
                const originalText = button.innerHTML;
                button.setAttribute('data-original-text', originalText);
                button.innerHTML = '<i data-feather="loader" class="w-4 h-4 mr-2 animate-spin"></i>Loading...';
                feather.replace();
            } else {
                button.disabled = false;
                const originalText = button.getAttribute('data-original-text');
                if (originalText) {
                    button.innerHTML = originalText;
                    button.removeAttribute('data-original-text');
                    feather.replace();
                }
            }
        });
    }
    
    // Show notification
    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existing = document.querySelector('.auth-notification');
        if (existing) existing.remove();
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `auth-notification fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transform transition-transform duration-300 ${
            type === 'success' ? 'bg-green-900 text-green-100 border border-green-700' :
            type === 'error' ? 'bg-red-900 text-red-100 border border-red-700' :
            type === 'warning' ? 'bg-yellow-900 text-yellow-100 border border-yellow-700' :
            'bg-blue-900 text-blue-100 border border-blue-700'
        }`;
        
        notification.innerHTML = `
            <div class="flex items-center">
                <i data-feather="${
                    type === 'success' ? 'check-circle' :
                    type === 'error' ? 'alert-circle' :
                    type === 'warning' ? 'alert-triangle' : 'info'
                }" class="w-5 h-5 mr-2"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        feather.replace();
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after 5 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }
    
    // Get current user
    getCurrentUser() {
        return this.user;
    }
    
    // Check if user is authenticated
    isLoggedIn() {
        return this.isAuthenticated;
    }
    
    // Get auth token
    getToken() {
        return this.token;
    }
    
    // Require authentication for page
    requireAuth(redirectTo = 'pages/auth/login.html') {
        if (!this.isAuthenticated) {
            localStorage.setItem('redirectAfterLogin', window.location.pathname);
            window.location.href = redirectTo;
            return false;
        }
        return true;
    }
    
    // Forgot password
    async forgotPassword(email) {
        try {
            this.showLoading(true);
            
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Mock response
            return {
                success: true,
                message: 'Password reset instructions have been sent to your email.'
            };
            
        } catch (error) {
            console.error('Forgot password error:', error);
            return {
                success: false,
                message: 'Failed to send reset instructions. Please try again.'
            };
        } finally {
            this.showLoading(false);
        }
    }
    
    // Reset password
    async resetPassword(token, newPassword) {
        try {
            this.showLoading(true);
            
            // Validate password strength
            if (!this.validatePasswordStrength(newPassword)) {
                throw new Error('Password does not meet security requirements');
            }
            
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Mock response
            return {
                success: true,
                message: 'Password has been reset successfully.'
            };
            
        } catch (error) {
            console.error('Reset password error:', error);
            return {
                success: false,
                message: error.message || 'Failed to reset password. Please try again.'
            };
        } finally {
            this.showLoading(false);
        }
    }
    
    // Change password
    async changePassword(currentPassword, newPassword) {
        try {
            this.showLoading(true);
            
            // Validate password strength
            if (!this.validatePasswordStrength(newPassword)) {
                throw new Error('New password does not meet security requirements');
            }
            
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Mock response
            return {
                success: true,
                message: 'Password changed successfully.'
            };
            
        } catch (error) {
            console.error('Change password error:', error);
            return {
                success: false,
                message: error.message || 'Failed to change password. Please try again.'
            };
        } finally {
            this.showLoading(false);
        }
    }
    
    // Update profile
    async updateProfile(profileData) {
        try {
            this.showLoading(true);
            
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Update local user data
            if (this.user) {
                this.user = { ...this.user, ...profileData };
                localStorage.setItem(this.userKey, JSON.stringify(this.user));
            }
            
            return {
                success: true,
                message: 'Profile updated successfully.',
                user: this.user
            };
            
        } catch (error) {
            console.error('Update profile error:', error);
            return {
                success: false,
                message: 'Failed to update profile. Please try again.'
            };
        } finally {
            this.showLoading(false);
        }
    }
}

// Initialize auth manager
let authManager;

document.addEventListener('DOMContentLoaded', function() {
    authManager = new AuthManager();
    
    // Make authManager available globally
    window.authManager = authManager;
    
    // Auto-login for demo accounts (for development only)
    if (window.location.search.includes('demo=true')) {
        const demoAccounts = {
            admin: { email: 'admin@cybershield.com', password: 'admin123', name: 'Admin User' },
            analyst: { email: 'analyst@cybershield.com', password: 'analyst123', name: 'Security Analyst' },
            user: { email: 'user@cybershield.com', password: 'user123', name: 'Standard User' }
        };
        
        const accountType = window.location.search.match(/account=(\w+)/)?.[1] || 'user';
        const account = demoAccounts[accountType];
        
        if (account && !authManager.isLoggedIn()) {
            authManager.login(account.email, account.password).then(() => {
                // Redirect to home after login
                window.location.href = '../../index.html';
            });
        }
    }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AuthManager };
}