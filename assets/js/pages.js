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
                showPageNotification(`Downloading "${resourceName}"...`, 'info');
                
                // Simulate download
                setTimeout(() => {
                    showPageNotification('Download complete!', 'success');
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
                showPageNotification('Please fill in all required fields', 'error');
                return;
            }
            
            if (!validateEmail(data.email)) {
                showPageNotification('Please enter a valid email address', 'error');
                return;
            }
            
            // Simulate form submission
            showPageNotification('Submitting your comment...', 'info');
            
            setTimeout(() => {
                showPageNotification('Comment submitted successfully! It will appear after approval.', 'success');
                this.reset();
            }, 2000);
        });
    }
    
    // ===== FAQ ACCORDION =====
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        if (question) {
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
        }
    });
    
    // ===== ANIMATE ELEMENTS ON SCROLL =====
    const animateOnScroll = () => {
        const elements = document.querySelectorAll('.service-feature, .pricing-card, .team-member, .case-study-card, .resource-category, .compliance-card');
        
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
    const animatedElements = document.querySelectorAll('.service-feature, .pricing-card, .team-member, .case-study-card, .resource-category, .compliance-card');
    
    animatedElements.forEach(element => {
        // Only set if not already animated
        if (!element.classList.contains('animated')) {
            element.style.opacity = '0';
            element.style.transform = 'translateY(30px)';
            element.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        }
    });
    
    // Initial check
    animateOnScroll();
    
    // Throttle scroll event for performance
    let isScrolling = false;
    window.addEventListener('scroll', () => {
        if (!isScrolling) {
            window.requestAnimationFrame(() => {
                animateOnScroll();
                isScrolling = false;
            });
            isScrolling = true;
        }
    });
    
    // ===== CONTENT WITH SIDEBAR INTERACTIONS =====
    const sidebarSearchForms = document.querySelectorAll('.sidebar-search');
    
    sidebarSearchForms.forEach(form => {
        const input = form.querySelector('input');
        const button = form.querySelector('button');
        
        if (button && input) {
            button.addEventListener('click', () => {
                if (input.value.trim()) {
                    showPageNotification(`Searching for: "${input.value}"`, 'info');
                }
            });
            
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && input.value.trim()) {
                    showPageNotification(`Searching for: "${input.value}"`, 'info');
                }
            });
        }
    });
    
    // ===== NEWSLETTER FORM (PAGE SPECIFIC) =====
    const pageNewsletterForms = document.querySelectorAll('.newsletter-form');
    
    pageNewsletterForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const emailInput = this.querySelector('input[type="email"]');
            if (emailInput && emailInput.value.trim()) {
                showPageNotification('Thank you for subscribing to our newsletter!', 'success');
                emailInput.value = '';
            }
        });
    });
    
    // ===== TABBED CONTENT =====
    const tabButtons = document.querySelectorAll('[data-tab]');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            const tabContainer = this.closest('.tabs-container') || document;
            
            // Remove active class from all buttons in same container
            const allButtons = tabContainer.querySelectorAll('[data-tab]');
            allButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Hide all tab contents
            const tabContents = tabContainer.querySelectorAll('.tab-content');
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Show selected tab content
            const selectedTab = tabContainer.querySelector(`#${tabId}`);
            if (selectedTab) {
                selectedTab.classList.add('active');
            }
        });
    });
    
    // ===== ACCORDION TOGGLE (Alternative to FAQ) =====
    const accordionItems = document.querySelectorAll('.accordion-item');
    
    accordionItems.forEach(item => {
        const header = item.querySelector('.accordion-header');
        if (header) {
            header.addEventListener('click', () => {
                item.classList.toggle('active');
            });
        }
    });
    
    // ===== MODAL TRIGGERS IN PAGES =====
    const pageModalTriggers = document.querySelectorAll('[data-modal]');
    
    pageModalTriggers.forEach(trigger => {
        trigger.addEventListener('click', function() {
            const modalId = this.getAttribute('data-modal');
            const modal = document.getElementById(modalId);
            
            if (modal) {
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        });
    });
    
    // ===== COUNTER ANIMATION FOR STATS =====
    const statNumbers = document.querySelectorAll('.stat-number:not(.animated)');
    
    if (statNumbers.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    const target = parseInt(element.textContent) || parseInt(element.getAttribute('data-target')) || 0;
                    
                    if (target > 0) {
                        animateCounter(element, target);
                        element.classList.add('animated');
                        observer.unobserve(element);
                    }
                }
            });
        }, { threshold: 0.5 });
        
        statNumbers.forEach(stat => {
            observer.observe(stat);
        });
    }
    
    // ===== UTILITY FUNCTIONS (PAGE SPECIFIC) =====
    
    function performBlogSearch(query) {
        if (!query.trim()) {
            showPageNotification('Please enter a search term', 'warning');
            return;
        }
        
        showPageNotification(`Searching for: "${query}"`, 'info');
        
        // In a real implementation, this would be an AJAX request
        setTimeout(() => {
            showPageNotification(`Found results for "${query}"`, 'success');
        }, 1000);
    }
    
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    function showPageNotification(message, type = 'info') {
        // Check if main.js notification function exists
        if (typeof showNotification !== 'undefined') {
            showNotification(message, type);
            return;
        }
        
        // Fallback notification function
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        `;
        
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
            max-width: 400px;
        `;
        
        // Ensure animation styles exist
        if (!document.querySelector('#pages-notification-styles')) {
            const style = document.createElement('style');
            style.id = 'pages-notification-styles';
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
                @keyframes slideOut {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        const closeButton = notification.querySelector('.notification-close');
        closeButton.addEventListener('click', () => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        });
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }
    
    function animateCounter(element, target, duration = 2000) {
        let start = 0;
        const increment = target / (duration / 16);
        const timer = setInterval(() => {
            start += increment;
            if (start >= target) {
                element.textContent = formatNumber(target) + (element.getAttribute('data-suffix') || '');
                clearInterval(timer);
            } else {
                element.textContent = formatNumber(Math.floor(start)) + (element.getAttribute('data-suffix') || '');
            }
        }, 16);
    }
    
    function formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }
    
    // ===== INITIALIZE PAGE SPECIFIC FEATURES =====
    
    // Add loading class to body for CSS transitions
    document.body.classList.add('page-loaded');
    
    // Initialize tooltips
    const pageTooltips = document.querySelectorAll('[title]');
    pageTooltips.forEach(element => {
        element.addEventListener('mouseenter', showTooltip);
        element.addEventListener('mouseleave', hideTooltip);
    });
    
    function showTooltip(e) {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = this.getAttribute('title');
        
        const rect = this.getBoundingClientRect();
        tooltip.style.cssText = `
            position: fixed;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 0.85rem;
            white-space: nowrap;
            z-index: 1000;
            top: ${rect.bottom + 5}px;
            left: ${rect.left + (rect.width / 2)}px;
            transform: translateX(-50%);
        `;
        
        document.body.appendChild(tooltip);
        this.tooltipElement = tooltip;
    }
    
    function hideTooltip() {
        if (this.tooltipElement) {
            this.tooltipElement.remove();
            this.tooltipElement = null;
        }
    }
    
    // ===== LAZY LOAD IMAGES IN PAGES =====
    const pageLazyImages = document.querySelectorAll('img[loading="lazy"]');
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.getAttribute('src') || img.getAttribute('data-src');
                    img.classList.add('loaded');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        pageLazyImages.forEach(img => imageObserver.observe(img));
    }
    
    // ===== FORM ENHANCEMENTS =====
    const pageTextareas = document.querySelectorAll('textarea');
    
    pageTextareas.forEach(textarea => {
        // Auto-resize textarea
        textarea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
        
        // Trigger initial resize
        textarea.dispatchEvent(new Event('input'));
    });
    
    // ===== KEYBOARD SHORTCUTS =====
    document.addEventListener('keydown', function(e) {
        // Close modals with Escape key
        if (e.key === 'Escape') {
            const activeModal = document.querySelector('.modal.active');
            if (activeModal) {
                activeModal.classList.remove('active');
                document.body.style.overflow = '';
            }
        }
        
        // Focus search with Ctrl+K or Cmd+K
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const searchInput = document.querySelector('.sidebar-search input, [type="search"]');
            if (searchInput) {
                searchInput.focus();
            }
        }
    });
    
});