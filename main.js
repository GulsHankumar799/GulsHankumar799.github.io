// script.js
// Navigation toggle
const hamburger = document.querySelector(".hamburger");
const navMenu = document.querySelector(".nav-menu");

hamburger.addEventListener("click", () => {
    hamburger.classList.toggle("active");
    navMenu.classList.toggle("active");
});

document.querySelectorAll(".nav-link").forEach(n => n.addEventListener("click", () => {
    hamburger.classList.remove("active");
    navMenu.classList.remove("active");
}));

// Scroll to section function
function scrollToSection(sectionId) {
    document.getElementById(sectionId).scrollIntoView({ behavior: 'smooth' });
}

// Password strength checker
const passwordInput = document.getElementById('password-input');
const strengthBar = document.querySelector('.strength-bar');
const strengthText = document.getElementById('strength-value');

passwordInput.addEventListener('input', checkPasswordStrength);

function checkPasswordStrength() {
    const password = passwordInput.value;
    let strength = 0;
    
    // Check password length
    if (password.length > 7) strength += 20;
    
    // Check for mixed case
    if (password.match(/([a-z].*[A-Z])|([A-Z].*[a-z])/)) strength += 20;
    
    // Check for numbers
    if (password.match(/([0-9])/)) strength += 20;
    
    // Check for special characters
    if (password.match(/([!,@,#,$,%,^,&,*,?,_,~])/)) strength += 20;
    
    // Check for consecutive characters
    if (!password.match(/(.)\1\1/)) strength += 20;
    
    // Update strength bar and text
    strengthBar.style.width = strength + '%';
    
    if (strength < 40) {
        strengthBar.style.backgroundColor = '#e74c3c';
        strengthText.textContent = 'Weak';
    } else if (strength < 80) {
        strengthBar.style.backgroundColor = '#f39c12';
        strengthText.textContent = 'Medium';
    } else {
        strengthBar.style.backgroundColor = '#2ecc71';
        strengthText.textContent = 'Strong';
    }
}

// Threat detail modal
function showThreatDetail(threatType) {
    const modal = document.getElementById('threat-modal');
    const modalBody = document.getElementById('modal-body');
    
    let content = '';
    
    switch(threatType) {
        case 'phishing':
            content = `
                <h2>Phishing Attacks</h2>
                <p>Phishing is a cybercrime in which targets are contacted by email, telephone, or text message by someone posing as a legitimate institution to lure individuals into providing sensitive data.</p>
                <h3>How to recognize phishing:</h3>
                <ul>
                    <li>Urgent or threatening language</li>
                    <li>Requests for personal information</li>
                    <li>Unexpected emails</li>
                    <li>Spelling and grammar mistakes</li>
                    <li>Suspicious links or attachments</li>
                </ul>
                <h3>Protection measures:</h3>
                <ul>
                    <li>Verify the sender's email address</li>
                    <li>Don't click on suspicious links</li>
                    <li>Use multi-factor authentication</li>
                    <li>Keep your software updated</li>
                </ul>
            `;
            break;
        case 'ransomware':
            content = `
                <h2>Ransomware</h2>
                <p>Ransomware is a type of malicious software designed to block access to a computer system until a sum of money is paid.</p>
                <h3>How it works:</h3>
                <ul>
                    <li>Typically spreads through phishing emails or malicious advertisements</li>
                    <li>Encrypts files on the infected system</li>
                    <li>Demands payment (usually in cryptocurrency) for decryption key</li>
                </ul>
                <h3>Protection measures:</h3>
                <ul>
                    <li>Regularly back up your data</li>
                    <li>Be cautious with email attachments and links</li>
                    <li>Use reputable security software</li>
                    <li>Keep all systems and software updated</li>
                </ul>
            `;
            break;
        case 'identity-theft':
            content = `
                <h2>Identity Theft</h2>
                <p>Identity theft occurs when someone uses another person's personal identifying information to commit fraud or other crimes.</p>
                <h3>Common methods:</h3>
                <ul>
                    <li>Data breaches</li>
                    <li>Phishing scams</li>
                    <li>Stealing mail or wallets</li>
                    <li>Skimming credit card information</li>
                </ul>
                <h3>Protection measures:</h3>
                <ul>
                    <li>Shred sensitive documents</li>
                    <li>Monitor financial accounts regularly</li>
                    <li>Use strong, unique passwords</li>
                    <li>Freeze your credit if necessary</li>
                </ul>
            `;
            break;
        case 'credit-fraud':
            content = `
                <h2>Credit Card Fraud</h2>
                <p>Credit card fraud involves the unauthorized use of a credit or debit card to make purchases or withdraw funds.</p>
                <h3>Common types:</h3>
                <ul>
                    <li>Card-not-present fraud (online transactions)</li>
                    <li>Counterfeit card fraud</li>
                    <li>Lost or stolen card fraud</li>
                    <li>Identity theft-based fraud</li>
                </ul>
                <h3>Protection measures:</h3>
                <ul>
                    <li>Regularly review statements</li>
                    <li>Set up transaction alerts</li>
                    <li>Use virtual card numbers for online shopping</li>
                    <li>Only shop on secure websites (look for HTTPS)</li>
                </ul>
            `;
            break;
    }
    
    modalBody.innerHTML = content;
    modal.style.display = 'block';
}

function closeModal() {
    document.getElementById('threat-modal').style.display = 'none';
}

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    const modal = document.getElementById('threat-modal');
    if (event.target === modal) {
        closeModal();
    }
});

// Quiz functionality
function startQuiz() {
    alert('Quiz feature would be implemented here with multiple questions about identifying phishing attempts and other security scenarios.');
}

// Add scroll animation
window.addEventListener('scroll', revealElements);

function revealElements() {
    const elements = document.querySelectorAll('.threat-card, .tool-card, .tip, .resource-card');
    
    elements.forEach(element => {
        const windowHeight = window.innerHeight;
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 150;
        
        if (elementTop < windowHeight - elementVisible) {
            element.style.opacity = 1;
            element.style.transform = 'translateY(0)';
        }
    });
}

// Initialize elements for reveal animation
document.addEventListener('DOMContentLoaded', function() {
    const elements = document.querySelectorAll('.threat-card, .tool-card, .tip, .resource-card');
    
    elements.forEach(element => {
        element.style.opacity = 0;
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    });
    
    // Trigger initial reveal
    setTimeout(revealElements, 100);
});