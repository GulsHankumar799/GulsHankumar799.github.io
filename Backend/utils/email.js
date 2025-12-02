const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/**
 * Send welcome email to new user
 */
const sendWelcomeEmail = async (user) => {
  try {
    const mailOptions = {
      from: `"CyberShield Pro" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Welcome to CyberShield Pro - Your Account is Ready!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #00f3ff, #b967ff); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { background: linear-gradient(135deg, #00f3ff, #b967ff); color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; }
            .security-tip { background: #e8f4fd; border-left: 4px solid #00f3ff; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚀 Welcome to CyberShield Pro</h1>
              <p>Advanced Cybersecurity Platform</p>
            </div>
            <div class="content">
              <h2>Hello ${user.name},</h2>
              <p>Welcome to CyberShield Pro! Your account has been successfully created.</p>
              
              <div class="security-tip">
                <h3>🔒 Security Tip:</h3>
                <p>Enable two-factor authentication for added security in your account settings.</p>
              </div>
              
              <p><strong>Account Details:</strong></p>
              <ul>
                <li><strong>Name:</strong> ${user.name}</li>
                <li><strong>Email:</strong> ${user.email}</li>
                <li><strong>Role:</strong> ${user.role}</li>
                <li><strong>Joined:</strong> ${new Date(user.createdAt).toLocaleDateString()}</li>
              </ul>
              
              <p>Start exploring our security tools:</p>
              <a href="https://gulshankumar799.github.io" class="button">Go to Dashboard</a>
              
              <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                <small>
                  Need help? Contact our security team at security@cybershieldpro.com<br>
                  This is an automated message. Please do not reply.
                </small>
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to ${user.email}`);
  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
  }
};

/**
 * Send contact form notification
 */
