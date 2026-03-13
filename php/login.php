<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sign in - CyberShield Pro Accounts</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">
    <style>
        /* Google-inspired Login Design */
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
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Roboto', Arial, sans-serif;
            background: white;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            color: var(--google-gray-800);
        }

        /* Google-style Header */
        .google-header {
            padding: 20px 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .google-logo {
            display: flex;
            align-items: center;
            gap: 8px;
            text-decoration: none;
        }

        .google-logo i {
            color: var(--google-blue);
            font-size: 28px;
        }

        .google-logo span {
            font-family: 'Google Sans', sans-serif;
            font-size: 22px;
            font-weight: 500;
            color: var(--google-gray-800);
        }

        .google-logo .logo-highlight {
            color: var(--google-blue);
        }

        .google-header-links {
            display: flex;
            gap: 24px;
            align-items: center;
        }

        .google-header-links a {
            color: var(--google-gray-600);
            text-decoration: none;
            font-size: 14px;
            font-weight: 500;
        }

        .google-header-links a:hover {
            color: var(--google-blue);
        }

        /* Main Login Container */
        .google-login-container {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
        }

        .google-login-card {
            max-width: 450px;
            width: 100%;
            background: white;
            border: 1px solid var(--google-gray-200);
            border-radius: 28px;
            padding: 48px 40px 36px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }

        /* Google-style Logo in Card */
        .google-card-logo {
            text-align: center;
            margin-bottom: 16px;
        }

        .google-card-logo i {
            font-size: 48px;
            color: var(--google-blue);
        }

        .google-card-logo h1 {
            font-family: 'Google Sans', sans-serif;
            font-size: 24px;
            font-weight: 400;
            color: var(--google-gray-800);
            margin: 16px 0 8px;
        }

        .google-card-logo p {
            color: var(--google-gray-600);
            font-size: 16px;
        }

        /* Form Elements */
        .google-form-group {
            margin-bottom: 24px;
        }

        .google-input-wrapper {
            position: relative;
            width: 100%;
        }

        .google-input-wrapper i {
            position: absolute;
            left: 16px;
            top: 50%;
            transform: translateY(-50%);
            color: var(--google-gray-600);
            font-size: 18px;
            pointer-events: none;
            z-index: 1;
        }

        .google-input {
            width: 100%;
            padding: 16px 16px 16px 48px;
            font-size: 16px;
            font-family: 'Roboto', sans-serif;
            border: 1px solid var(--google-gray-200);
            border-radius: 24px;
            outline: none;
            transition: border-color 0.2s, box-shadow 0.2s;
            background: white;
        }

        .google-input:hover {
            border-color: var(--google-gray-400);
        }

        .google-input:focus {
            border-color: var(--google-blue);
            box-shadow: 0 0 0 2px rgba(26,115,232,0.2);
        }

        .google-input.error {
            border-color: var(--google-red);
        }

        .google-input.error:focus {
            box-shadow: 0 0 0 2px rgba(217,48,37,0.2);
        }

        /* Password Input Specific */
        .google-password-wrapper {
            position: relative;
        }

        .google-password-toggle {
            position: absolute;
            right: 16px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            color: var(--google-gray-600);
            cursor: pointer;
            font-size: 18px;
            z-index: 2;
        }

        .google-password-toggle:hover {
            color: var(--google-blue);
        }

        /* Remember Me & Forgot Password */
        .google-form-options {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 32px;
        }

        .google-checkbox {
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            font-size: 14px;
            color: var(--google-gray-700);
        }

        .google-checkbox input[type="checkbox"] {
            width: 18px;
            height: 18px;
            cursor: pointer;
            accent-color: var(--google-blue);
        }

        .google-forgot-link {
            color: var(--google-blue);
            text-decoration: none;
            font-size: 14px;
            font-weight: 500;
        }

        .google-forgot-link:hover {
            text-decoration: underline;
        }

        /* Buttons */
        .google-button {
            width: 100%;
            padding: 14px 24px;
            font-size: 16px;
            font-weight: 500;
            font-family: 'Google Sans', sans-serif;
            border: none;
            border-radius: 24px;
            cursor: pointer;
            transition: background 0.2s, box-shadow 0.2s;
            margin-bottom: 16px;
        }

        .google-button-primary {
            background: var(--google-blue);
            color: white;
        }

        .google-button-primary:hover {
            background: var(--google-blue-dark);
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .google-button-primary:disabled {
            background: var(--google-gray-200);
            color: var(--google-gray-600);
            cursor: not-allowed;
        }

        /* Divider */
        .google-divider {
            display: flex;
            align-items: center;
            text-align: center;
            margin: 24px 0;
            color: var(--google-gray-600);
            font-size: 14px;
        }

        .google-divider::before,
        .google-divider::after {
            content: '';
            flex: 1;
            border-bottom: 1px solid var(--google-gray-200);
        }

        .google-divider span {
            margin: 0 16px;
        }

        /* Alternative Login */
        .google-alt-login {
            display: flex;
            justify-content: center;
            gap: 16px;
        }

        .google-alt-button {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 12px;
            background: white;
            border: 1px solid var(--google-gray-200);
            border-radius: 24px;
            text-decoration: none;
            color: var(--google-gray-700);
            font-size: 14px;
            font-weight: 500;
            transition: background 0.2s, border-color 0.2s;
        }

        .google-alt-button:hover {
            background: var(--google-gray-50);
            border-color: var(--google-gray-400);
        }

        .google-alt-button i {
            font-size: 18px;
            color: var(--google-gray-600);
        }

        /* Create Account Link */
        .google-create-account {
            text-align: center;
            margin-top: 24px;
            padding-top: 24px;
            border-top: 1px solid var(--google-gray-200);
        }

        .google-create-account p {
            color: var(--google-gray-600);
            font-size: 14px;
            margin-bottom: 8px;
        }

        .google-create-account a {
            color: var(--google-blue);
            text-decoration: none;
            font-weight: 500;
            font-size: 14px;
        }

        .google-create-account a:hover {
            text-decoration: underline;
        }

        /* Error Message */
        .google-error-message {
            background: #fce8e8;
            border: 1px solid var(--google-red);
            border-radius: 8px;
            padding: 12px 16px;
            margin-bottom: 24px;
            display: flex;
            align-items: center;
            gap: 12px;
            color: var(--google-red);
            font-size: 14px;
        }

        .google-error-message i {
            font-size: 18px;
        }

        /* Success Message */
        .google-success-message {
            background: #e6f4ea;
            border: 1px solid var(--google-green);
            border-radius: 8px;
            padding: 12px 16px;
            margin-bottom: 24px;
            display: flex;
            align-items: center;
            gap: 12px;
            color: var(--google-green);
            font-size: 14px;
        }

        /* Loading Spinner */
        .google-spinner {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 2px solid rgba(255,255,255,0.3);
            border-radius: 50%;
            border-top-color: white;
            animation: spin 0.8s linear infinite;
            margin-right: 8px;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        /* Rate Limit Notice */
        .google-rate-limit {
            background: #fef7e0;
            border: 1px solid var(--google-yellow);
            border-radius: 8px;
            padding: 12px 16px;
            margin-bottom: 24px;
            display: flex;
            align-items: center;
            gap: 12px;
            color: #b06000;
            font-size: 14px;
        }

        .google-rate-limit i {
            color: var(--google-yellow);
        }

        /* Footer */
        .google-footer {
            padding: 24px;
            text-align: center;
            border-top: 1px solid var(--google-gray-200);
            background: white;
        }

        .google-footer-links {
            display: flex;
            justify-content: center;
            gap: 24px;
            margin-bottom: 16px;
        }

        .google-footer-links a {
            color: var(--google-gray-600);
            text-decoration: none;
            font-size: 12px;
        }

        .google-footer-links a:hover {
            color: var(--google-blue);
        }

        .google-footer p {
            color: var(--google-gray-600);
            font-size: 12px;
        }

        /* Responsive */
        @media (max-width: 480px) {
            .google-login-card {
                padding: 32px 24px;
                border-radius: 24px;
            }

            .google-card-logo h1 {
                font-size: 22px;
            }

            .google-alt-login {
                flex-direction: column;
            }
        }

        /* Accessibility */
        .visually-hidden {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0,0,0,0);
            border: 0;
        }
    </style>
</head>
<body>
    <!-- Google-style Header -->
    <header class="google-header">
        <a href="../index.html" class="google-logo">
            <i class="fas fa-shield-alt"></i>
            <span>CyberShield<span class="logo-highlight">Pro</span></span>
        </a>
        
        <div class="google-header-links">
            <a href="help.html">Help</a>
            <a href="privacy-policy.html">Privacy</a>
            <a href="terms.html">Terms</a>
        </div>
    </header>

    <!-- Login Container -->
    <div class="google-login-container">
        <div class="google-login-card">
            <div class="google-card-logo">
                <i class="fas fa-shield-alt"></i>
                <h1>Sign in</h1>
                <p>Use your CyberShield Pro account</p>
            </div>

            <!-- Error Container (hidden by default) -->
            <div id="errorContainer" class="google-error-message" style="display: none;">
                <i class="fas fa-exclamation-circle"></i>
                <span id="errorMessage"></span>
            </div>

            <!-- Success Container (hidden by default) -->
            <div id="successContainer" class="google-success-message" style="display: none;">
                <i class="fas fa-check-circle"></i>
                <span id="successMessage"></span>
            </div>

            <!-- Rate Limit Container (hidden by default) -->
            <div id="rateLimitContainer" class="google-rate-limit" style="display: none;">
                <i class="fas fa-hourglass-half"></i>
                <span id="rateLimitMessage"></span>
            </div>

            <!-- Login Form -->
            <form id="loginForm" method="POST" action="/api/login.php">
                <!-- CSRF Token (will be set by PHP) -->
                <input type="hidden" name="csrf_token" id="csrfToken" value="">

                <div class="google-form-group">
                    <div class="google-input-wrapper">
                        <i class="fas fa-envelope"></i>
                        <input type="email" 
                               class="google-input" 
                               id="email" 
                               name="email" 
                               placeholder="Email address" 
                               autocomplete="username"
                               required>
                    </div>
                </div>

                <div class="google-form-group">
                    <div class="google-input-wrapper">
                        <i class="fas fa-lock"></i>
                        <input type="password" 
                               class="google-input" 
                               id="password" 
                               name="password" 
                               placeholder="Password" 
                               autocomplete="current-password"
                               required>
                        <button type="button" class="google-password-toggle" id="togglePassword" aria-label="Show password">
                            <i class="far fa-eye"></i>
                        </button>
                    </div>
                </div>

                <div class="google-form-options">
                    <label class="google-checkbox">
                        <input type="checkbox" name="remember_me" id="rememberMe">
                        <span>Stay signed in</span>
                    </label>
                    <a href="forgot-password.html" class="google-forgot-link">Forgot password?</a>
                </div>

                <button type="submit" class="google-button google-button-primary" id="submitButton">
                    <span id="buttonText">Sign in</span>
                    <span id="buttonSpinner" class="google-spinner" style="display: none;"></span>
                </button>

                <div class="google-divider">
                    <span>or</span>
                </div>

                <div class="google-alt-login">
                    <a href="#" class="google-alt-button" id="ssoLogin">
                        <i class="fas fa-building"></i>
                        Company SSO
                    </a>
                    <a href="#" class="google-alt-button" id="microsoftLogin">
                        <i class="fab fa-microsoft"></i>
                        Microsoft
                    </a>
                </div>

                <div class="google-create-account">
                    <p>Don't have an account?</p>
                    <a href="signup.html">Create account</a>
                </div>
            </form>
        </div>
    </div>

    <!-- Footer -->
    <footer class="google-footer">
        <div class="google-footer-links">
            <a href="../index.html">Home</a>
            <a href="about.html">About</a>
            <a href="privacy-policy.html">Privacy</a>
            <a href="terms.html">Terms</a>
            <a href="contact.html">Contact</a>
        </div>
        <p>&copy; 2024 CyberShield Pro, Inc. All rights reserved.</p>
    </footer>

    <script>
        // Google-style Login Page JavaScript
        document.addEventListener('DOMContentLoaded', function() {
            // Get form elements
            const form = document.getElementById('loginForm');
            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');
            const togglePassword = document.getElementById('togglePassword');
            const submitButton = document.getElementById('submitButton');
            const buttonText = document.getElementById('buttonText');
            const buttonSpinner = document.getElementById('buttonSpinner');
            const errorContainer = document.getElementById('errorContainer');
            const errorMessage = document.getElementById('errorMessage');
            const successContainer = document.getElementById('successContainer');
            const successMessage = document.getElementById('successMessage');
            const rateLimitContainer = document.getElementById('rateLimitContainer');
            const rateLimitMessage = document.getElementById('rateLimitMessage');

            // Password visibility toggle
            togglePassword.addEventListener('click', function() {
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);
                this.querySelector('i').classList.toggle('fa-eye');
                this.querySelector('i').classList.toggle('fa-eye-slash');
            });

            // Input validation styling
            emailInput.addEventListener('blur', function() {
                validateEmail(this);
            });

            passwordInput.addEventListener('blur', function() {
                validatePassword(this);
            });

            function validateEmail(input) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (input.value && !emailRegex.test(input.value)) {
                    input.classList.add('error');
                    showError('Please enter a valid email address');
                } else {
                    input.classList.remove('error');
                    hideError();
                }
            }

            function validatePassword(input) {
                if (input.value && input.value.length < 8) {
                    input.classList.add('error');
                    showError('Password must be at least 8 characters');
                } else {
                    input.classList.remove('error');
                    hideError();
                }
            }

            // Form submission
            form.addEventListener('submit', async function(e) {
                e.preventDefault();

                // Validate form
                if (!validateForm()) {
                    return;
                }

                // Show loading state
                setLoading(true);
                hideAllMessages();

                // Get form data
                const formData = new FormData(form);
                
                // Add CSRF token (in production, this would be generated server-side)
                const csrfToken = document.getElementById('csrfToken').value || generateCSRFToken();
                formData.set('csrf_token', csrfToken);

                try {
                    const response = await fetch(form.action, {
                        method: 'POST',
                        body: formData
                    });

                    const data = await response.json();

                    if (response.status === 429) {
                        // Rate limit error
                        showRateLimit(data.message || 'Too many login attempts. Please try again later.');
                    } else if (response.status === 423) {
                        // Account locked
                        showError(data.message || 'Account is temporarily locked');
                    } else if (response.status === 403) {
                        // CSRF or inactive account
                        showError(data.message || 'Security validation failed');
                    } else if (response.status === 401) {
                        // Invalid credentials
                        showError(data.message || 'Invalid email or password');
                        // Shake animation for visual feedback
                        form.classList.add('shake');
                        setTimeout(() => form.classList.remove('shake'), 500);
                    } else if (response.status === 400) {
                        // Validation error
                        showError(data.message || 'Please check your input');
                    } else if (!response.ok) {
                        // Other errors
                        showError(data.message || 'An error occurred. Please try again.');
                    } else if (data.success) {
                        // Success - show message and redirect
                        showSuccess(data.message || 'Login successful! Redirecting...');
                        
                        // Store user data in sessionStorage (optional)
                        if (data.user) {
                            sessionStorage.setItem('user', JSON.stringify(data.user));
                        }

                        // Redirect after delay
                        setTimeout(() => {
                            window.location.href = data.redirect || '/dashboard.php';
                        }, 1000);
                        
                        return; // Don't hide loading yet
                    }

                } catch (error) {
                    console.error('Login error:', error);
                    showError('Network error. Please check your connection.');
                }

                setLoading(false);
            });

            // Form validation
            function validateForm() {
                let isValid = true;

                if (!emailInput.value) {
                    emailInput.classList.add('error');
                    showError('Email is required');
                    isValid = false;
                } else if (!isValidEmail(emailInput.value)) {
                    emailInput.classList.add('error');
                    showError('Please enter a valid email address');
                    isValid = false;
                } else {
                    emailInput.classList.remove('error');
                }

                if (!passwordInput.value) {
                    passwordInput.classList.add('error');
                    showError('Password is required');
                    isValid = false;
                } else if (passwordInput.value.length < 8) {
                    passwordInput.classList.add('error');
                    showError('Password must be at least 8 characters');
                    isValid = false;
                } else {
                    passwordInput.classList.remove('error');
                }

                return isValid;
            }

            function isValidEmail(email) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
            }

            // UI helper functions
            function setLoading(isLoading) {
                if (isLoading) {
                    submitButton.disabled = true;
                    buttonText.style.display = 'none';
                    buttonSpinner.style.display = 'inline-block';
                } else {
                    submitButton.disabled = false;
                    buttonText.style.display = 'inline';
                    buttonSpinner.style.display = 'none';
                }
            }

            function showError(message) {
                errorMessage.textContent = message;
                errorContainer.style.display = 'flex';
                successContainer.style.display = 'none';
                rateLimitContainer.style.display = 'none';
            }

            function showSuccess(message) {
                successMessage.textContent = message;
                successContainer.style.display = 'flex';
                errorContainer.style.display = 'none';
                rateLimitContainer.style.display = 'none';
            }

            function showRateLimit(message) {
                rateLimitMessage.textContent = message;
                rateLimitContainer.style.display = 'flex';
                errorContainer.style.display = 'none';
                successContainer.style.display = 'none';
            }

            function hideAllMessages() {
                errorContainer.style.display = 'none';
                successContainer.style.display = 'none';
                rateLimitContainer.style.display = 'none';
            }

            function hideError() {
                errorContainer.style.display = 'none';
            }

            // Generate CSRF token (demo only - in production, use server-side)
            function generateCSRFToken() {
                return Math.random().toString(36).substring(2) + Date.now().toString(36);
            }

            // Check for URL parameters (e.g., after logout)
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('loggedout') === 'true') {
                showSuccess('You have been signed out successfully');
            }
            if (urlParams.get('expired') === 'true') {
                showError('Your session has expired. Please sign in again');
            }

            // Auto-focus email field
            emailInput.focus();

            // Add shake animation style
            const style = document.createElement('style');
            style.textContent = `
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                    20%, 40%, 60%, 80% { transform: translateX(5px); }
                }
                .shake {
                    animation: shake 0.5s ease-in-out;
                }
            `;
            document.head.appendChild(style);

            // SSO Login handler
            document.getElementById('ssoLogin').addEventListener('click', function(e) {
                e.preventDefault();
                showSuccess('Redirecting to company SSO...');
                setTimeout(() => {
                    window.location.href = '/sso/login.php';
                }, 1000);
            });

            // Microsoft Login handler
            document.getElementById('microsoftLogin').addEventListener('click', function(e) {
                e.preventDefault();
                showSuccess('Redirecting to Microsoft login...');
                setTimeout(() => {
                    window.location.href = '/oauth/microsoft.php';
                }, 1000);
            });
        });
    </script>

    <?php
    // PHP Backend (this would normally be in a separate file)
    // For demonstration purposes only - actual implementation would be in login.php
    
    /*
    session_start();
    require_once 'config.php';

    header('Content-Type: application/json');

    // Rate limiting for login attempts
    $ip_address = $_SERVER['REMOTE_ADDR'];
    $rate_limit_key = "login_attempts_$ip_address";

    if (!check_rate_limit($rate_limit_key, 5, 300)) { // 5 attempts per 5 minutes
        http_response_code(429);
        echo json_encode([
            'success' => false,
            'message' => 'Too many login attempts. Please try again later.'
        ]);
        exit();
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Validate CSRF token
        if (!isset($_POST['csrf_token']) || !validate_csrf_token($_POST['csrf_token'])) {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'message' => 'Security validation failed'
            ]);
            exit();
        }

        // Get and sanitize input
        $email = filter_var($_POST['email'], FILTER_SANITIZE_EMAIL);
        $password = $_POST['password'];
        $remember_me = isset($_POST['remember_me']);

        // Validate input
        if (empty($email) || empty($password)) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Please enter email and password'
            ]);
            exit();
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid email format'
            ]);
            exit();
        }

        // Database connection and authentication logic here
        // ... (rest of your PHP login logic)
        
        // For demo, return success
        echo json_encode([
            'success' => true,
            'message' => 'Login successful!',
            'user' => [
                'id' => 1,
                'username' => 'john_doe',
                'email' => $email,
                'full_name' => 'John Doe',
                'role' => 'user'
            ],
            'redirect' => '/dashboard.php'
        ]);
    }
    */
    ?>
</body>
</html>