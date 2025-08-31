// ===== SMOOTH SCROLLING =====
document.addEventListener('DOMContentLoaded', function() {
    // Smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const offsetTop = targetSection.offsetTop - 80; // Account for fixed navbar
                
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });

    // ===== NAVBAR BACKGROUND ON SCROLL =====
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(15, 23, 42, 0.95)';
            navbar.style.backdropFilter = 'blur(20px)';
        } else {
            navbar.style.background = 'rgba(15, 23, 42, 0.8)';
            navbar.style.backdropFilter = 'blur(20px)';
        }
    });

    // ===== SCROLL ANIMATIONS =====
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    // Observe elements for scroll animations
    const animateElements = document.querySelectorAll('.portfolio-item, .service-card, .text-testimonial, .contact-card');
    animateElements.forEach(el => {
        el.classList.add('fade-in');
        observer.observe(el);
    });

    // ===== PARALLAX EFFECT =====
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const parallaxElements = document.querySelectorAll('.hero-bg');
        
        parallaxElements.forEach(element => {
            const speed = 0.5;
            element.style.transform = `translateY(${scrolled * speed}px)`;
        });
    });

    // ===== HERO TITLE - STATIC TEXT =====
    // Анимация печатания убрана, оставлен статичный красивый текст

    // ===== PORTFOLIO ITEM CLICK HANDLERS =====
    const portfolioButtons = document.querySelectorAll('.portfolio-content .btn');
    
    portfolioButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get project info from the portfolio item
            const portfolioItem = this.closest('.portfolio-item');
            const projectTitle = portfolioItem.querySelector('h4').textContent;
            const projectDesc = portfolioItem.querySelector('p').textContent;
            
            // Show modal or navigate to project page
            showProjectModal(projectTitle, projectDesc);
        });
    });

    // ===== CONTACT FORM HANDLING =====
    const contactForm = document.querySelector('#contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Данные формы
            const name = this.querySelector('input[name="name"]').value.trim();
            const phone = this.querySelector('input[name="phone"]').value.trim();

            if (!name) {
                showNotification('Пожалуйста, укажите имя', 'error');
                return;
            }

            // Чтение конфигурации Телеграм из meta
            const botToken = document.querySelector('meta[name="tg-bot-token"]').getAttribute('content');
            let chatId = document.querySelector('meta[name="tg-chat-id"]').getAttribute('content');
            const tgUsername = (document.querySelector('meta[name="tg-username"]')?.getAttribute('content') || '').replace('@','');

            if (!botToken) {
                showNotification('Не задан токен Telegram-бота', 'error');
                return;
            }

            // Функция отправки в Telegram (после определения chat_id)
            const sendToTelegram = (resolvedChatId) => {
                const text = `Новая заявка с сайта%0A%0A` +
                    `Имя: ${encodeURIComponent(name)}%0A` +
                    `Телефон: ${encodeURIComponent(phone || '-') }`;

                const url = `https://api.telegram.org/bot${botToken}/sendMessage?chat_id=${resolvedChatId}&parse_mode=HTML&text=${text}`;

                fetch(url, { method: 'GET' })
                    .then(res => {
                        if (!res.ok) throw new Error('Telegram API error');
                        showNotification('Заявка отправлена в Telegram!', 'success');
                        document.querySelector('meta[name="tg-chat-id"]').setAttribute('content', resolvedChatId);
                        localStorage.setItem('tg_chat_id_cache', resolvedChatId);
                        this.reset();
                    })
                    .catch(() => {
                        showNotification('Не удалось отправить заявку в Telegram', 'error');
                    });
            };

            // Если chat_id не указан — пробуем взять из localStorage или подсказать пользователю
            if (!chatId || chatId.includes('PASTE_')) {
                const cached = localStorage.getItem('tg_chat_id_cache');
                if (cached) {
                    chatId = cached;
                    sendToTelegram(chatId);
                } else {
                    showNotification('Отправьте любое сообщение вашему боту в Telegram, затем повторите отправку формы.', 'info');
                    // Попытка получить updates и вытащить ваш chat_id
                    fetch(`https://api.telegram.org/bot${botToken}/getUpdates`)
                        .then(r => r.json())
                        .then(data => {
                            const updates = (data && data.result) || [];
                            // Ищем личный диалог с указанным username, иначе берём первый найденный chat
                            let foundId = null;
                            for (const up of updates) {
                                const chat = up.message?.chat || up.channel_post?.chat || up.edited_message?.chat;
                                if (!chat) continue;
                                if (tgUsername && (chat.username || '').toLowerCase() === tgUsername.toLowerCase()) {
                                    foundId = chat.id;
                                    break;
                                }
                                if (!foundId && chat.type === 'private') {
                                    foundId = chat.id; // запасной вариант
                                }
                            }
                            if (foundId) {
                                showNotification(`Определён chat_id: ${foundId}`, 'success');
                                sendToTelegram(foundId);
                            } else {
                                showNotification('Не удалось определить chat_id. Напишите сообщение боту и повторите.', 'error');
                            }
                        })
                        .catch(() => showNotification('Ошибка получения updates. Укажите chat_id вручную.', 'error'));
                }
                return;
            }

            // Если chat_id уже задан — отправляем
            sendToTelegram(chatId);
        });
    }



    // ===== MOBILE MENU HANDLING =====
    const navbarToggler = document.querySelector('.navbar-toggler');
    const navbarCollapse = document.querySelector('.navbar-collapse');
    
    if (navbarToggler && navbarCollapse) {
        // Close mobile menu when clicking on a link
        const mobileNavLinks = navbarCollapse.querySelectorAll('.nav-link');
        
        mobileNavLinks.forEach(link => {
            link.addEventListener('click', function() {
                if (window.innerWidth < 992) {
                    navbarCollapse.classList.remove('show');
                }
            });
        });
    }

    // ===== SCROLL TO TOP BUTTON =====
    const scrollToTopBtn = document.createElement('button');
    scrollToTopBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
    scrollToTopBtn.className = 'scroll-to-top';
    scrollToTopBtn.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 50px;
        height: 50px;
        background: linear-gradient(135deg, #4f46e5, #7c3aed);
        border: none;
        border-radius: 50%;
        color: white;
        font-size: 1.2rem;
        cursor: pointer;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        z-index: 1000;
        box-shadow: 0 4px 15px rgba(79, 70, 229, 0.4);
    `;
    
    document.body.appendChild(scrollToTopBtn);
    
    // Show/hide scroll to top button
    window.addEventListener('scroll', function() {
        if (window.scrollY > 300) {
            scrollToTopBtn.style.opacity = '1';
            scrollToTopBtn.style.visibility = 'visible';
        } else {
            scrollToTopBtn.style.opacity = '0';
            scrollToTopBtn.style.visibility = 'hidden';
        }
    });
    
    // Scroll to top functionality
    scrollToTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // ===== LOADING ANIMATION =====
    window.addEventListener('load', function() {
        document.body.classList.add('loaded');
        
        // Убираем анимацию появления для hero элементов
        // const heroElements = document.querySelectorAll('.hero-text > *');
        // heroElements.forEach((element, index) => {
        //     element.style.animationDelay = `${index * 0.2}s`;
        //     element.classList.add('animate-fade-in');
        // });
    });

    // ===== HOVER EFFECTS FOR SERVICE CARDS =====
    const serviceCards = document.querySelectorAll('.service-card');
    
    serviceCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });

    // ===== INTERACTIVE HOVER FOR PORTFOLIO CARDS (like team, without image crop) =====
    const portfolioCards = document.querySelectorAll('.portfolio-item');

    portfolioCards.forEach(card => {
        let rafId = null;

        function handleMove(e) {
            const rect = card.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width; // 0..1
            const y = (e.clientY - rect.top) / rect.height; // 0..1

            const rotateY = (x - 0.5) * 8; // tilt left/right
            const rotateX = (0.5 - y) * 8; // tilt up/down
            const translateZ = 10; // subtle pop

            if (rafId) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
                card.style.transform = `translateY(-6px) perspective(700px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(${translateZ}px)`;
                card.style.boxShadow = '0 25px 50px -12px rgba(0,0,0,0.35)';
            });
        }

        function handleLeave() {
            if (rafId) cancelAnimationFrame(rafId);
            card.style.transform = 'translateY(0) perspective(700px) rotateX(0deg) rotateY(0deg) translateZ(0)';
            card.style.boxShadow = '';
        }

        card.addEventListener('mousemove', handleMove);
        card.addEventListener('mouseleave', handleLeave);
        card.addEventListener('mouseenter', () => {
            card.style.transition = 'transform 0.12s ease, box-shadow 0.2s ease';
        });
    });

    // ===== COUNTER ANIMATION =====
    function animateCounter(element, target, duration = 2000) {
        let start = 0;
        const increment = target / (duration / 16);
        
        const timer = setInterval(() => {
            start += increment;
            if (start >= target) {
                element.textContent = target;
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(start);
            }
        }, 16);
    }

    // ===== UTILITY FUNCTIONS =====
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 2rem;
            border-radius: 10px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            transform: translateX(100%);
            transition: all 0.3s ease;
            max-width: 300px;
        `;
        
        // Set background color based on type
        switch(type) {
            case 'success':
                notification.style.background = 'linear-gradient(135deg, #10b981, #059669)';
                break;
            case 'error':
                notification.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
                break;
            default:
                notification.style.background = 'linear-gradient(135deg, #4f46e5, #7c3aed)';
        }
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after 5 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 5000);
    }

    function showProjectModal(title, description) {
        const modal = document.createElement('div');
        modal.className = 'project-modal';
        modal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>${title}</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p>${description}</p>
                        <div class="modal-actions">
                            <button class="btn btn-primary">Посмотреть проект</button>
                            <button class="btn btn-outline-light">Закрыть</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        const overlay = modal.querySelector('.modal-overlay');
        overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(10px);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
        `;
        
        const content = modal.querySelector('.modal-content');
        content.style.cssText = `
            background: rgba(15, 23, 42, 0.95);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 20px;
            padding: 2rem;
            max-width: 500px;
            width: 100%;
            color: white;
            position: relative;
        `;
        
        const closeBtn = modal.querySelector('.modal-close');
        closeBtn.style.cssText = `
            position: absolute;
            top: 1rem;
            right: 1rem;
            background: none;
            border: none;
            color: white;
            font-size: 1.5rem;
            cursor: pointer;
            padding: 0.5rem;
        `;
        
        document.body.appendChild(modal);
        
        // Close modal functionality
        const closeModal = () => {
            document.body.removeChild(modal);
        };
        
        closeBtn.addEventListener('click', closeModal);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal();
        });
        
        const closeButtons = modal.querySelectorAll('.btn-outline-light, .btn-primary');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', closeModal);
        });
    }

    // ===== ADDITIONAL ANIMATIONS =====
    
    // Floating animation for profile image
    const profileImage = document.querySelector('.profile-image');
    if (profileImage) {
        let floatY = 0;
        let floatDirection = 1;
        
        function animateFloat() {
            floatY += 0.02 * floatDirection;
            
            if (floatY > 1) {
                floatDirection = -1;
            } else if (floatY < -1) {
                floatDirection = 1;
            }
            
            profileImage.style.transform = `translateY(${floatY * 10}px)`;
            requestAnimationFrame(animateFloat);
        }
        
        animateFloat();
    }

    // Particle effect for hero section
    function createParticles() {
        const heroSection = document.querySelector('.hero-section');
        if (!heroSection) return;
        
        for (let i = 0; i < 50; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.cssText = `
                position: absolute;
                width: 2px;
                height: 2px;
                background: rgba(79, 70, 229, 0.6);
                border-radius: 50%;
                pointer-events: none;
                animation: float-particle ${Math.random() * 10 + 10}s linear infinite;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
            `;
            
            heroSection.appendChild(particle);
        }
    }
    
    // Add particle animation CSS
    const particleStyle = document.createElement('style');
    particleStyle.textContent = `
        @keyframes float-particle {
            0% {
                transform: translateY(100vh) rotate(0deg);
                opacity: 0;
            }
            10% {
                opacity: 1;
            }
            90% {
                opacity: 1;
            }
            100% {
                transform: translateY(-100px) rotate(360deg);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(particleStyle);
    
    // Create particles
    createParticles();

    // ===== PERFORMANCE OPTIMIZATION =====
    
    // Throttle scroll events
    let ticking = false;
    
    function updateOnScroll() {
        // Scroll-based animations here
        ticking = false;
    }
    
    window.addEventListener('scroll', function() {
        if (!ticking) {
            requestAnimationFrame(updateOnScroll);
            ticking = true;
        }
    });

    // ===== ACCESSIBILITY IMPROVEMENTS =====
    
    // Add keyboard navigation support
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            // Close any open modals
            const modals = document.querySelectorAll('.project-modal');
            modals.forEach(modal => {
                document.body.removeChild(modal);
            });
        }
    });

    // Add focus management for better accessibility
    const focusableElements = document.querySelectorAll('button, a, input, textarea, select');
    focusableElements.forEach(element => {
        element.addEventListener('focus', function() {
            this.style.outline = '2px solid #4f46e5';
            this.style.outlineOffset = '2px';
        });
        
        element.addEventListener('blur', function() {
            this.style.outline = 'none';
        });
    });
});

// ===== ADDITIONAL GLOBAL FUNCTIONS =====

// Utility function to debounce function calls
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Utility function to throttle function calls
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Export functions for potential external use
window.VebMasterUtils = {
    showNotification,
    debounce,
    throttle
}; 