const sendContactNotification = async (contactData) => {
  try {
    const mailOptions = {
      from: `"CyberShield Pro Contact" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: `New Contact Form Submission: ${contactData.service}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #00f3ff, #b967ff); padding: 20px; text-align: center; color: white; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 25px; border-radius: 0 0 10px 10px; }
            .alert { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; margin: 15px 0; border-radius: 5px; }
            .info-box { background: #e8f4fd; padding: 15px; margin: 15px 0; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>📧 New Contact Request</h2>
              <p>Priority: ${contactData.priority.toUpperCase()}</p>
            </div>
            <div class="content">
              <div class="alert">
                <strong>⚠️ Action Required:</strong> New contact form submission needs review.
              </div>
              
              <div class="info-box">
                <h3>Contact Details:</h3>
                <p><strong>Name:</strong> ${contactData.name}</p>
                <p><strong>Email:</strong> ${contactData.email}</p>
                <p><strong>Company:</strong> ${contactData.company || 'Not provided'}</p>
                <p><strong>Phone:</strong> ${contactData.phone || 'Not provided'}</p>
                <p><strong>Service:</strong> ${contactData.service}</p>
                <p><strong>Priority:</strong> ${contactData.priority}</p>
                <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
              </div>
              
              <h3>Message:</h3>
              <p style="white-space: pre-wrap; background: white; padding: 15px; border-radius: 5px; border: 1px solid #ddd;">
                ${contactData.message}
              </p>
              
              <h3>Technical Details:</h3>
              <ul>
                <li><strong>IP Address:</strong> ${contactData.ipAddress || 'Not available'}</li>
                <li><strong>User Agent:</strong> ${contactData.userAgent || 'Not available'}</li>
                <li><strong>Source:</strong> ${contactData.source || 'website'}</li>
              </ul>
              
              <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                <small>
                  <strong>Next Steps:</strong><br>
                  1. Review the request within 24 hours<br>
                  2. Assign to appropriate team member<br>
                  3. Update status in dashboard
                </small>
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Contact notification sent for ${contactData.email}`);
  } catch (error) {
    console.error('❌ Error sending contact notification:', error);
  }
};

/**
 * Send password reset email
 */
const sendPasswordResetEmail = async (user, resetToken) => {
  try {
    const resetUrl = `https://gulshankumar799.github.io/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: `"CyberShield Pro Security" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: '🔐 Password Reset Request - CyberShield Pro',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ff2a6d, #b967ff); padding: 25px; text-align: center; color: white; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 25px; border-radius: 0 0 10px 10px; }
            .warning { background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; margin: 15px 0; border-radius: 5px; }
            .button { background: linear-gradient(135deg, #00f3ff, #b967ff); color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; }
            .token { background: #f8f9fa; padding: 10px; border-radius: 5px; font-family: monospace; word-break: break-all; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset Request</h1>
              <p>CyberShield Pro Security Team</p>
            </div>
            <div class="content">
              <div class="warning">
                <strong>⚠️ Security Alert:</strong> Password reset requested for your account.
              </div>
              
              <p>Hello ${user.name},</p>
              
              <p>We received a request to reset your password for the CyberShield Pro account associated with <strong>${user.email}</strong>.</p>
              
              <p style="text-align: center; margin: 25px 0;">
                <a href="${resetUrl}" class="button">Reset My Password</a>
              </p>
              
              <p><strong>Or copy this link:</strong></p>
              <div class="token">${resetUrl}</div>
              
              <p><strong>Important Security Notes:</strong></p>
              <ul>
                <li>This link will expire in 1 hour</li>
                <li>If you didn't request this, please ignore this email</li>
                <li>Your password will not change until you click the link</li>
                <li>For security, this link can only be used once</li>
              </ul>
              
              <div class="warning">
                <strong>🔒 Security Tip:</strong> Never share your password or this link with anyone. CyberShield Pro team will never ask for your password.
              </div>
              
              <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                <small>
                  Need help? Contact our security team immediately at security@cybershieldpro.com<br>
                  This is an automated security message. Please do not reply.
                </small>
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent to ${user.email}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    return false;
  }
};

/**
 * Send threat alert email
 */
const sendThreatAlertEmail = async (threat, assignedUser) => {
  try {
    const mailOptions = {
      from: `"CyberShield Pro SOC" <${process.env.EMAIL_USER}>`,
      to: assignedUser.email,
      subject: `🚨 THREAT ALERT: ${threat.severity.toUpperCase()} - ${threat.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .critical { background: linear-gradient(135deg, #ff2a6d, #ff6b6b); color: white; }
            .high { background: linear-gradient(135deg, #ff9f43, #ffcc00); color: white; }
            .medium { background: linear-gradient(135deg, #00f3ff, #4ecdc4); color: white; }
            .low { background: linear-gradient(135deg, #00ff95, #00cc76); color: white; }
            .content { background: #f9f9f9; padding: 25px; border-radius: 0 0 10px 10px; }
            .severity-badge { display: inline-block; padding: 5px 10px; border-radius: 20px; font-weight: bold; margin: 5px; }
            .button { background: #333; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header ${threat.severity}">
              <h1>🚨 ${threat.severity.toUpperCase()} THREAT ALERT</h1>
              <p>Security Operations Center Notification</p>
            </div>
            <div class="content">
              <p><strong>Hello ${assignedUser.name},</strong></p>
              <p>A new security threat has been detected and assigned to you.</p>
              
              <h2>${threat.title}</h2>
              
              <p><strong>Description:</strong> ${threat.description}</p>
              
              <div style="background: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <p><strong>📊 Threat Details:</strong></p>
                <table width="100%" style="border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Type:</strong></td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${threat.type}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Severity:</strong></td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">
                      <span class="severity-badge" style="background: ${threat.severity === 'critical' ? '#ff2a6d' : threat.severity === 'high' ? '#ff9f43' : threat.severity === 'medium' ? '#00f3ff' : '#00ff95'}; color: white;">
                        ${threat.severity.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Status:</strong></td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${threat.status}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Detected:</strong></td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${new Date(threat.detectedAt).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Impact Score:</strong></td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${threat.impactScore}/10</td>
                  </tr>
                  ${threat.sourceCountry ? `
                  <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Source Country:</strong></td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${threat.sourceCountry}</td>
                  </tr>
                  ` : ''}
                </table>
              </div>
              
              <p><strong>🔍 Required Actions:</strong></p>
              <ol>
                <li>Review threat details immediately</li>
                <li>Investigate and gather evidence</li>
                <li>Implement containment measures</li>
                <li>Update threat status</li>
                <li>Document mitigation steps</li>
              </ol>
              
              <p style="text-align: center; margin: 25px 0;">
                <a href="https://gulshankumar799.github.io/#threat-dashboard" class="button">View in Dashboard</a>
              </p>
              
              <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                <small>
                  <strong>⚠️ URGENT:</strong> ${threat.severity === 'critical' ? 'Respond within 1 hour' : threat.severity === 'high' ? 'Respond within 4 hours' : threat.severity === 'medium' ? 'Respond within 24 hours' : 'Respond within 48 hours'}<br>
                  This is an automated alert from CyberShield Pro Security Operations Center.
                </small>
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Threat alert sent to ${assignedUser.email}`);
  } catch (error) {
    console.error('❌ Error sending threat alert:', error);
  }
};

/**
 * Verify email configuration
 */
const verifyEmailConfig = async () => {
  try {
    await transporter.verify();
    console.log('✅ Email server is ready to send messages');
    return true;
  } catch (error) {
    console.error('❌ Email server configuration error:', error);
    return false;
  }
};

module.exports = {
  sendWelcomeEmail,
  sendContactNotification,
  sendPasswordResetEmail,
  sendThreatAlertEmail,
  verifyEmailConfig,
  transporter
};