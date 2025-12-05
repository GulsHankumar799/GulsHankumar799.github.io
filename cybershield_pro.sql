-- cybershield_pro.sql - Database schema

CREATE DATABASE IF NOT EXISTS cybershield_pro;
USE cybershield_pro;

-- Users table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role ENUM('admin', 'manager', 'user') DEFAULT 'user',
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    last_login TIMESTAMP NULL,
    login_attempts INT DEFAULT 0,
    locked_until TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_status (status)
);

-- Contact submissions table
CREATE TABLE contact_submissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    company VARCHAR(100),
    service VARCHAR(50),
    message TEXT NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    status ENUM('new', 'read', 'replied', 'archived') DEFAULT 'new',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    replied_at TIMESTAMP NULL,
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_email (email)
);

-- Newsletter subscribers table
CREATE TABLE newsletter_subscribers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(100) UNIQUE NOT NULL,
    token VARCHAR(64) UNIQUE NOT NULL,
    status ENUM('pending', 'active', 'unsubscribed') DEFAULT 'pending',
    subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP NULL,
    unsubscribed_at TIMESTAMP NULL,
    ip_address VARCHAR(45),
    source VARCHAR(50),
    INDEX idx_status (status),
    INDEX idx_email (email)
);

-- Job applications table
CREATE TABLE job_applications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    job_id INT NOT NULL,
    job_title VARCHAR(100) NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    linkedin_url VARCHAR(255),
    github_url VARCHAR(255),
    portfolio_url VARCHAR(255),
    cover_letter TEXT,
    resume_path VARCHAR(255) NOT NULL,
    source VARCHAR(50),
    ip_address VARCHAR(45),
    user_agent TEXT,
    status ENUM('pending', 'reviewed', 'shortlisted', 'rejected', 'hired') DEFAULT 'pending',
    notes TEXT,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    INDEX idx_job_id (job_id),
    INDEX idx_status (status),
    INDEX idx_email (email),
    INDEX idx_applied_at (applied_at)
);

-- Job postings table
CREATE TABLE job_postings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(100) NOT NULL,
    department VARCHAR(50) NOT NULL,
    location VARCHAR(100) NOT NULL,
    employment_type ENUM('full-time', 'part-time', 'contract', 'internship') DEFAULT 'full-time',
    salary_range VARCHAR(50),
    description TEXT NOT NULL,
    requirements TEXT NOT NULL,
    benefits TEXT,
    status ENUM('draft', 'published', 'closed', 'archived') DEFAULT 'draft',
    views INT DEFAULT 0,
    applications INT DEFAULT 0,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP NULL,
    closed_at TIMESTAMP NULL,
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_status (status),
    INDEX idx_department (department),
    INDEX idx_published_at (published_at)
);

-- Activity logs table
CREATE TABLE activity_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
);

-- File uploads table
CREATE TABLE file_uploads (
    id INT PRIMARY KEY AUTO_INCREMENT,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50),
    file_size BIGINT,
    upload_path VARCHAR(500) NOT NULL,
    uploaded_by INT,
    purpose VARCHAR(100),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES users(id),
    INDEX idx_uploaded_at (uploaded_at),
    INDEX idx_purpose (purpose)
);

-- Security logs table
CREATE TABLE security_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    event_type ENUM('login_attempt', 'failed_login', 'password_change', 'suspicious_activity', 'file_upload', 'form_submission') NOT NULL,
    details TEXT,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'low',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_event_type (event_type),
    INDEX idx_ip_address (ip_address),
    INDEX idx_severity (severity),
    INDEX idx_created_at (created_at)
);

-- API keys table
CREATE TABLE api_keys (
    id INT PRIMARY KEY AUTO_INCREMENT,
    key_value VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    user_id INT,
    permissions TEXT,
    last_used TIMESTAMP NULL,
    status ENUM('active', 'inactive', 'revoked') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_key_value (key_value),
    INDEX idx_status (status)
);

-- Create default admin user (password: Admin@123)
INSERT INTO users (username, email, password_hash, full_name, role, status) 
VALUES ('admin', 'admin@cybershieldpro.com', '$2y$12$YourHashedPasswordHere', 'System Administrator', 'admin', 'active');

-- Create indexes for better performance
CREATE INDEX idx_contact_email_status ON contact_submissions(email, status);
CREATE INDEX idx_job_applications_status_date ON job_applications(status, applied_at);
CREATE INDEX idx_newsletter_status_date ON newsletter_subscribers(status, subscribed_at);