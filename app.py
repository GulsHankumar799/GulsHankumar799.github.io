from flask import Flask, request, jsonify
from flask_mail import Mail, Message
import os
import logging
import ssl
from datetime import datetime
from typing import Dict, Optional, Tuple

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Email configuration with enhanced settings
app.config['MAIL_SERVER'] = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
app.config['MAIL_PORT'] = int(os.environ.get('MAIL_PORT', 587))
app.config['MAIL_USE_TLS'] = os.environ.get('MAIL_USE_TLS', 'True').lower() == 'true'
app.config['MAIL_USE_SSL'] = os.environ.get('MAIL_USE_SSL', 'False').lower() == 'true'
app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME', '')
app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD', '')
app.config['MAIL_DEFAULT_SENDER'] = os.environ.get('MAIL_DEFAULT_SENDER', '')
app.config['MAIL_MAX_EMAILS'] = int(os.environ.get('MAIL_MAX_EMAILS', 10))
app.config['MAIL_ASCII_ATTACHMENTS'] = os.environ.get('MAIL_ASCII_ATTACHMENTS', 'False').lower() == 'true'

# Additional configuration for better compatibility
app.config['MAIL_SUPPRESS_SEND'] = os.environ.get('MAIL_SUPPRESS_SEND', 'False').lower() == 'true'
app.config['MAIL_DEBUG'] = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'

mail = Mail(app)

# Email templates for different notification types
EMAIL_TEMPLATES = {
    'newsletter': {
        'subject': 'Welcome to our Newsletter!',
        'body': '''Hello {name},

Thank you for subscribing to our newsletter! You'll now receive updates about our latest products and services.

If you did not request this subscription, please ignore this email.

Best regards,
CyberGuard Shield Team'''
    },
    'signup': {
        'subject': 'Welcome to CyberGuard Shield!',
        'body': '''Hello {name},

Welcome to CyberGuard Shield! Your account has been successfully created.

To get started, please explore our services and don't hesitate to contact us if you have any questions.

Best regards,
CyberGuard Shield Team'''
    },
    'login': {
        'subject': 'New Login to Your Account',
        'body': '''Hello {name},

We noticed a new login to your CyberGuard Shield account on {time}.

If this was you, no action is needed. If you don't recognize this activity, please secure your account immediately.

Best regards,
CyberGuard Shield Team'''
    },
    'custom': {
        'subject': '{subject}',
        'body': '''Hello {name},

{body}

Best regards,
CyberGuard Shield Team'''
    }
}

def format_email_body(template_type: str, name: str, **kwargs) -> Tuple[str, str]:
    """Format email subject and body based on template type and variables"""
    if template_type not in EMAIL_TEMPLATES:
        raise ValueError(f"Unknown template type: {template_type}")
    
    template = EMAIL_TEMPLATES[template_type]
    
    # Prepare variables for formatting
    format_vars = {'name': name}
    format_vars.update(kwargs)
    
    # Add current time if not provided
    if 'time' not in format_vars:
        format_vars['time'] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    # Format subject and body
    subject = template['subject'].format(**format_vars)
    body = template['body'].format(**format_vars)
    
    return subject, body

@app.route('/api/send-notification', methods=['POST'])
def send_notification():
    """Send email notification with improved error handling and logging"""
    data = request.get_json(silent=True) or {}
    
    # Validate required fields
    if not data or 'email' not in data:
        logger.warning("Missing email in request")
        return jsonify({'success': False, 'message': 'Email address is required'}), 400
    
    recipient = data.get('email')
    template_type = data.get('type', 'custom')
    name = data.get('name', 'Valued Customer')
    
    try:
        # Format email based on template
        subject, body = format_email_body(
            template_type, 
            name, 
            subject=data.get('subject', 'Notification from CyberGuard Shield'),
            body=data.get('body', 'You have a new notification from CyberGuard Shield.'),
            time=data.get('time')
        )
        
        # Create and send message
        msg = Message(
            subject=subject,
            recipients=[recipient],
            extra_headers={'X-Mailer': 'CyberGuard-Shield-Notification-System'}
        )
        msg.body = body
        
        # Add HTML version if available
        if data.get('html_body'):
            msg.html = data.get('html_body')
        
        mail.send(msg)
        
        logger.info(f"Notification sent successfully to {recipient} (type: {template_type})")
        return jsonify({
            'success': True, 
            'message': 'Notification sent successfully',
            'recipient': recipient,
            'type': template_type
        })
        
    except ValueError as e:
        logger.error(f"Template error: {str(e)}")
        return jsonify({'success': False, 'message': f'Invalid template type: {template_type}'}), 400
    except Exception as e:
        logger.error(f"Failed to send notification to {recipient}: {str(e)}")
        return jsonify({'success': False, 'message': f'Failed to send notification: {str(e)}'}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Endpoint to check if the email service is working"""
    try:
        # Try to connect to the mail server
        with app.app_context():
            with mail.connect() as conn:
                if conn:
                    return jsonify({
                        'success': True, 
                        'message': 'Email service is operational',
                        'timestamp': datetime.now().isoformat()
                    })
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return jsonify({
            'success': False, 
            'message': f'Email service connection failed: {str(e)}'
        }), 500

@app.route('/')
def index():
    return jsonify({
        'message': 'CyberGuard Shield Notification Service',
        'status': 'operational',
        'endpoints': {
            'send_notification': '/api/send-notification (POST)',
            'health_check': '/api/health (GET)'
        }
    })

if __name__ == '__main__':
    # Validate required environment variables
    if not app.config['MAIL_PASSWORD']:
        logger.error("MAIL_PASSWORD environment variable is not set")
        logger.info("Please set MAIL_PASSWORD environment variable with your email app password")
    
    # Run the application
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    
    app.run(host='0.0.0.0', port=port, debug=debug)