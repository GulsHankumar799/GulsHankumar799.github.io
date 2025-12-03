// ============================================
// PAGES JAVASCRIPT - CyberShield Pro
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    
    // ===== SERVICE TABS =====
    const serviceTabs = document.querySelectorAll('.service-tab');
    const serviceDetails = document.querySelectorAll('.service-detail');
    
    if (serviceTabs.length > 0) {
        serviceTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                const serviceId = this.getAttribute('data-service');
                
                // Update active tab
                serviceTabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                
                // Show corresponding service detail
                serviceDetails.forEach(detail => {
                    detail.style.display = 'none';
                    if (detail.id === `${serviceId}-detail`) {
                        detail.style.display = 'block';
                    }
                });
            });
        });
    }
    
    // ===== PRICING TOGGLE =====
    const pricingToggle = document.getElementById('pricingToggle');
    const monthlyPrices = document.querySelectorAll('.monthly-price');
    const yearlyPrices = document.querySelectorAll('.yearly-price');
    const periodLabels = document.querySelectorAll('.toggle-period');
    
    if (pricingToggle) {
        pricingToggle.addEventListener('change', function() {
            const isYearly = this.checked;
            
            // Toggle period labels
            periodLabels.forEach(label => {
                label.classList.toggle('active', 
                    (isYearly && label.classList.contains('yearly')) ||
                    (!isYearly && label.classList.contains('monthly'))
                );
            });
            
            // Toggle prices
            monthlyPrices.forEach(price => {
                price.style.display = isYearly ? 'none' : 'block';
            });
            
            yearlyPrices.forEach(price => {
                price.style.display = isYearly ? 'block' : 'none';
            });
        });
    }
    
    // ===== CASE STUDY FILTERS =====
    const filterButtons = document.querySelectorAll('.filter-btn');
    const caseStudyCards = document.querySelectorAll('.case-study-card');
    
    if (filterButtons.length > 0) {
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                const filter = this.getAttribute('data-filter');
                
                // Update active filter
                filterButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                // Filter case studies
                caseStudyCards.forEach(card => {
                    const category = card.getAttribute('data-category');
                    
                    if (filter === 'all' || filter === category) {
                        card.style.display = 'block';
                        setTimeout(() => {
                            card.style.opacity = '1';
                            card.style.transform = 'translateY(0)';
                        }, 10);
                    } else {
                        card.style.opacity = '0';
                        card.style.transform = 'translateY(20px)';
                        setTimeout(() => {
                            card.style.display = 'none';
                        }, 300);
                    }
                });
            });
        });
    }
    
    // ===== RESOURCE DOWNLOADS =====
    const downloadButtons = document.querySelectorAll('.download-btn');
    
    downloadButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            if (this.getAttribute('href') === '#') {
                e.preventDefault();
                
                // Show download confirmation
                const resourceName = this.getAttribute('data-resource');
                showNotification(`Downloading "${resourceName}"...`, 'info');
                
                // Simulate download
                setTimeout(() => {
                    showNotification('Download complete!', 'success');
                }, 1500);
            }
        });
    });
    
    // ===== JOB FILTERS =====
    const jobFilters = document.querySelectorAll('.job-filter');
    const jobListings = document.querySelectorAll('.job-listing');
    
    if (jobFilters.length > 0) {
        jobFilters.forEach(filter => {
            filter.addEventListener('click', function() {
                const filterValue = this.getAttribute('data-filter');
                
                // Update active filter
                jobFilters.forEach(f => f.classList.remove('active'));
                this.classList.add('active');
                
                // Filter job listings
                jobListings.forEach(listing => {
                    const department = listing.getAttribute('data-department');
                    
                    if (filterValue === 'all' || filterValue === department) {
                        listing.style.display = 'flex';
                        setTimeout(() => {
                            listing.style.opacity = '1';
                        }, 10);
                    } else {
                        listing.style.opacity = '0';
                        setTimeout(() => {
                            listing.style.display = 'none';
                        }, 300);
                    }
                });
            });
        });
    }
    
    // ===== BLOG SEARCH =====
    const blogSearch = document.querySelector('.sidebar-search');
    
    if (blogSearch) {
        const searchInput = blogSearch.querySelector('input');
        const searchButton = blogSearch.querySelector('button');
        
        searchButton.addEventListener('click', function() {
            performBlogSearch(searchInput.value);
        });
        
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performBlogSearch(this.value);
            }
        });
    }
    
    // ===== COMMENT FORM =====
    const commentForm = document.getElementById('commentForm');
    
    if (commentForm) {
        commentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(this);
            const data = Object.fromEntries(formData);
            
            // Basic validation
            if (!data.name || !data.email || !data.comment) {
                showNotification('Please fill in all required fields', 'error');
                return;
            }
            
            if (!validateEmail(data.email)) {
                showNotification('Please enter a valid email address', 'error');
                return;
            }
            
            // Simulate form submission
            showNotification('Submitting your comment...', 'info');
            
            setTimeout(() => {
                showNotification('Comment submitted successfully! It will appear after approval.', 'success');
                this.reset();
            }, 2000);
        });
    }
    
    // ===== SMOOTH SCROLL FOR ANCHOR LINKS =====
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            if (href !== '#') {
                e.preventDefault();
                const target = document.querySelector(href);
                
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });
    
    // ===== UTILITY FUNCTIONS =====
    
    function performBlogSearch(query) {
        if (!query.trim()) {
            showNotification('Please enter a search term', 'warning');
            return;
        }
        
        showNotification(`Searching for: "${query}"`, 'info');
        
        // In a real implementation, this would be an AJAX request
        setTimeout(() => {
            showNotification(`Found 5 results for "${query}"`, 'success');
        }, 1000);
    }
    
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    function showNotification(message, type = 'info') {
        // Remove existing notification
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : type === 'warning' ? '#ff9800' : '#2196F3'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        // Add keyframes for animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(notification);
        
        // Add close button functionality
        const closeButton = notification.querySelector('.notification-close');
        closeButton.addEventListener('click', () => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        });
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }
    
    // ===== FAQ ACCORDION =====
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', () => {
            // Close other items
            faqItems.forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('active')) {
                    otherItem.classList.remove('active');
                }
            });
            
            // Toggle current item
            item.classList.toggle('active');
        });
    });
    
    // ===== BACK TO TOP BUTTON =====
    const backToTopButton = document.createElement('button');
    backToTopButton.innerHTML = '<i class="fas fa-chevron-up"></i>';
    backToTopButton.className = 'back-to-top';
    backToTopButton.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 50px;
        height: 50px;
        background: var(--primary);
        color: white;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        display: none;
        align-items: center;
        justify-content: center;
        font-size: 1.2rem;
        z-index: 1000;
        box-shadow: 0 5px 15px rgba(42, 157, 143, 0.3);
        transition: all 0.3s;
    `;
    
    document.body.appendChild(backToTopButton);
    
    backToTopButton.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            backToTopButton.style.display = 'flex';
        } else {
            backToTopButton.style.display = 'none';
        }
    });
    
    // ===== ANIMATE ELEMENTS ON SCROLL =====
    const animateOnScroll = () => {
        const elements = document.querySelectorAll('.service-feature, .pricing-card, .team-member, .case-study-card');
        
        elements.forEach(element => {
            const elementPosition = element.getBoundingClientRect().top;
            const screenPosition = window.innerHeight / 1.2;
            
            if (elementPosition < screenPosition) {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }
        });
    };
    
    // Set initial state for animated elements
    document.querySelectorAll('.service-feature, .pricing-card, .team-member, .case-study-card').forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    });
    
    window.addEventListener('scroll', animateOnScroll);
    animateOnScroll(); // Initial check
});