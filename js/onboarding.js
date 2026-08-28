// js/onboarding.js - كود صفحة الترحيب

(function() {
    const slides = document.querySelectorAll('.onboarding-slide');
    const dots = document.querySelectorAll('.dot');
    const nextBtn = document.getElementById('nextBtn');
    const skipBtn = document.getElementById('skipBtn');
    const startBtn = document.getElementById('startBtn');
    let currentIndex = 0;
    const totalSlides = slides.length;

    // تحديث العرض
    function updateSlide(index) {
        slides.forEach(s => s.classList.remove('active'));
        dots.forEach(d => d.classList.remove('active'));
        
        slides[index].classList.add('active');
        dots[index].classList.add('active');
        
        if (index === totalSlides - 1) {
            nextBtn.style.display = 'none';
            startBtn.style.display = 'inline-flex';
        } else {
            nextBtn.style.display = 'inline-flex';
            startBtn.style.display = 'none';
        }
        
        currentIndex = index;
    }

    // التالي
    function nextSlide() {
        if (currentIndex < totalSlides - 1) {
            updateSlide(currentIndex + 1);
        }
    }

    // تخطي
    function skipOnboarding() {
        localStorage.setItem('onboarding_completed', 'true');
        window.location.href = 'index.html';
    }

    // بدء
    function startApp() {
        localStorage.setItem('onboarding_completed', 'true');
        window.location.href = 'index.html';
    }

    // أحداث
    nextBtn.addEventListener('click', nextSlide);
    skipBtn.addEventListener('click', skipOnboarding);
    startBtn.addEventListener('click', startApp);

    // النقر على النقاط
    dots.forEach((dot, index) => {
        dot.addEventListener('click', function() {
            updateSlide(index);
        });
    });

    // Keyboard events
    document.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            nextSlide();
        }
        if (e.key === 'Escape') {
            skipOnboarding();
        }
        if (e.key === 'Enter' && currentIndex === totalSlides - 1) {
            startApp();
        }
    });

    // Touch events للموبايل
    let touchStartX = 0;
    let touchEndX = 0;
    
    document.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].screenX;
    });
    
    document.addEventListener('touchend', function(e) {
        touchEndX = e.changedTouches[0].screenX;
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;
        
        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                nextSlide();
            } else {
                if (currentIndex > 0) {
                    updateSlide(currentIndex - 1);
                }
            }
        }
    });

    // التحقق من زيارة المستخدم
    if (localStorage.getItem('onboarding_completed') === 'true') {
        window.location.href = 'index.html';
    }
})();