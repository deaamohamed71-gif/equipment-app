// js/help.js - كود صفحة التعليمات

document.addEventListener('DOMContentLoaded', function() {
    console.log('📖 صفحة التعليمات - مرحباً بك!');
    
    // إضافة تأثير عند التمرير على البطاقات
    const cards = document.querySelectorAll('.help-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transition = 'all 0.3s ease';
        });
    });
});