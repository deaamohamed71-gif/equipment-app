// js/landing.js - كود صفحة الهبوط (محدث بالكامل)

document.addEventListener('DOMContentLoaded', function() {
    
    // ====== قائمة الموبايل ======
    const menuToggle = document.getElementById('menuToggle');
    const nav = document.querySelector('.landing-nav');
    
    if (menuToggle && nav) {
        menuToggle.addEventListener('click', function() {
            nav.classList.toggle('open');
        });
    }
    
    // ====== إغلاق القائمة عند النقر على رابط ======
    document.querySelectorAll('.landing-nav a').forEach(link => {
        link.addEventListener('click', function() {
            if (nav) nav.classList.remove('open');
        });
    });
    
    // ====== تأثير تمرير سلس - مع تجنب الأخطاء ======
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        // ✅ تجاهل الروابط اللي فيها href="#" فقط
        if (anchor.getAttribute('href') === '#') {
            return;
        }
        
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId && targetId !== '#') {
                const target = document.querySelector(targetId);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });
    
    // ====== تأثير ظهور العناصر عند التمرير ======
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    document.querySelectorAll('.feature-card, .pricing-card, .testimonial-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.6s ease';
        observer.observe(el);
    });
    
    // ====== تأثير الظهور عند التمرير ======
    document.addEventListener('scroll', function() {
        document.querySelectorAll('.feature-card, .pricing-card, .testimonial-card').forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight - 100) {
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }
        });
    });
    
    console.log('🚀 Landing Page - مرحباً بك!');
});
