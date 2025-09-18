# app.py
from flask import Flask, request, jsonify
from flask_mail import Mail, Message
import os

app = Flask(__name__)

# Email configuration
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'cyberguardshield@gmail.com'
app.config['MAIL_PASSWORD'] = os.environ.get('EMAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = 'cyberguardshield@gmail.com'

mail = Mail(app)

@app.route('/api/send-notification', methods=['POST'])
def send_notification():
    data = request.json
    recipient = data.get('email')
    subject = data.get('subject')
    body = data.get('body')
    
    try:
        msg = Message(subject, recipients=[recipient])
        msg.body = body
        mail.send(msg)
        return jsonify({'success': True, 'message': 'Notification sent successfully'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

if __name__ == '__main__':
    app.run(debug=True)